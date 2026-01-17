"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
  color: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "5 AI-generated quizzes per month",
      "Basic flashcard creation",
      "Limited study analytics",
      "Community support",
    ],
    cta: "Start Free",
    color: "emerald",
  },
  {
    name: "Pro",
    description: "Best for serious students",
    monthlyPrice: 12.99,
    yearlyPrice: 9.99,
    features: [
      "Unlimited AI quizzes & flashcards",
      "Advanced analytics dashboard",
      "Pomodoro timer with stats",
      "Priority email support",
      "Export to PDF & Anki",
      "Ad-free experience",
    ],
    highlighted: true,
    cta: "Start Pro Trial",
    color: "indigo",
  },
  {
    name: "Team",
    description: "For study groups & educators",
    monthlyPrice: 29.99,
    yearlyPrice: 24.99,
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared study materials",
      "Team analytics & insights",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    color: "purple",
  },
];

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Absolutely! All Pro features come with a 14-day free trial. No credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and Apple Pay. Enterprise customers can pay via invoice.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel anytime from your account settings. You'll retain access until the end of your billing period.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <main className="relative pt-24 pb-20">
      {/* Header */}
      <section className="container-custom mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="badge mb-4">Simple Pricing</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Choose Your </span>
            <span className="text-gradient">Learning Plan</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Start free and upgrade as you grow. All plans include a 14-day money-back guarantee.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full glass">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isYearly
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isYearly
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container-custom mb-20">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`pricing-card ${plan.highlighted ? "featured" : ""} relative flex flex-col`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/50 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-bold text-white">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-white/50 mb-2">/month</span>
                  )}
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-emerald-400 text-sm mt-1">
                    Billed ${(plan.yearlyPrice * 12).toFixed(0)}/year
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.color === "emerald"
                          ? "text-emerald-400"
                          : plan.color === "indigo"
                          ? "text-indigo-400"
                          : "text-purple-400"
                      }`}
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
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? "btn-primary"
                    : "glass hover:bg-white/10 text-white"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features comparison */}
      <section className="container-custom mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              All Plans Include
            </h2>
            <p className="text-white/60">Core features available on every plan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🔒", label: "Secure cloud storage" },
              { icon: "📱", label: "Mobile & desktop apps" },
              { icon: "🔄", label: "Auto-sync across devices" },
              { icon: "🌙", label: "Dark & light modes" },
              { icon: "⚡", label: "Fast performance" },
              { icon: "🛡️", label: "Data encryption" },
              { icon: "🌍", label: "Global CDN" },
              { icon: "📧", label: "Email notifications" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="text-center p-4 rounded-xl glass"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white/70 text-sm">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="container-custom mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60">
              Can&apos;t find what you&apos;re looking for?{" "}
              <a href="#" className="text-indigo-400 hover:text-indigo-300">
                Contact support
              </a>
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group card cursor-pointer"
              >
                <summary className="flex items-center justify-between text-white font-medium list-none">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-white/50 transition-transform duration-300 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="mt-4 text-white/60 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container-custom">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Still not sure?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Start with our free plan and experience the power of AI-assisted
              learning. No credit card required.
            </p>
            <Link href="/quizzes">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-lg px-10 py-4"
              >
                Try Free Forever
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
