"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

const ease = [0.25, 0.1, 0.25, 1];

export default function PageTransition({ children }) {
  const pathname = usePathname() || "/";
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(pathname);

  useEffect(() => {
    setShown(pathname);
  }, [pathname]);

  if (reduce) {
    return <div className="page-transition">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className="page-transition"
      initial={shown === pathname ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24, ease }}
    >
      {children}
    </motion.div>
  );
}
