from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.utils.metrics import generate_research_summary
from datetime import datetime, timezone
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
import redis.asyncio as redis
import time
import json
import os
from contextlib import asynccontextmanager
from app.configs.database import connect_to_mongo, close_mongo_connection, db_instance

load_dotenv()

# Relative-style imports from the app directory
from app.configs.security import verify_api_key
from app.schemas.schema import (
    APIResSchema,
    AnalyzeRequest,
    ResearchAnalyticsResponse,
    ResearchSummarySchema,
    SummaryRequest,
)
from app.services.gemini_service import call_gemini

# from app.services.openai_service import call_openai
from app.services.groq_service import call_groq
from app.services.mistral_service import call_mistral


REDIS_URL = os.getenv("UPSTASH_REDIS_URL")

# 3. Create the global redis_client instance
# This defines the object so your /summary endpoint can find it
redis_client = redis.Redis.from_url(REDIS_URL or "", decode_responses=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the server starts
    await connect_to_mongo()
    yield
    # This runs when the server shuts down
    await close_mongo_connection()


app = FastAPI(title="NLP Sentiment Research Backend", lifespan=lifespan)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL EXCEPTION HANDLERS (Fatal Backend Errors) ---


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Catches 422 Errors: When the frontend sends bad JSON
    (e.g., missing brackets, wrong data types, or missing required fields like 'text').
    """
    print(f"\n[FATAL ERROR] 422 Validation Error on {request.url}")
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "http_status_code": 422,
            "error_message": "Invalid JSON payload format or missing required fields.",
            "details": exc.errors(),  # This tells the frontend exactly which field was missing
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches 500 Errors: When the backend completely crashes
    (e.g., MongoDB connection refused, dividing by zero, missing .env variables).
    """
    print(f"\n[FATAL ERROR] 500 Internal Crash on {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "http_status_code": 500,
            "error_message": f"Internal Backend Error: {str(exc)}",
        },
    )


@app.get("/")
def home():
    return JSONResponse(content={"status": "site working"}, status_code=200)


@app.get("/health", tags=["System Maintenance"])
async def health_check():
    """
    Production-ready health check endpoint.
    Used by cloud load balancers to verify service uptime.
    """
    # In a fully scaled app, you might also await a quick DB ping here

    health_data = {
        "status": "healthy",
        "environment": "production",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "dependencies": {
            "gemini_api": "configured",
            "openai_api": "configured",
            "groq_api": "configured",
        },
    }

    return JSONResponse(
        content=health_data,
        status_code=200,
        headers={
            "Cache-Control": "no-cache"
        },  # Prevents cloud providers from caching a "healthy" state if it goes down
    )


@app.post(
    "/api/analyze/gemini",
    dependencies=[Depends(verify_api_key)],
    response_model=APIResSchema,
)
async def analyze_gemini(req: AnalyzeRequest):
    print("*" * 50)
    print("Started Gemini")
    result = await call_gemini(req.text, req.model_gemini)
    print(f"Length of req text: {len(req.text)}")
    print("End Gemini")
    print("*" * 50)
    return result


@app.post(
    "/api/analyze/groq",
    dependencies=[Depends(verify_api_key)],
    response_model=APIResSchema,
)
async def analyze_groq(req: AnalyzeRequest):
    print("*" * 50)
    print("Started Groq")
    result = await call_groq(req.text, req.model_groq)
    print(f"Length of req text: {len(req.text)}")
    print("Ended Groq")
    print("*" * 50)
    return result


@app.post(
    "/api/analyze/mistral",
    dependencies=[Depends(verify_api_key)],
    response_model=APIResSchema,
)
async def analyze_mistral(req: AnalyzeRequest):
    print("*" * 50)
    print("Started mistral")
    result = await call_mistral(req.text, req.model_mistral)
    print(f"Length of req text: {len(req.text)}")
    print("Ended mistral")
    print("*" * 50)
    return result


