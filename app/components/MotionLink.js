"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export default function MotionLink({ href, className, children, ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      <motion.span
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
      >
        {children}
      </motion.span>
    </Link>
  );
}
