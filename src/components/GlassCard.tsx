"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface Props extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "", ...props }: Props) {
  return (
    <motion.div
      className={`glass-panel rounded-3xl p-6 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