@app.post(
    "/api/analyze/summary",
    response_model=ResearchSummarySchema,
    dependencies=[Depends(verify_api_key)],
)
async def get_summary(payload: SummaryRequest):
    """
    Expects a SummaryRequest object containing the APIResSchema responses
    from the individual LLM endpoints.
    """
    print("\n" + "=" * 50)
    print("[AGGREGATOR] Received bundle from frontend. Calculating metrics.")

    formatted_data = {}

    # .model_dump(exclude_none=True) safely drops any LLM that wasn't sent
    # so we only calculate metrics on the models that actually ran.
    for provider, p_data_dict in payload.model_dump(exclude_none=True).items():
        formatted_data[provider] = {
            "status": p_data_dict.get("status"),
            f"{provider}_api_latency": p_data_dict.get("api_latency_ms"),
            "data": p_data_dict,
        }

    summary = generate_research_summary(formatted_data)
    summary["cloud_environment"] = os.getenv("CLOUD_PROVIDER", "Unknown")

    if db_instance.db is not None:
        try:
            # We bundle everything together into a single "Research Run" document
            research_document = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "test_text_preview": "Saved on Frontend, referenced here",  # Optional
                "cloud_environment": summary["cloud_environment"],
                "summary_metrics": summary,
                "raw_responses": payload.model_dump(exclude_none=True),
            }

            # ==========================================
            # CYCLE 1: The Race (True Payload Measurement)
            # ==========================================

            # A. The DB Race
            db_start = time.perf_counter()
            insert_result = await db_instance.db.research_runs.insert_one(
                research_document
            )
            db_write_ms = round((time.perf_counter() - db_start) * 1000, 3)
            inserted_id = insert_result.inserted_id

            # B. The Cache Race (Write-Through Injection)
            # We inject the Mongo _id so the cache perfectly mirrors the DB
            research_document["_id"] = str(inserted_id)
            cache_payload = json.dumps(research_document)

            cache_write_ms = None
            try:
                # 1. Start the main stopwatch for the entire process
                cache_start = time.perf_counter()

                # Execute the Write
                await redis_client.lpush("cache:history", cache_payload) # type: ignore

                # 2. Start the sub-stopwatch just for the Trim
                trim_start = time.perf_counter()

                # Execute the Trim
                await redis_client.ltrim("cache:history", 0, 99) # pyright: ignore[reportGeneralTypeIssues]

                # 3. Stop the clocks
                total_end = time.perf_counter()

                # Calculate raw milliseconds
                total_ms = (total_end - cache_start) * 1000
                trim_ms = (total_end - trim_start) * 1000

                # The Subtraction Logic: Total time minus the housekeeping time
                cache_write_ms = round(total_ms - trim_ms, 3)

            except TypeError:
                # Fallback for synchronous execution, using the exact same math
                cache_start = time.perf_counter()
                redis_client.lpush("cache:history", cache_payload)

                trim_start = time.perf_counter()
                redis_client.ltrim("cache:history", 0, 99)

                total_end = time.perf_counter()

                total_ms = (total_end - cache_start) * 1000
                trim_ms = (total_end - trim_start) * 1000

                cache_write_ms = round(total_ms - trim_ms, 3)

            except Exception as e:
                print("[CACHE ERROR] Error in cache write: ", e)
                pass
            # ==========================================
            # CYCLE 2: The Silent Update (Patch)
            # ==========================================

            await db_instance.db.research_runs.update_one(
                {"_id": inserted_id},
                {
                    "$set": {
                        "summary_metrics.db_write_latency_ms": db_write_ms,
                        "summary_metrics.cache_write_latency_ms": cache_write_ms,
                    }
                },
            )

            # Add to the Python dictionary so it returns to the React frontend
            summary["db_write_latency_ms"] = db_write_ms
            summary["cache_write_latency_ms"] = cache_write_ms

            print(f"[BENCHMARK] Database Write: {db_write_ms}ms")
            print(f"[BENCHMARK] Cache Write: {cache_write_ms}ms")
            print("[DATABASE] Pipeline complete. Data permanently locked.")

        except Exception as e:
            print(f"[DATABASE ERROR] Insert-Measure-Update pipeline failed: {e}")
    else:
        print("[AGGREGATOR] db_instance.db is None.")

    print("[AGGREGATOR] Metrics calculated. Sending to frontend.")
    print("=" * 50 + "\n")

    return summary


