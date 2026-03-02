import { useState } from 'react';
import { analyzeProvider, saveResearchSummary } from '../api/services';

export const useAnalyze = () => {
    // State management for the UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null); // The final aggregated summary
    const [rawResponses, setRawResponses] = useState(null); // Individual LLM data for the UI cards

    /**
     * Orchestrates the parallel LLM race and saves the summary.
     * @param {string} text - The text to analyze
     * @param {object} models - { gemini: "...", groq: "...", mistral: "..." }
     */
    const analyzeText = async (text, models) => {
        setIsLoading(true);
        setError(null);
        setResults(null);
        setRawResponses(null);

        // Map the payload to exactly match your backend's AnalyzeRequest schema
        const payload = {
            text: text,
            model_gemini: models.gemini || 'gemini-2.5-flash',
            model_groq: models.groq || 'llama-3.3-70b-versatile',
            model_mistral: models.mistral || 'mistral-large-latest'
        };

        try {
            console.log("[ORCHESTRATOR] Starting parallel LLM race...");

            // 1. THE RACE: Fire all three APIs at the exact same millisecond
            // Because our service catches errors and returns fallbacks, this will NEVER throw an exception mid-race.
            const [geminiRes, groqRes, mistralRes] = await Promise.all([
                analyzeProvider('gemini', payload),
                analyzeProvider('groq', payload),
                analyzeProvider('mistral', payload)
            ]);

            console.log("[ORCHESTRATOR] Race finished. Bundling results.");

            // 2. THE BUNDLE: Prepare the payload for the summary endpoint
            const summaryPayload = {
                gemini: geminiRes,
                groq: groqRes,
                mistral: mistralRes
            };

            console.log(summaryPayload);

            // Save the raw responses so the UI can render the individual model cards instantly
            setRawResponses(summaryPayload);

            // 3. THE AGGREGATOR: Send the bundle to MongoDB and get the metrics back
            console.log("[ORCHESTRATOR] Sending bundle to aggregator...");
            const summaryMetrics = await saveResearchSummary(summaryPayload);

            // Set the final research metrics for the UI
            setResults(summaryMetrics);
            console.log("[ORCHESTRATOR] Research run successfully completed and saved.");

        } catch (err) {
            // This catch block only triggers if something catastrophic happens
            // (e.g., the /summary endpoint itself crashes or the user loses WiFi entirely)
            console.error("[ORCHESTRATOR FATAL ERROR]:", err);

            // Extract our clean backend error message if it exists, otherwise use standard error
            const errorMessage = err.customData?.error_message || err.message || "An unexpected error occurred.";
            setError(errorMessage);
        } finally {
            // Always turn off the loading spinner, no matter what happens
            setIsLoading(false);
        }
    };

    return {
        analyzeText,
        isLoading,
        error,
        results,
        rawResponses
    };
};