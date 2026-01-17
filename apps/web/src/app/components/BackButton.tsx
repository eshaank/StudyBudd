"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface BackButtonProps {
  fallback?: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}

export default function BackButton({
  fallback = "/",
  label = "Back",
  iconOnly = true,
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    const prevPath = typeof window !== "undefined" ? window.location.pathname : "";
    router.back();

    // If nothing changed after a tick, push fallback
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname === prevPath) {
        router.push(fallback);
      }
    }, 150);
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1, x: -2 }}
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      title="Back"
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition-all duration-300 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 19.5 8.25 12l7.5-7.5"
        />
      </svg>
      {!iconOnly && (
        <span className="ml-1 text-sm font-medium">{label}</span>
      )}
    </motion.button>
  );
}
