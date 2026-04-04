"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface ActionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ElementType;
  className?: string;
}

export default function ActionButton({ 
  children, 
  variant = "primary", 
  size = "md", 
  icon: Icon,
  className = "",
  ...props 
}: ActionButtonProps) {
  
  const baseStyles = "relative flex items-center justify-center gap-2 font-semibold transition-all outline-none disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3.5 text-base rounded-2xl"
  };

  const variantStyles = {
    primary: "text-white shadow-sm hover:shadow",
    secondary: "border shadow-sm hover:bg-black/5",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "hover:bg-black/5"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={
        variant === "primary" ? { background: "var(--accent-primary)" } :
        variant === "secondary" ? { background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)" } :
        variant === "ghost" ? { color: "var(--text-secondary)" } : {}
      }
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 20} />}
      <span>{children}</span>
    </motion.button>
  );
}
