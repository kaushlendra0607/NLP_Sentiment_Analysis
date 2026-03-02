import { useState } from 'react';
import { msToSeconds, formatDate, sentimentColor } from '../../utils/formatters';
import { Database, ChevronDown, ChevronUp, Trophy, Zap, MessageSquare, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Color map for providers
const PROVIDER_ACCENT = {
    gemini: 'text-blue-400 border-blue-500/30',
    groq: 'text-emerald-400 border-emerald-500/30',
    mistral: 'text-orange-400 border-orange-500/30',
};

function ProviderMini({ name, data }) {
    if (!data) return null;
    const accent = PROVIDER_ACCENT[name] || 'text-slate-400 border-white/10';
    const isError = data.status === 'error';

    return (
        <div className={`rounded-lg border ${accent.split(' ')[1]} bg-white/5 px-3 py-2 text-xs space-y-1`}>
            <div className="flex items-center justify-between">
                <span className={`font-semibold capitalize ${accent.split(' ')[0]}`}>{data.provider || name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isError ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                    {data.status}
                </span>
            </div>
            {isError ? (
                <p className="text-red-300 truncate">{data.error_message}</p>
            ) : (
                <>
                    <p className="text-slate-300">
                        <span className={`font-medium ${sentimentColor(data.overall_sentiment)}`}>{data.overall_sentiment}</span>
                        {' · '}{data.tone}
                        {data.sarcasm_flag && ' · 🎭'}
                    </p>
                    <p className="text-slate-500">
                        {msToSeconds(data.api_latency_ms)}s · {(data.output_tokens_per_second || 0).toFixed(1)} tok/s · {data.model_used}
                    </p>
                </>
            )}
        </div>
    );
}

function HistoryRow({ row, index }) {
    const [expanded, setExpanded] = useState(false);
    const sm = row.summary_metrics || {};
    const raw = row.raw_responses || {};

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer group"
            >
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{index + 1}</td>
                <td className="px-5 py-3.5 text-white max-w-[220px] truncate text-sm">
                    {row.test_text_preview || '—'}
                </td>
                <td className="px-5 py-3.5">
                    <span className="text-indigo-300 font-medium text-sm capitalize">{sm.fastest_model || '—'}</span>
                    <span className="text-slate-500 text-xs ml-1.5">({msToSeconds(sm.fastest_latency_ms)}s)</span>
                </td>
                <td className="px-5 py-3.5">
                    <span className="text-emerald-300 text-sm capitalize">{sm.highest_tps_model || '—'}</span>
                    <span className="text-slate-500 text-xs ml-1.5">({(sm.highest_tps_value || 0).toFixed(1)})</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-white">{sm.tone_consensus || '—'}</td>
                <td className="px-5 py-3.5 text-center">
                    {sm.sarcasm_detected_by_majority ? (
                        <span className="text-amber-300 text-sm">🎭 Yes</span>
                    ) : (
                        <span className="text-slate-500 text-sm">No</span>
                    )}
                </td>
                <td className="px-5 py-3.5">
                    <span className="text-emerald-400 text-xs">{sm.successful_calls ?? '—'}</span>
                    <span className="text-slate-600 text-xs mx-1">/</span>
                    <span className="text-red-400 text-xs">{sm.failed_calls ?? 0}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{formatDate(row.timestamp)}</td>
                <td className="px-5 py-3.5 text-slate-500">
                    {expanded
                        ? <ChevronUp className="w-4 h-4 group-hover:text-white transition-colors" />
                        : <ChevronDown className="w-4 h-4 group-hover:text-white transition-colors" />}
                </td>
            </tr>

            {/* Expanded row: show all 3 providers */}
            {expanded && (
                <tr className="border-b border-white/5">
                    <td colSpan={9} className="px-5 py-4 bg-white/[0.02]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <ProviderMini name="gemini" data={raw.gemini} />
                            <ProviderMini name="groq" data={raw.groq} />
                            <ProviderMini name="mistral" data={raw.mistral} />
                        </div>
                        {/* Write latencies if present */}
                        {(sm.db_write_latency_ms || sm.cache_write_latency_ms) && (
                            <div className="flex gap-6 mt-3 text-xs text-slate-500">
                                <span>DB Write: <span className="text-white font-medium">{msToSeconds(sm.db_write_latency_ms)}s</span></span>
                                <span>Cache Write: <span className="text-white font-medium">{msToSeconds(sm.cache_write_latency_ms)}s</span></span>
                                <span>Cloud: <span className="text-slate-300">{sm.cloud_environment || row.cloud_environment || '—'}</span></span>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

export default function HistoryTable({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center">
                <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No analysis history yet. Run your first analysis!</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">#</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Text</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Fastest</span>
                            </th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Top TPS</span>
                            </th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Tone</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Sarcasm</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />/<XCircle className="w-3 h-3" /></span>
                            </th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                            <th className="px-5 py-3.5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <HistoryRow key={row._id || i} row={row} index={i} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
