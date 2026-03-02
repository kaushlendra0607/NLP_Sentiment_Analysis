from typing import Dict, Any
from collections import Counter

def generate_research_summary(api_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes the parallel API responses to generate high-level research metrics.
    Expects the standard dictionary format output by the orchestrator.
    """
    summary = {
        "fastest_model": None,
        "fastest_latency_ms": None,
        "highest_tps_model": None,
        "highest_tps_value": None,
        "sentiment_consensus": None,
        "sarcasm_detected_by_majority": False,
        "successful_calls": 0,
        "failed_calls": 0
    }

    valid_latencies = {}
    valid_tps = {}
    tones = []
    sarcasm_votes = []

    # Iterate through the providers (gemini, openai, groq)
    for provider, response in api_results.items():
        if response.get("status") == "success":
            summary["successful_calls"] += 1
            
            # 1. Track Latency
            latency = response.get(f"{provider}_api_latency")
            if latency is not None:
                valid_latencies[provider] = latency
                
            data = response.get("data", {})
            
            # 2. Track TPS (Tokens Per Second)
            tps = data.get("output_tokens_per_second")
            if tps is not None:
                valid_tps[provider] = tps
                
            # 3. Track Sentiment Consensus
            tone = data.get("tone")
            if tone:
                tones.append(tone)
                
            # 4. Track Sarcasm
            sarcasm = data.get("sarcasm_flag")
            if sarcasm is not None:
                sarcasm_votes.append(sarcasm)
                
        else:
            summary["failed_calls"] += 1

    # --- Compute Research Winners ---

    if valid_latencies:
        # Find the dictionary key (provider) with the lowest latency value
        best_latency_provider = min(valid_latencies, key=lambda k: valid_latencies[k])
        summary["fastest_model"] = best_latency_provider
        summary["fastest_latency_ms"] = valid_latencies[best_latency_provider]
    else:
        summary["fastest_model"] = "N/A"
        summary["fastest_latency_ms"] = 0.0

    if valid_tps:
        # Find the dictionary key (provider) with the highest TPS value
        best_tps_provider = max(valid_tps, key=lambda k: valid_tps[k])
        summary["highest_tps_model"] = best_tps_provider
        summary["highest_tps_value"] = valid_tps[best_tps_provider]
    else:
        summary["highest_tps_model"] = "N/A"
        summary["highest_tps_value"] = 0.0

    if tones:
        # Calculate if the models agree on the tone
        tone_counts = Counter(tones)
        most_common = tone_counts.most_common(1)[0]
        
        if most_common[1] > 1 or summary["successful_calls"] == 1:
            summary["tone_consensus"] = most_common[0] # Renamed the key
        else:
            summary["tone_consensus"] = "No Consensus"

    if sarcasm_votes:
        sarcasm_counts = Counter(sarcasm_votes)
        # If more models voted True than False
        if sarcasm_counts.get(True, 0) > sarcasm_counts.get(False, 0):
            summary["sarcasm_detected_by_majority"] = True

    return summary