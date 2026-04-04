"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { Plus } from "lucide-react";

interface Props extends HTMLMotionProps<"button"> {
  text: string;
  icon?: React.ElementType;
}

export default function FloatingButton({ text, icon: Icon = Plus, ...props }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-4 rounded-full text-white font-bold text-sm shadow-2xl transition-all"
      style={{
        background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
      }}
      {...props}
    >
      <Icon size={18} />
      {text}
    </motion.button>
  );
}
