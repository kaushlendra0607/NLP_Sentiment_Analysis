import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { msToSeconds } from '../../utils/formatters';

const COLORS = {
    latency: '#818cf8',   // indigo-400
    tps: '#34d399',   // emerald-400
    overhead: '#fb923c',   // orange-400
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
            <p className="text-sm font-semibold text-white mb-2">{label}</p>
            {payload.map((entry) => (
                <p key={entry.dataKey} className="text-xs text-slate-300">
                    <span style={{ color: entry.color }}>●</span>{' '}
                    {entry.name}: <span className="font-medium text-white">{entry.value}</span>
                </p>
            ))}
        </div>
    );
};

export default function PerformanceChart({ rawResponses }) {
    if (!rawResponses) return null;

    const data = ['gemini', 'groq', 'mistral']
        .filter((p) => rawResponses[p] && rawResponses[p].status !== 'error')
        .map((provider) => {
            const r = rawResponses[provider];
            return {
                name: r.provider || provider,
                'API Latency (s)': Number(msToSeconds(r.api_latency_ms)),
                'Tokens/sec': Number((r.output_tokens_per_second || 0).toFixed(2)),
                'Network Overhead (s)': Number(msToSeconds(r.cloud_network_overhead_ms)),
            };
        });

    if (data.length === 0) return null;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">⚡ Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend
                        wrapperStyle={{ paddingTop: 12 }}
                        formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                    />
                    <Bar dataKey="API Latency (s)" fill={COLORS.latency} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Tokens/sec" fill={COLORS.tps} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Network Overhead (s)" fill={COLORS.overhead} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
