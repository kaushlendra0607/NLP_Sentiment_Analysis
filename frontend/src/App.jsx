import { useState } from 'react';
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, Heart, Lightbulb, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

function App() {
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const API_KEY = import.meta.env.VITE_API_KEY || 'my_super_secret_hackathon_key';

  const getCategoryConfig = (category) => {
    const configs = {
      concerns: {
        emoji: '🚩',
        icon: AlertCircle,
        color: 'from-red-500/15 to-orange-500/15',
        borderColor: 'border-red-500/40',
        textColor: 'text-red-300',
        bgGlow: 'shadow-red-500/20',
      },
      appreciation: {
        emoji: '❤️',
        icon: Heart,
        color: 'from-emerald-500/15 to-teal-500/15',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-300',
        bgGlow: 'shadow-emerald-500/20',
      },
      suggestions: {
        emoji: '💡',
        icon: Lightbulb,
        color: 'from-blue-500/15 to-purple-500/15',
        borderColor: 'border-blue-500/40',
        textColor: 'text-blue-300',
        bgGlow: 'shadow-blue-500/20',
      },
    };
    
    const normalizedCategory = category.toLowerCase();
    return configs[normalizedCategory] || configs.suggestions;
  };

  const handleAnalyze = async () => {
    if (!feedbackText.trim()) {
      setError('Please enter some feedback to analyze! 📝');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `${API_URL}/analyze`,
        { feedback_text: feedbackText },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error('Error analyzing feedback:', err);
      setError(
        err.response?.data?.detail || 
        'Oops! The AI is taking a coffee break ☕ Please try again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/12 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-indigo-600/12 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/15 border border-purple-400/30 rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="text-sm font-medium text-purple-200">AI-Powered Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent tracking-tight leading-tight">
            Student Vibe Check
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
            Drop your feedback and let AI decode the vibe ✨
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-purple-900/10 mb-8"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-200 mb-3">
              Your Feedback
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., 'The library WiFi is broken and I can't submit my assignment...' 📚"
              className="w-full bg-slate-800/70 border border-slate-600/50 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none h-32 md:h-40"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !feedbackText.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Consulting the AI...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze Vibe 🔮
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Pro tip: Press <kbd className="px-2 py-1 bg-slate-700/60 rounded border border-slate-600/50 text-slate-300">Cmd/Ctrl + Enter</kbd> to analyze
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-red-500/10 border border-red-400/40 rounded-2xl p-6 mb-8 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ 
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className={`bg-gradient-to-br ${getCategoryConfig(result.category).color} backdrop-blur-xl border ${getCategoryConfig(result.category).borderColor} rounded-3xl p-8 shadow-2xl ${getCategoryConfig(result.category).bgGlow}`}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="text-4xl">{getCategoryConfig(result.category).emoji}</div>
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category Detected
                  </p>
                  <h2 className={`text-4xl md:text-5xl font-black ${getCategoryConfig(result.category).textColor} tracking-tight drop-shadow-lg`}>
                    {result.category}
                  </h2>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between py-3 border-t border-slate-700/40">
                  <span className="text-slate-300 font-medium">Sentiment</span>
                  <span className="text-white font-bold text-lg capitalize">
                    {result.sentiment}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-slate-700/40">
                  <span className="text-slate-300 font-medium">Confidence</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-800/60 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence_score * 100}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${getCategoryConfig(result.category).textColor.replace('text-', 'from-')} to-white/80`}
                      />
                    </div>
                    <span className="text-white font-bold text-lg min-w-[4rem] text-right">
                      {result.confidence_score * 100}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 text-center py-8 text-slate-400 text-sm"
      >
        <p>Powered by AI • Built for Students • Made with 💜</p>
      </motion.footer>
    </div>
  );
}

export default App;