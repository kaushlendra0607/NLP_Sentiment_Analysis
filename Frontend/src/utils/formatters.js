/**
 * Convert milliseconds (from backend) to seconds with 3 decimal places.
 * e.g. 1234.567 ms → "1.235 s"
 */
export const msToSeconds = (ms) => {
    if (ms == null || isNaN(ms)) return '—';
    return (ms / 1000).toFixed(3);
};

/**
 * Format a raw number to 2 decimal places.
 */
export const formatNumber = (val) => {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(2);
};

/**
 * Format an ISO date string to a human-readable locale string.
 */
export const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Map overall_sentiment values to Tailwind text-color classes.
 */
export const sentimentColor = (sentiment) => {
    const map = {
        positive: 'text-emerald-400',
        negative: 'text-red-400',
        neutral: 'text-slate-400',
        mixed: 'text-amber-400',
    };
    return map[(sentiment || '').toLowerCase()] || 'text-slate-300';
};

/**
 * Model options for each provider dropdown.
 */
export const MODEL_OPTIONS = {
    gemini: [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
    groq: [
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
        { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
    ],
    mistral: [
        { value: 'mistral-large-latest', label: 'Mistral Large' },
        { value: 'mistral-small-latest', label: 'Mistral Small' },
    ],
};

/**
 * Cloud provider options for the backend-routing dropdown.
 */
export const CLOUD_OPTIONS = [
    { value: 'aws', label: 'AWS Lambda' },
    { value: 'azure', label: 'Microsoft Azure' },
    { value: 'render', label: 'Render' },
    { value: 'vercel', label: 'Vercel' },
];