@app.get("/api/research/history", dependencies=[Depends(verify_api_key)])
async def get_research_history():
    """
    Fetches the 20 most recent research runs from MongoDB,
    performs a Shadow Read on Redis, logs the read speeds,
    and returns a structured JSON payload to the frontend.
    """
    print("\n" + "=" * 50)
    print("[DATABASE] Fetching history & benchmarking reads...")

    if db_instance.db is None:
        raise HTTPException(
            status_code=503, detail="Database connection not initialized"
        )

    try:
        # ==========================================
        # 1. The Cache Benchmark (Shadow Read)
        # ==========================================
        cache_start = time.perf_counter()
        cache_read_ms = None  # Start as None. It only gets a number if successful.

        try:
            # Try the strict async way first
            await redis_client.lrange("cache:history", 0, 19) # pyright: ignore[reportGeneralTypeIssues]
            cache_read_ms = round((time.perf_counter() - cache_start) * 1000, 3)

        except TypeError:
            # THE FIX: If Python says "list is not awaitable", it means
            # it actually executed synchronously. We capture the time here!
            redis_client.lrange("cache:history", 0, 19)
            cache_read_ms = round((time.perf_counter() - cache_start) * 1000, 3)

        except Exception as e:
            # If it's a REAL network crash (Upstash is down)
            print(f"[CACHE CAUGHT ERROR] {e}")
            # We 'pass'. Because cache_read_ms is already None, it will save as
            # 'null' in MongoDB, keeping your math perfectly clean!
            pass

        # ==========================================
        # 2. The True Database Read
        # ==========================================
        db_start = time.perf_counter()
        cursor = db_instance.db.research_runs.find().sort("timestamp", -1).limit(20)
        raw_documents = await cursor.to_list(length=20)
        db_read_ms = round((time.perf_counter() - db_start) * 1000, 3)

        # Clean up the ObjectId for JSON serialization
        history_data = []
        for doc in raw_documents:
            doc["_id"] = str(doc["_id"])
            history_data.append(doc)

        # ==========================================
        # 3. Save the Read Benchmark (Telemetry Log)
        # ==========================================
        benchmark_log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "operation": "history_fetch",
            "documents_retrieved": len(history_data),
            "db_read_ms": db_read_ms,
            "cache_read_ms": cache_read_ms,
            "cloud_environment": os.getenv("CLOUD_PROVIDER", "Unknown"),
        }
        await db_instance.db.read_benchmarks.insert_one(benchmark_log)

        print(f"[BENCHMARK] Cache Read: {cache_read_ms}ms | DB Read: {db_read_ms}ms")
        print("=" * 50 + "\n")

        # ==========================================
        # 4. Return the beautifully structured JSON
        # ==========================================
        return {
            "primary_data": history_data,
            "benchmark": {
                "db_read_latency_ms": db_read_ms,
                "cache_read_latency_ms": cache_read_ms,
                "documents_fetched": len(history_data),
            },
        }

    except Exception as e:
        print(f"[DATABASE ERROR] Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve history")


@app.get(
    "/api/research/analytics",
    response_model=ResearchAnalyticsResponse,
    dependencies=[Depends(verify_api_key)],
)
async def get_research_analytics(limit: int = 50):
    if db_instance.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        # ==========================================
        # 1. Fetch Cloud/LLM Data (From research_runs)
        # ==========================================
        cursor = db_instance.db.research_runs.find().sort("timestamp", -1).limit(limit)
        runs = await cursor.to_list(length=limit)

        if not runs:
            return {
                "analyzed_records": 0,
                "average_llm_latency_ms": {},
                "average_cloud_roundtrip_ms": {},
                "last_db_read_latency_ms": None,
                "last_cache_read_latency_ms": None
            }

        llm_latencies = {"gemini": [], "groq": [], "mistral": []}
        cloud_latencies = {}

        for run in runs:
            cloud_name = run.get("cloud_environment", "Unknown")
            if cloud_name not in cloud_latencies:
                cloud_latencies[cloud_name] = []

            raw = run.get("raw_responses", {})
            for provider in ["gemini", "groq", "mistral"]:
                p_data = raw.get(provider)
                if p_data and p_data.get("status") == "success":
                    # 1. Track LLM Compute time
                    llm_latencies[provider].append(p_data.get("api_latency_ms", 0))

                    # 2. Track the pure network overhead for this specific cloud
                    overhead = p_data.get("cloud_network_overhead_ms")
                    if overhead is not None:
                        cloud_latencies[cloud_name].append(overhead)

        def calc_avg(data_list):
            return round(sum(data_list) / len(data_list), 2) if data_list else None

        avg_llm_latency = {p: calc_avg(lats) for p, lats in llm_latencies.items()}
        # Now this mathematically proves exactly how much lag Azure/Vercel adds!
        avg_cloud_latency = {c: calc_avg(lats) for c, lats in cloud_latencies.items()}

        # ==========================================
        # 2. Fetch Read Benchmarks (From read_benchmarks)
        # ==========================================
        # Get the single most recent read benchmark
        read_cursor = db_instance.db.read_benchmarks.find().sort("timestamp", -1).limit(1)
        latest_read_logs = await read_cursor.to_list(length=1)
        
        last_db_read = None
        last_cache_read = None
        
        if latest_read_logs:
            last_db_read = latest_read_logs[0].get("db_read_ms")
            last_cache_read = latest_read_logs[0].get("cache_read_ms")

        # ==========================================
        # 3. Return the Full Schema
        # ==========================================
        return {
            "analyzed_records": len(runs),
            "average_llm_latency_ms": avg_llm_latency,
            "average_cloud_roundtrip_ms": avg_cloud_latency,
            "last_db_read_latency_ms": last_db_read,
            "last_cache_read_latency_ms": last_cache_read
        }

    except Exception as e:
        print(f"[ANALYTICS] Error calculating metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate analytics")


