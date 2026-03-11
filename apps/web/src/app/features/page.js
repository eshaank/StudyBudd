"use client";

import { useState } from "react";
import PomodoroTimer from "../components/PomodorTimer";
export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-6xl md:text-7xl font-bold text-center mb-6 text-blue-600">
          Study Budd Features
        </h1>
        <p className="text-center text-gray-700 text-xl md:text-2xl max-w-2xl mx-auto mb-12">
          Enhance your learning experience with our AI-powered study tools
        </p>

        {/* Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === "search"
                ? "bg-blue-600 text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-blue-100 shadow-md"
            }`}
          >
            Smart Search
          </button>

          <button
            onClick={() => setActiveTab("pomodoro")}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === "pomodoro"
                ? "bg-blue-600 text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-blue-100 shadow-md"
            }`}
          >
            Pomodoro Timer
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === "quiz"
                ? "bg-blue-600 text-white shadow-xl"
                : "bg-white text-gray-700 hover:bg-blue-100 shadow-md"
            }`}
          >
            Quiz Generator
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === "search" && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                  Reduced Search & Research
                </h2>
                <p className="text-gray-600 mb-6 text-lg md:text-xl leading-relaxed">
                  Our AI-powered search engine helps you find relevant study
                  materials quickly. Cut down research time by up to 70% with
                  intelligent content filtering and summarization.
                </p>
                <ul className="space-y-4 text-gray-700 text-lg">
                  <li className="flex items-center hover:text-blue-600 transition-colors">
                    <span className="text-green-500 mr-3 text-2xl">✓</span>
                    Smart keyword extraction
                  </li>
                  <li className="flex items-center hover:text-blue-600 transition-colors">
                    <span className="text-green-500 mr-3 text-2xl">✓</span>
                    Academic source prioritization
                  </li>
                  <li className="flex items-center hover:text-blue-600 transition-colors">
                    <span className="text-green-500 mr-3 text-2xl">✓</span>
                    Auto-generated summaries
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-xl p-8 h-64">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 h-full flex flex-col justify-between">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-500">
                    Search your notes, slides, and saved sources
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white p-4 border border-slate-200">
                      <div className="h-3 w-24 rounded bg-blue-100" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
                    </div>
                    <div className="rounded-xl bg-white p-4 border border-slate-200">
                      <div className="h-3 w-20 rounded bg-green-100" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-4/6 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pomodoro" && (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Left: Timer */}
              <div className="order-2 md:order-1">
                <PomodoroTimer />
              </div>

              {/* Right: Description */}
              <div className="order-1 md:order-2">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                  Try Our Pomodoro Feature
                </h2>
                <p className="text-gray-600 mb-6 text-lg md:text-xl leading-relaxed">
                  Boost your productivity with our customizable Pomodoro timer.
                  Stay focused with timed study sessions and regular breaks to
                  maximize retention.
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 hover:border-blue-400 transition-colors">
                    <h3 className="font-bold text-xl text-gray-800 mb-2">
                      Study Effectively
                    </h3>
                    <p className="text-gray-600">
                      Set your own focus time and break time. The timer switches
                      modes automatically.
                    </p>
                  </div>

                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Start Pomodoro Timer →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
                Generate Better Quizzes For Practice
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    Multiple Choice
                  </h3>
                  <p className="text-gray-600">
                    Auto-generate MCQs from your notes
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    Fill in the Blanks
                  </h3>
                  <p className="text-gray-600">
                    Test key concept understanding
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">💡</div>
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    Flashcards
                  </h3>
                  <p className="text-gray-600">
                    Quick review with smart flashcards
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
                <p className="text-gray-500 mb-4 text-lg">Quiz interface preview</p>
                <div className="space-y-3">
                  <div className="bg-blue-100 h-4 rounded animate-pulse" />
                  <div className="bg-blue-100 h-4 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Features Section */}
        <div className="mt-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800">
            More Study Tools
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
                📓 Smart Note-Taking
              </h3>
              <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                Encourage students to build notes in Open Canvas with AI-powered
                suggestions and automatic organization.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-bold text-lg">
                Learn more →
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
                🎴 AI Flashcard Generator
              </h3>
              <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                Build AI-generated real-world flashcards for practice. Convert any
                study material into interactive learning cards.
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-bold text-lg">
                Learn more →
              </button>
            </div>
          </div>
        </div>

        {/* Swipe Feature Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-10 max-w-4xl mx-auto shadow-xl">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              ✨ Swipe Feature Coming Soon
            </h3>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Interactive swipe cards for quick learning and memorization
            </p>
            <div className="flex justify-center gap-4">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 w-24 h-32 hover:bg-white/30 transition-colors" />
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 w-24 h-32 hover:bg-white/30 transition-colors" />
              <div className="bg-white/20 backdrop-blur rounded-lg p-4 w-24 h-32 hover:bg-white/30 transition-colors" />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
            Ready to Study Smarter?
          </h2>
          <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students already using Study Budd to improve their grades
            and study more efficiently.
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-5 px-10 rounded-lg text-xl transition-all transform hover:scale-105 shadow-xl">
            Get Started Free →
          </button>
        </div>
      </div>
    </main>
  );
}
