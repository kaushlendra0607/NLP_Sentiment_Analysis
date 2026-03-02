import { msToSeconds, formatNumber, sentimentColor } from '../../utils/formatters';
import { Clock, Zap, MessageSquare, AlertTriangle, Server } from 'lucide-react';

const PROVIDER_STYLES = {
    gemini: { gradient: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', accent: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    groq: { gradient: 'from-emerald-500/20 to-green-500/10', border: 'border-emerald-500/30', accent: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    mistral: { gradient: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/30', accent: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
};

export default function LlmResponse({ data, provider }) {
    if (!data) return null;

    const style = PROVIDER_STYLES[provider] || PROVIDER_STYLES.gemini;
    const isError = data.status === 'error';

    return (
        <div className={`rounded-xl border ${style.border} bg-gradient-to-br ${style.gradient}
                      backdrop-blur-md p-6 space-y-5 transition-all duration-300 hover:shadow-lg`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={`text-lg font-bold ${style.accent} capitalize`}>{data.provider || provider}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{data.model_used} · {data.hosted_on || '—'}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isError ? 'bg-red-500/20 text-red-300' : style.badge
                    }`}>
                    {data.status}
                </span>
            </div>

            {isError ? (
                <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{data.error_message || 'Unknown error'}</p>
                </div>
            ) : (
                <>
                    {/* Sentiment & Tone */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            <span className="text-xs uppercase tracking-wider text-slate-400">Sentiment</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-2xl font-bold capitalize ${sentimentColor(data.overall_sentiment)}`}>
                                {data.overall_sentiment || '—'}
                            </span>
                            <span className="text-sm text-slate-400">Tone: <span className="text-white font-medium">{data.tone || '—'}</span></span>
                        </div>

                        {/* Sarcasm flag */}
                        {data.sarcasm_flag && (
                            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
                                🎭 Sarcasm Detected
                            </span>
                        )}

                        {/* Minor emotions */}
                        {data.minor_emotions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {data.minor_emotions.map((e, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                        {e}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Emotion Breakdown */}
                    {data.emotion_breakdown?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wider text-slate-400">Emotion Breakdown</p>
                            <div className="space-y-1.5">
                                {data.emotion_breakdown.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                        <span className="text-sm text-white">"{item.keyword}"</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-300">{item.emotion}</span>
                                            <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div className="h-full rounded-full bg-indigo-400"
                                                    style={{ width: `${(item.confidence_score * 100).toFixed(0)}%` }} />
                                            </div>
                                            <span className="text-xs text-slate-400 w-10 text-right">
                                                {formatNumber(item.confidence_score * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Latency Metrics */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <Stat icon={Clock} label="API Latency" value={msToSeconds(data.api_latency_ms)} unit="s" />
                        <Stat icon={Zap} label="Tokens/sec" value={formatNumber(data.output_tokens_per_second)} />
                        <Stat icon={Server} label="Frontend Total" value={msToSeconds(data.frontend_total_latency_ms)} unit="s" />
                        <Stat icon={Server} label="Network Overhead" value={msToSeconds(data.cloud_network_overhead_ms)} unit="s" />
                    </div>

                    {/* Token counts */}
                    <div className="flex gap-4 text-xs text-slate-400">
                        <span>Prompt: <span className="text-white font-medium">{data.prompt_tokens ?? '—'}</span></span>
                        <span>Completion: <span className="text-white font-medium">{data.completion_tokens ?? '—'}</span></span>
                    </div>
                </>
            )}
        </div>
    );
}

function Stat({ icon: Icon, label, value, unit }) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400">{label}:</span>
            <span className="text-sm font-semibold text-white tabular-nums">
                {value}{unit && <span className="text-xs text-slate-400 ml-0.5">{unit}</span>}
            </span>
        </div>
    );
}
