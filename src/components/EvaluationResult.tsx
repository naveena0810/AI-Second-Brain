import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import CopyButton from "./CopyButton";

export interface EvaluationData {
  correct: string[];
  missing: string[];
  incorrect: string[];
  improved: string;
}

interface Props {
  data: EvaluationData;
  onRetry: () => void;
}

export default function EvaluationResult({ data, onRetry }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-500" />
          Thinking Evaluation
        </h3>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Improve & Resubmit
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Correct Parts */}
        {data.correct.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 size={14} /> You got this right
            </h4>
            <ul className="space-y-1.5 ml-1">
              {data.correct.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Parts */}
        {data.missing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={14} /> Key ideas missing
            </h4>
            <ul className="space-y-1.5 ml-1">
              {data.missing.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Incorrect Parts */}
        {data.incorrect.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-1.5">
              <XCircle size={14} /> Needs correction
            </h4>
            <ul className="space-y-1.5 ml-1">
              {data.incorrect.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improved Explanation */}
        {data.improved && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb size={14} className="fill-blue-500" /> Improved Explanation
              </h4>
              <CopyButton text={data.improved} />
            </div>
            <p className="text-sm leading-relaxed text-gray-800 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              {data.improved}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
