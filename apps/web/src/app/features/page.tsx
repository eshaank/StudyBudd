"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type TabKey = "search" | "pomodoro" | "quiz";

interface TabContent {
  title: string;
  description: string;
  features: string[];
  icon: string;
  ctaText: string;
  ctaLink: string;
}

const tabsData: Record<TabKey, TabContent> = {
  search: {
    title: "Intelligent Search & Research",
    description:
      "Our AI-powered search engine helps you find relevant study materials quickly. Cut down research time by up to 70% with intelligent content filtering and summarization.",
    features: [
      "Smart keyword extraction from any topic",
      "Academic source prioritization & citation",
      "Auto-generated summaries & key points",
      "Cross-reference multiple sources instantly",
    ],
    icon: "🔍",
    ctaText: "Try Smart Search",
    ctaLink: "/quizzes",
  },
  pomodoro: {
    title: "Focus Timer & Study Sessions",
    description:
      "Boost your productivity with our customizable Pomodoro timer. Stay focused with timed study sessions and strategic breaks designed to maximize retention.",
    features: [
      "Customizable work & break intervals",
      "Session tracking & statistics",
      "Ambient sounds & focus music",
      "Integration with study materials",
    ],
    icon: "⏰",
    ctaText: "Start Focusing",
    ctaLink: "/quizzes",
  },
  quiz: {
    title: "AI Quiz Generator",
    description:
      "Transform any content into interactive quizzes and assessments. Our AI understands context and creates questions that truly test your understanding.",
    features: [
      "Multiple choice, fill-in-blank, flashcards",
      "Adaptive difficulty based on performance",
      "Detailed explanations for wrong answers",
      "Progress tracking & spaced repetition",
    ],
    icon: "🧠",
    ctaText: "Generate Quiz",
    ctaLink: "/quizzes",
  },
};

const additionalFeatures = [
  {
    icon: "📓",
    title: "Smart Note-Taking",
    description:
      "AI-powered suggestions and automatic organization as you write. Connect related concepts automatically.",
    color: "from-indigo-500/20 to-purple-500/20",
  },
  {
    icon: "🎴",
    title: "AI Flashcard Generator",
    description:
      "Convert any study material into interactive flashcards. Supports images, code, and complex formulas.",
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: "📊",
    title: "Learning Analytics",
    description:
      "Track your progress with detailed insights. Identify weak areas and optimize your study schedule.",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: "🤝",
    title: "Study Groups",
    description:
      "Collaborate with classmates in real-time. Share notes, create group quizzes, and learn together.",
    color: "from-orange-500/20 to-amber-500/20",
  },
];

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("search");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "search", label: "Smart Search" },
    { key: "pomodoro", label: "Focus Timer" },
    { key: "quiz", label: "Quiz Generator" },
  ];

  return (
    <main className="relative pt-24 pb-20">
      {/* Hero Section */}
      <section className="container-custom mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge mb-4">All Features</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-white">Everything You Need to </span>
            <span className="text-gradient">Learn Better</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Discover our comprehensive suite of AI-powered tools designed to
            transform how you study and retain information.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25"
                  : "glass text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Content */}
              <div className={activeTab === "pomodoro" ? "order-2" : ""}>
                <div className="text-6xl mb-6">{tabsData[activeTab].icon}</div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {tabsData[activeTab].title}
                </h2>
                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                  {tabsData[activeTab].description}
                </p>
                <ul className="space-y-4 mb-8">
                  {tabsData[activeTab].features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 text-white/80"
                    >
                      <span className="text-cyan-400 mt-1">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
                <Link href={tabsData[activeTab].ctaLink}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary px-8 py-4"
                  >
                    {tabsData[activeTab].ctaText}
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
              </div>

              {/* Visual */}
              <div
                className={`${activeTab === "pomodoro" ? "order-1" : ""}`}
              >
                <div className="feature-card aspect-square flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10" />
                  <div className="relative text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="text-8xl md:text-9xl mb-4"
                    >
                      {tabsData[activeTab].icon}
                    </motion.div>
                    <p className="text-white/40 text-sm">
                      Interactive demo coming soon
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 border border-indigo-500/20 rounded-lg animate-pulse" />
                  <div className="absolute bottom-4 left-4 w-16 h-16 border border-cyan-500/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Additional Features Grid */}
      <section className="container-custom mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            More Powerful Tools
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Everything else you need to accelerate your learning journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="feature-card group cursor-pointer"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
              />
              <div className="relative flex items-start gap-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="container-custom mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          <div className="relative z-10">
            <span className="badge-accent mb-4">Coming Soon</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ✨ Swipe Learning Cards
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Tinder-style learning experience. Swipe through concepts, mark
              what you know, and focus on what needs work.
            </p>
            <div className="flex justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, rotate: i === 2 ? 0 : i === 1 ? -5 : 5 }}
                  className="w-20 h-28 md:w-24 md:h-32 rounded-xl glass flex items-center justify-center text-3xl"
                >
                  {i === 1 ? "📚" : i === 2 ? "💡" : "✅"}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Study Smarter?
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of students already transforming their learning
            experience with StudyBudd.
          </p>
          <Link href="/quizzes">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-10 py-4"
            >
              Get Started Free
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
        </motion.div>
      </section>
    </main>
  );
}
