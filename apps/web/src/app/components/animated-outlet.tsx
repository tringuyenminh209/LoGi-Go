import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion } from "motion/react";

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-full relative z-0"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}