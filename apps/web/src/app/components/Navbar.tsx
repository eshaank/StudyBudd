"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BackButton from "./BackButton";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/quizzes", label: "Quizzes" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-strong shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Back button - shown on non-home pages */}
          <AnimatePresence>
            {pathname !== "/" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute left-4 md:left-6"
              >
                <BackButton fallback="/" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2 transition-all duration-300 ${
              pathname !== "/" ? "ml-12 md:ml-14" : ""
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <span className="text-2xl md:text-3xl font-bold text-gradient">
                StudyBudd
              </span>
              <span className="absolute -top-1 -right-3 text-[10px] font-semibold text-cyan-400">
                AI
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`nav-link ${
                    pathname === item.href ? "active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="ml-4"
            >
              <Link href="/quizzes">
                <button className="btn-primary text-sm px-5 py-2.5">
                  Get Started
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl glass"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <motion.span
                animate={{
                  rotate: isOpen ? 45 : 0,
                  y: isOpen ? 6 : 0,
                }}
                className="block h-0.5 w-full bg-white/80 rounded-full origin-center transition-colors"
              />
              <motion.span
                animate={{
                  opacity: isOpen ? 0 : 1,
                  x: isOpen ? -10 : 0,
                }}
                className="block h-0.5 w-full bg-white/80 rounded-full"
              />
              <motion.span
                animate={{
                  rotate: isOpen ? -45 : 0,
                  y: isOpen ? -6 : 0,
                }}
                className="block h-0.5 w-full bg-white/80 rounded-full origin-center transition-colors"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-strong border-t border-white/5 overflow-hidden"
          >
            <div className="container-custom py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-3 px-4 rounded-xl transition-all duration-300 ${
                      pathname === item.href
                        ? "bg-indigo-500/20 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-2"
              >
                <Link href="/quizzes" onClick={() => setIsOpen(false)}>
                  <button className="btn-primary w-full text-sm py-3">
                    Get Started Free
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
