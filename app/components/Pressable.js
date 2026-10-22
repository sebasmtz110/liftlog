"use client";

import { motion, useReducedMotion } from "motion/react";

const tap = { scale: 0.98 };
const transition = { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] };

export default function Pressable({ children, className, type = "button", ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <button type={type} className={className} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      type={type}
      className={className}
      whileTap={tap}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
