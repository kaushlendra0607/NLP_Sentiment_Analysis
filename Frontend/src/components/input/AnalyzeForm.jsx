import { useState } from 'react';
import { MODEL_OPTIONS } from '../../utils/formatters';
import { Sparkles, ChevronDown } from 'lucide-react';

const providerMeta = {
    gemini: { label: 'Google Gemini', color: 'from-blue-500 to-cyan-400', ring: 'focus:ring-blue-500/40' },
    groq: { label: 'Groq (LPU)', color: 'from-emerald-500 to-green-400', ring: 'focus:ring-emerald-500/40' },
    mistral: { label: 'Mistral AI', color: 'from-orange-500 to-amber-400', ring: 'focus:ring-orange-500/40' },
};

export default function AnalyzeForm({ onSubmit, isLoading }) {
    const [text, setText] = useState('');
    const [models, setModels] = useState({
        gemini: MODEL_OPTIONS.gemini[0].value,
        groq: MODEL_OPTIONS.groq[0].value,
        mistral: MODEL_OPTIONS.mistral[0].value,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text, models);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Textarea */}
            <div className="relative">
                <textarea
                    id="analyze-text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to analyze sentiment, tone, and emotions…"
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm
                     px-5 py-4 text-sm text-white placeholder-slate-400
                     resize-none outline-none transition-all duration-300
                     focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                     hover:border-white/20"
                />
                <span className="absolute bottom-3 right-4 text-xs text-slate-500">
                    {text.length} chars
                </span>
            </div>

            {/* Model Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(providerMeta).map(([provider, meta]) => (
                    <div key={provider} className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                            {meta.label}
                        </label>
                        <div className="relative">
                            <select
                                id={`model-select-${provider}`}
                                value={models[provider]}
                                onChange={(e) => setModels((prev) => ({ ...prev, [provider]: e.target.value }))}
                                className={`w-full appearance-none rounded-lg border border-white/10 bg-white/5
                           px-4 py-2.5 pr-10 text-sm text-white outline-none cursor-pointer
                           transition-all duration-200 ${meta.ring}
                           hover:border-white/20 focus:ring-2`}
                            >
                                {MODEL_OPTIONS[provider].map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <button
                id="analyze-submit-btn"
                type="submit"
                disabled={isLoading || !text.trim()}
                className="w-full relative overflow-hidden rounded-xl py-3.5 px-6 font-semibold text-white
                   bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                   shadow-lg shadow-indigo-500/25
                   transition-all duration-300 ease-out
                   hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]
                   active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                        <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Racing LLMs…
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Analyze Sentiment
                        </>
                    )}
                </span>
            </button>
        </form>
    );
}
