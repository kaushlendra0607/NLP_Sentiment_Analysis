import { useEffect, useState } from 'react';
import { getHistory } from '../api/services';
import HistoryTable from '../components/results/HistoryTable';
import { History, RefreshCw, AlertTriangle, Database, Timer } from 'lucide-react';
import MetricCard from '../components/metrics/MetricCard';
import { msToSeconds } from '../utils/formatters';

export default function HistoryView() {
    const [records, setRecords] = useState([]);
    const [benchmark, setBenchmark] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getHistory();
            // API returns { primary_data: [...], benchmark: {...} }
            setRecords(res.primary_data || []);
            setBenchmark(res.benchmark || null);
        } catch (err) {
            setError(err.customData?.error_message || err.message || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <History className="w-7 h-7 text-indigo-400" />
                    <h1 className="text-3xl font-bold text-white">Analysis History</h1>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10
                     bg-white/5 text-sm text-slate-300 transition-all hover:bg-white/10
                     hover:text-white disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-5">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
                                <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                                <div className="h-7 w-28 bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-4 w-8 bg-white/10 rounded" />
                                <div className="h-4 w-48 bg-white/10 rounded" />
                                <div className="flex-1" />
                                <div className="h-4 w-24 bg-white/10 rounded" />
                                <div className="h-4 w-20 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Benchmark metrics bar */}
            {!loading && !error && benchmark && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        label="DB Read Latency"
                        value={msToSeconds(benchmark.db_read_latency_ms)}
                        unit="s"
                        icon={Database}
                    />
                    <MetricCard
                        label="Cache Read Latency"
                        value={msToSeconds(benchmark.cache_read_latency_ms)}
                        unit="s"
                        icon={Timer}
                    />
                    <MetricCard
                        label="Documents Fetched"
                        value={benchmark.documents_fetched ?? '—'}
                        icon={Database}
                    />
                </div>
            )}

            {/* Table */}
            {!loading && !error && <HistoryTable data={records} />}
        </div>
    );
}
