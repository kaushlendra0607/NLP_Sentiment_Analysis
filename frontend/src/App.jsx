import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import motion from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Lightbulb, Loader2 } from 'lucide-react';

function App() {
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔐 Your API Key (Ideally from env, but hardcoded for Hackathon speed is OK locally)
  const API_KEY = "my_super_secret_hackathon_key"; 

  const analyzeFeedback = async () => {
    if (!feedback.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Calling your Python Backend
      const response = await axios.post('http://127.0.0.1:8000/analyze', 
        { feedback_text: feedback },
        { headers: { 'x-api-key': API_KEY } }
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Server error! Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color/icon based on category
  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Concerns': return { color: 'bg-red-100 text-red-700', icon: <AlertCircle /> };
      case 'Appreciation': return { color: 'bg-green-100 text-green-700', icon: <CheckCircle /> };
      case 'Suggestions': return { color: 'bg-blue-100 text-blue-700', icon: <Lightbulb /> };
      default: return { color: 'bg-gray-100 text-gray-700', icon: <Lightbulb /> };
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🎓 Student Vibe Check</h1>
          <p className="text-indigo-200">AI-Powered Feedback Analyzer</p>
        </div>

        {/* Input Section */}
        <div className="p-8">
          <textarea
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors h-40 resize-none text-lg"
            placeholder="Paste student feedback here (e.g., 'The wifi is terrible...')"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button
            onClick={analyzeFeedback}
            disabled={loading || !feedback}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {loading ? "Analyzing Vibe..." : "Check Vibe"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 border-t border-gray-100"
            >
              <div className="p-8">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Analysis Result</div>
                
                <div className={`p-6 rounded-xl flex items-start gap-4 ${getCategoryStyle(result.category).color}`}>
                  <div className="p-2 bg-white/50 rounded-lg">
                    {getCategoryStyle(result.category).icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{result.category}</h3>
                    <p className="mt-1 opacity-90">
                      Sentiment: <strong>{result.sentiment}</strong> • Confidence: <strong>{(result.confidence_score * 100).toFixed(0)}%</strong>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;