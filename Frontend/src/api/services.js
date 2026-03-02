import { apiClient } from './client';

/**
 * Fires the LLM endpoint, times the roundtrip, and calculates cloud network overhead.
 * @param {string} provider - 'gemini', 'groq', or 'mistral'
 * @param {object} payload - e.g., { text: "...", model_gemini: "gemini-2.5-flash" }
 */
export const analyzeProvider = async (provider, payload) => {
    // 1. Start the high-resolution timer
    const startTime = performance.now();

    try {
        const response = await apiClient.post(`/api/analyze/${provider}`, payload);

        // 2. Stop the timer
        const endTime = performance.now();
        const frontendTotal = parseFloat((endTime - startTime).toFixed(3));
        const backendLatency = response.data.api_latency_ms || 0;

        // 3. Inject the calculated research metrics into the response object
        return {
            ...response.data,
            frontend_total_latency_ms: frontendTotal,
            cloud_network_overhead_ms: parseFloat((frontendTotal - backendLatency).toFixed(3))
        };
    } catch (error) {
        // Extract the correct model name from the payload (e.g., payload.model_gemini)
        const modelKey = `model_${provider}`;
        const modelUsed = payload[modelKey] || 'unknown-model';

        // Perfectly matches the Pydantic APIResSchema
        return {
            provider: provider,
            model_used: modelUsed,
            status: "error",
            api_latency_ms: 0,
            frontend_total_latency_ms: null,
            cloud_network_overhead_ms: null,
            error_message: error.customData?.error_message || error.message,
            provider_status_code: error.customData?.http_status_code || error.response?.status || 500
        };
    }
};

/**
 * Sends the bundled results from all 3 models to be saved in MongoDB.
 */
export const saveResearchSummary = async (summaryPayload) => {
    const response = await apiClient.post('/api/analyze/summary', summaryPayload);
    return response.data;
};

/**
 * Fetches the calculated historical averages for the paper.
 */
export const getAnalytics = async (limit = 50) => {
    const response = await apiClient.get(`/api/research/analytics?limit=${limit}`);
    return response.data;
};

/**
 * Fetches the raw history for the dashboard UI.
 */
export const getHistory = async () => {
    const response = await apiClient.get('/api/research/history');
    return response.data;
};

/**
 * Exports paginated raw MongoDB data for Python/Pandas analysis.
 */
export const exportData = async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/research/export?skip=${skip}&limit=${limit}`);
    return response.data;
};


export const fetchDatabasePerformance = async () => {
    try {
        // apiClient automatically handles the base URL and API keys
        const response = await apiClient.get('/api/research/db-performance');

        // Return the clean data object to feed your UI
        return response.data;

    } catch (error) {
        console.error("[API Service] Failed to fetch DB performance:", error);

        // Return a perfectly structured fallback so your UI charts render 
        // cleanly as 'empty' rather than throwing a white screen crash.
        return {
            write_metrics: {
                data_points: 0,
                average_db_ms: 0,
                average_cache_ms: 0,
                cache_speedup_percent: 0
            },
            read_metrics: {
                data_points: 0,
                average_db_ms: 0,
                average_cache_ms: 0,
                cache_speedup_percent: 0
            },
            error_message: error.customData?.error_message || error.message || "Failed to load metrics",
            status: "error"
        };
    }
};


export const fetchRawMetrics = async () => {
    try {
        const response = await apiClient.get('/api/research/raw-metrics');
        return response.data;
    } catch (error) {
        console.error("[API Service] Failed to fetch raw metrics:", error);
        // Return safe empty arrays to prevent frontend mapping crashes
        return {
            writes: [],
            reads: []
        };
    }
};