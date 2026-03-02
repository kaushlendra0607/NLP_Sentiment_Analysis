export default function MetricCard({ label, value, unit = '', icon: Icon, className = '' }) {
    return (
        <div
            className={`group relative overflow-hidden rounded-xl border border-white/10
                  bg-white/5 backdrop-blur-md p-5
                  transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]
                  hover:shadow-lg hover:shadow-indigo-500/5 ${className}`}
        >
            {/* Decorative glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-2xl font-bold text-white tabular-nums">
                        {value}
                        {unit && <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>}
                    </p>
                </div>
                {Icon && (
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
