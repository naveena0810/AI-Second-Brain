"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface BaseCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function BaseCard({ children, className = "", noPadding = false, ...props }: BaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`premium-card ${noPadding ? "p-0" : ""} ${className}`}
      style={{
        ...props.style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