@app.get("/api/research/export", dependencies=[Depends(verify_api_key)])
async def export_research_data(skip: int = 0, limit: int = 100):
    """
    Exports raw research data from MongoDB for external data analysis.
    Supports pagination via 'skip' and 'limit' query parameters.
    """
    print(f"\n[DATABASE] Exporting data (skip={skip}, limit={limit})...")

    if db_instance.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        # Query MongoDB: sort descending, skip X records, limit to Y records
        cursor = (
            db_instance.db.research_runs.find()
            .sort("timestamp", -1)
            .skip(skip)
            .limit(limit)
        )
        runs = await cursor.to_list(length=limit)

        # Clean the ObjectId so FastAPI can serialize it to JSON properly
        for run in runs:
            run["_id"] = str(run["_id"])

        print(f"[DATABASE] Successfully exported {len(runs)} records.\n")

        return {
            "exported_records": len(runs),
            "skip": skip,
            "limit": limit,
            "data": runs,
        }

    except Exception as e:
        print(f"[EXPORT ERROR] Failed to fetch data: {e}")
        raise HTTPException(status_code=500, detail="Failed to export database records")


@app.get("/api/research/db-performance", dependencies=[Depends(verify_api_key)])
async def get_db_performance():
    """
    Aggregates the Read and Write latency benchmarks across MongoDB and Redis
    to serve the final performance comparison charts on the frontend.
    """
    print("\n" + "=" * 50)
    print("[ANALYTICS] Crunching Database vs Cache Performance Metrics...")

    if db_instance.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        # ==========================================
        # 1. Analyze WRITE Speeds (From research_runs)
        # ==========================================
        # We fetch the last 100 runs to get a solid average
        write_cursor = (
            db_instance.db.research_runs.find(
                {"summary_metrics.db_write_latency_ms": {"$ne": None}}
            )
            .sort("timestamp", -1)
            .limit(100)
        )

        write_docs = await write_cursor.to_list(length=100)

        db_writes = [
            d["summary_metrics"]["db_write_latency_ms"]
            for d in write_docs
            if "summary_metrics" in d
            and d["summary_metrics"].get("db_write_latency_ms")
        ]
        cache_writes = [
            d["summary_metrics"]["cache_write_latency_ms"]
            for d in write_docs
            if "summary_metrics" in d
            and d["summary_metrics"].get("cache_write_latency_ms")
        ]

        # ==========================================
        # 2. Analyze READ Speeds (From read_benchmarks)
        # ==========================================
        read_cursor = (
            db_instance.db.read_benchmarks.find({"db_read_ms": {"$ne": None}})
            .sort("timestamp", -1)
            .limit(100)
        )

        read_docs = await read_cursor.to_list(length=100)

        db_reads = [
            d.get("db_read_ms") for d in read_docs if d.get("db_read_ms") is not None
        ]
        cache_reads = [
            d.get("cache_read_ms")
            for d in read_docs
            if d.get("cache_read_ms") is not None
        ]

        # ==========================================
        # 3. Math Helpers & JSON Packaging
        # ==========================================
        def calc_avg(data_list):
            return round(sum(data_list) / len(data_list), 2) if data_list else 0.0

        def calc_speedup(slow, fast):
            if slow > 0 and fast > 0:
                return round(((slow - fast) / slow) * 100, 2)
            return 0.0

        avg_db_write, avg_cache_write = calc_avg(db_writes), calc_avg(cache_writes)
        avg_db_read, avg_cache_read = calc_avg(db_reads), calc_avg(cache_reads)

        response_data = {
            "write_metrics": {
                "data_points": len(db_writes),
                "average_db_ms": avg_db_write,
                "average_cache_ms": avg_cache_write,
                "cache_speedup_percent": calc_speedup(avg_db_write, avg_cache_write),
            },
            "read_metrics": {
                "data_points": len(db_reads),
                "average_db_ms": avg_db_read,
                "average_cache_ms": avg_cache_read,
                "cache_speedup_percent": calc_speedup(avg_db_read, avg_cache_read),
            },
        }

        print("[ANALYTICS] Math complete. Sending performance bundle to UI.")
        print("=" * 50 + "\n")
        return response_data

    except Exception as e:
        print(f"[ANALYTICS ERROR] Failed to calculate db analytics: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to calculate database performance"
        )


