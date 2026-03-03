import { useAnalyze } from '../hooks/useAnalyze';
import AnalyzeForm from '../components/input/AnalyzeForm';
import LlmResponse from '../components/results/LlmResponse';
import PerformanceChart from '../components/metrics/PerformanceChart';
import MetricCard from '../components/metrics/MetricCard';
import { msToSeconds, formatNumber } from '../utils/formatters';
import { Trophy, Zap, MessageSquare, AlertTriangle, CheckCircle, XCircle, Server, Database, HardDrive } from 'lucide-react';

export default function Dashboard() {
    const { analyzeText, isLoading, error, results, rawResponses } = useAnalyze();

    return (
        <div className="space-y-10">
            {/* Hero Section */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Sentiment Analyzer
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Race Gemini, Groq, and Mistral head-to-head. Compare latency, throughput, and sentiment accuracy in real time.
                </p>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto">
                <AnalyzeForm onSubmit={(text, models, cloudKey) => analyzeText(text, models, cloudKey)} isLoading={isLoading} />
            </div>

            {/* Error Display */}
            {error && (
                <div className="max-w-3xl mx-auto flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-5">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-300">Analysis Failed</p>
                        <p className="text-sm text-red-300/80 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* LLM Response Cards */}
            {rawResponses && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-white">🧠 Provider Results</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {['gemini', 'groq', 'mistral'].map((p) => (
                            <LlmResponse key={p} provider={p} data={rawResponses[p]} />
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Chart */}
            {rawResponses && (
                <PerformanceChart rawResponses={rawResponses} />
            )}

            {/* Summary Metrics */}
            {results && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">📊 Research Summary</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Fastest Model"
                            value={results.fastest_model || '—'}
                            icon={Trophy}
                        />
                        <MetricCard
                            label="Fastest Latency"
                            value={msToSeconds(results.fastest_latency_ms)}
                            unit="s"
                            icon={Zap}
                        />
                        <MetricCard
                            label="Highest TPS"
                            value={`${results.highest_tps_model || '—'}`}
                            unit={formatNumber(results.highest_tps_value)}
                            icon={Zap}
                        />
                        <MetricCard
                            label="Tone Consensus"
                            value={results.tone_consensus || '—'}
                            icon={MessageSquare}
                        />
                        <MetricCard
                            label="Successful Calls"
                            value={results.successful_calls ?? '—'}
                            icon={CheckCircle}
                        />
                        <MetricCard
                            label="Failed Calls"
                            value={results.failed_calls ?? 0}
                            icon={XCircle}
                        />
                        <MetricCard
                            label="DB Write"
                            value={msToSeconds(results.db_write_latency_ms)}
                            unit="s"
                            icon={Database}
                        />
                        <MetricCard
                            label="Cache Write"
                            value={msToSeconds(results.cache_write_latency_ms)}
                            unit="s"
                            icon={HardDrive}
                        />
                    </div>

                    {results.sarcasm_detected_by_majority && (
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
                            <span className="text-2xl">🎭</span>
                            <p className="text-amber-300 text-sm font-medium">Sarcasm detected by majority of providers</p>
                        </div>
                    )}

                    {results.cloud_environment && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Server className="w-3.5 h-3.5" />
                            Cloud Environment: <span className="text-slate-300">{results.cloud_environment}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
