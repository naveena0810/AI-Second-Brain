import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onSubmit: (topic: string, explanation: string) => void;
  isLoading: boolean;
}

export default function ExplainInput({ onSubmit, isLoading }: Props) {
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");

  const handleSubmit = () => {
    if (!topic.trim() || !explanation.trim() || isLoading) return;
    onSubmit(topic, explanation);
    setTopic("");
    setExplanation("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-purple-100 shadow-xl overflow-hidden"
    >
      <div className="p-4 border-b border-purple-100 bg-purple-50/30 flex items-center justify-between">
        <h3 className="font-bold text-purple-900 flex items-center gap-2 text-sm">
          <Sparkles size={16} className="text-purple-600" /> Explain My Thinking
        </h3>
        <p className="text-xs text-purple-600 font-medium">Active Learning Mode</p>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Topic / Concept</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Machine Learning, React Hooks, Supply Chain..."
            className="w-full px-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-purple-300 focus:bg-white transition-all"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex justify-between">
            <span>Your Explanation</span>
            <span className="text-gray-400 font-normal normal-case">In your own words</span>
          </label>
          <textarea
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Explain it like you're teaching someone else..."
            className="w-full px-3 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-purple-300 focus:bg-white transition-all min-h-[100px] resize-none"
            disabled={isLoading}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
        </div>
      </div>

      <div className="p-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <span className="text-[10px] text-gray-400 font-medium">Press ⌘+Enter to submit</span>
        <button
          onClick={handleSubmit}
          disabled={!topic.trim() || !explanation.trim() || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Evaluate My Thinking
        </button>
      </div>
    </motion.div>
  );
}