@app.get("/api/research/raw-metrics", dependencies=[Depends(verify_api_key)])
async def get_raw_performance_metrics():
    """
    Fetches the raw time-series data points for Read and Write latencies.
    Outputs clean arrays designed specifically for frontend charting libraries.
    """
    print("\n[ANALYTICS] Fetching raw time-series performance data...")

    if db_instance.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")

    try:
        # ==========================================
        # 1. Fetch Raw WRITE Data (Oldest to Newest)
        # ==========================================
        write_cursor = (
            db_instance.db.research_runs.find(
                {"summary_metrics.db_write_latency_ms": {"$ne": None}}
            )
            .sort("timestamp", 1)
            .limit(100)
        )

        write_docs = await write_cursor.to_list(length=100)

        write_data = []
        for doc in write_docs:
            metrics = doc.get("summary_metrics", {})
            # We standardize the keys to 'db_ms' and 'cache_ms' so the
            # frontend charting library can use the exact same logic for both graphs.
            write_data.append(
                {
                    "timestamp": doc.get("timestamp"),
                    "db_ms": metrics.get("db_write_latency_ms"),
                    "cache_ms": metrics.get("cache_write_latency_ms"),
                }
            )

        # ==========================================
        # 2. Fetch Raw READ Data (Oldest to Newest)
        # ==========================================
        read_cursor = (
            db_instance.db.read_benchmarks.find({"db_read_ms": {"$ne": None}})
            .sort("timestamp", 1)
            .limit(100)
        )

        read_docs = await read_cursor.to_list(length=100)

        read_data = []
        for doc in read_docs:
            read_data.append(
                {
                    "timestamp": doc.get("timestamp"),
                    "db_ms": doc.get("db_read_ms"),
                    "cache_ms": doc.get("cache_read_ms"),
                }
            )

        return {"writes": write_data, "reads": read_data}

    except Exception as e:
        print(f"[METRICS ERROR] Failed to fetch raw metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch raw data")


@app.post("/api/analyze", dependencies=[Depends(verify_api_key)])
async def analyze_sentiment(req: AnalyzeRequest):
    print("\n" + "=" * 50)
    print(f"[ORCHESTRATOR] Received text: '{req.text[:30]}...'")

    # 1. Fire all requests concurrently
    results = await asyncio.gather(
        call_gemini(req.text),
        call_mistral(req.text),
        call_groq(req.text),
        return_exceptions=True,
    )

    # 2. Map the results securely to your naming convention
    final_response = {}
    providers = ["gemini", "mistral", "groq"]

    for idx, result in enumerate(results):
        provider_name = providers[idx]

        # Explicit type check satisfies Pylance (No BaseException errors)
        if isinstance(result, APIResSchema):
            final_response[provider_name] = {
                "status": result.status,
                f"{provider_name}_api_latency": result.api_latency_ms,
                # Pydantic V2 uses model_dump() instead of dict()
                "data": result.model_dump(
                    exclude={"provider", "status", "api_latency_ms"}
                ),
            }
        else:
            # If it's an Exception, it falls here safely
            final_response[provider_name] = {
                "status": "error",
                f"{provider_name}_api_latency": 0.0,
                "error_message": "Internal Backend Exception: " + str(result),
            }

    final_response["research_summary"] = generate_research_summary(final_response)
    print("[ORCHESTRATOR] All LLMs returned. Sending payload to frontend.")
    print("=" * 50 + "\n")

    return final_response
