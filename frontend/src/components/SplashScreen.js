import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter"); // enter -> hold -> exit

  useEffect(() => {
    // Logo animation in
    const holdTimer = setTimeout(() => setPhase("hold"), 600);
    // Start exit after 2.2s total
    const exitTimer = setTimeout(() => setPhase("exit"), 2200);
    // Remove splash and switch theme-color to white
    const doneTimer = setTimeout(() => {
      // Update status bar color to white for the main app
      const metaTags = document.querySelectorAll('meta[name="theme-color"]');
      metaTags.forEach((tag) => tag.setAttribute("content", "#FFFFFF"));
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          data-testid="splash-screen"
        >
          {/* Fuel droplet icon */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
            className="relative mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 4C24.5 13 30 18 30 24C30 30 25.5 34 20 34C14.5 34 10 30 10 24C10 18 15.5 13 20 4Z"
                  fill="white"
                  opacity="0.9"
                />
                <text
                  x="20"
                  y="27"
                  textAnchor="middle"
                  fill="#10B981"
                  fontWeight="800"
                  fontSize="14"
                  fontFamily="system-ui"
                >
                  €
                </text>
              </svg>
            </div>

            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[28px] font-extrabold text-white tracking-tight"
          >
            PienoPerfetto
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-[14px] text-gray-400 mt-2 font-medium"
          >
            Il miglior prezzo, sempre.
          </motion.p>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 w-32 h-1 bg-gray-800 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
