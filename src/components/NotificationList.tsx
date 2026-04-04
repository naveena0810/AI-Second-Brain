import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Bell, Sparkles } from "lucide-react";
import { db } from "@/lib/instant";
import NotificationItem from "./NotificationItem";

export default function NotificationList({ userId }: { userId: string }) {
  const { data, isLoading } = db.useQuery({
    notifications: {
      $: {
        where: { userId },
        order: { serverCreatedAt: "desc" },
      },
    },
    userActivity: {
      $: {
        where: { userId },
        order: { serverCreatedAt: "desc" },
      },
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    
    await db.transact(
      unread.map(n => db.tx.notifications[n.id].update({ isRead: true }))
    );
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const activities = data?.userActivity || [];
      await fetch("/api/notifications/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, activities })
      });
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="w-80 max-h-[400px] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Bell size={16} /> 
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={generateInsights}
            disabled={isGenerating}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800 disabled:opacity-50"
            title="Generate AI Insights"
          >
            <Sparkles size={14} className={isGenerating ? "animate-pulse text-yellow-500" : ""} />
          </button>
          <button 
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800 disabled:opacity-50"
            title="Mark all as read"
          >
            <CheckCheck size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex justify-center p-4"><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/></div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 text-gray-400">
            <Bell size={24} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">You are all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map(n => (
              <NotificationItem 
                key={n.id}
                id={n.id}
                message={n.message}
                type={n.type}
                priority={n.priority}
                isRead={n.isRead}
                createdAt={n.createdAt || Date.now()}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
