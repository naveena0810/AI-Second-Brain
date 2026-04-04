import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, TrendingUp, BrainCircuit, Star, X } from "lucide-react";
import { db } from "@/lib/instant";

export interface NotificationItemProps {
  id: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: number;
}

export default function NotificationItem({ id, message, type, priority, isRead, createdAt }: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case "missed_topic": return <AlertCircle size={14} className="text-red-500" />;
      case "suggestion": return <BrainCircuit size={14} className="text-blue-500" />;
      case "revision": return <TrendingUp size={14} className="text-orange-500" />;
      case "streak": return <Star size={14} className="text-yellow-500" />;
      default: return <CheckCircle2 size={14} className="text-green-500" />;
    }
  };

  const getPriorityClasses = () => {
    if (isRead) return "opacity-60 bg-transparent border-transparent";
    switch (priority) {
      case "high": return "bg-red-50/50 border-red-100 font-medium";
      case "medium": return "bg-orange-50/50 border-orange-100";
      default: return "bg-blue-50/50 border-blue-100";
    }
  };

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.transact([db.tx.notifications[id].update({ isRead: true })]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`relative p-3 rounded-xl border mb-2 cursor-pointer transition-all flex gap-3 items-start group ${getPriorityClasses()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <p className={`text-sm leading-snug ${isRead ? "text-gray-600" : "text-gray-900"}`}>
          {message}
        </p>
        <span className="text-[10px] text-gray-400 mt-1 block">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
      
      {!isRead && (
        <button
          onClick={handleMarkRead}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-black/5 rounded-md"
          title="Mark as read"
        >
          <X size={12} className="text-gray-400" />
        </button>
      )}
      {!isRead && (
        <div className="absolute top-3 left-0 w-1 h-1 rounded-full bg-red-500 translate-x-[-50%]" />
      )}
    </motion.div>
  );
}
