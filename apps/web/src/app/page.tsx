"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import HorizontalScroll from "./components/HorizontalScroll";
import Link from "next/link";

const cardsData = [
  {
    title: "Study Prep Sheets",
    description:
      "Generate custom study sheets with AI that adapts to your learning style and pace.",
    icon: "📝",
  },
  {
    title: "Learning Paths",
    description:
      "Create personalized learning paths with AI-powered recommendations and progress tracking.",
    icon: "🎯",
  },
  {
    title: "Smart Quizzes",
    description:
      "Interactive quizzes and assessments powered by advanced machine learning algorithms.",
    icon: "🧠",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Real-time performance analytics to track your learning progress and identify areas for improvement.",
    icon: "📊",
  },
];

const stats = [
  { value: "50K+", label: "Active Students" },
  { value: "1M+", label: "Quizzes Completed" },
  { value: "98%", label: "Success Rate" },
  { value: "4.9/5", label: "User Rating" },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated background elements */}
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-glow" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow"
            style={{ animationDelay: "1s" }}
          />
        </motion.div>

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/80">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now with GPT-4 Integration
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-white">Learn Smarter with</span>
              <br />
              <span className="text-gradient">AI-Powered Study Tools</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Transform your study sessions with intelligent flashcards,
              personalized quizzes, and AI-generated study materials tailored to
              your learning style.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/quizzes">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
                >
                  Start Learning Free
                  <svg
                    className="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </motion.button>
              </Link>
              <Link href="/features">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
                >
                  Explore Features
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 bg-white/60 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Carousel Section */}
      <section className="section relative">
        <HorizontalScroll cards={cardsData} />
      </section>

      {/* How it Works Section */}
      <section className="section relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="badge-accent mb-4">Simple Process</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">How </span>
              <span className="text-gradient">StudyBudd</span>
              <span className="text-white"> Works</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Get started in minutes and transform your study routine forever
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/4 left-1/4 right-1/4 h-px bg-gradient-to-r from-indigo-500/50 via-cyan-500/50 to-indigo-500/50" />

            {[
              {
                step: "01",
                title: "Upload Your Materials",
                description:
                  "Drop your notes, PDFs, or textbooks. Our AI analyzes and understands your content instantly.",
                icon: "📤",
              },
              {
                step: "02",
                title: "AI Generates Study Tools",
                description:
                  "Watch as StudyBudd creates flashcards, quizzes, and summaries tailored to your content.",
                icon: "⚡",
              },
              {
                step: "03",
                title: "Learn & Track Progress",
                description:
                  "Study with adaptive tools that learn your strengths and weaknesses over time.",
                icon: "📈",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                <div className="feature-card h-full text-center">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                    {item.step}
                  </div>

                  <div className="text-5xl mb-6 mt-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl p-8 md:p-16 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              >
                <span className="text-white">Ready to </span>
                <span className="text-gradient">Transform</span>
                <span className="text-white"> Your Learning?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-white/60 text-lg mb-8 max-w-2xl mx-auto"
              >
                Join thousands of students who are already studying smarter, not
                harder. Start your free trial today.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/quizzes">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary text-lg px-8 py-4"
                  >
                    Get Started Free
                  </motion.button>
                </Link>
                <Link href="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-ghost text-lg px-8 py-4 text-white/80 hover:text-white"
                  >
                    View Pricing
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
