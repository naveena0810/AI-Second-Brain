import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/instant";
import NotificationList from "./NotificationList";

export default function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = db.useQuery({
    notifications: {
      $: {
        where: { userId },
      },
    },
  });

  const unreadCount = data?.notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-black/5 transition-colors"
        title="Notifications"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-gray-800" : "text-gray-500"} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 origin-top-right"
          >
            <NotificationList userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
