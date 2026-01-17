import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "StudyBudd | AI-Powered Learning Platform",
  description:
    "Transform your learning experience with AI-powered study tools, smart quizzes, and personalized learning paths.",
  keywords: ["study", "AI", "learning", "education", "quizzes", "flashcards"],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {/* Background effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Gradient mesh background */}
          <div className="absolute inset-0 bg-mesh" />
          
          {/* Animated blobs */}
          <div 
            className="blob absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30"
            style={{ animationDelay: "0s" }}
          />
          <div 
            className="blob absolute top-1/2 -right-40 w-80 h-80 bg-cyan-500/20"
            style={{ animationDelay: "-4s" }}
          />
          <div 
            className="blob absolute -bottom-40 left-1/3 w-72 h-72 bg-purple-600/20"
            style={{ animationDelay: "-2s" }}
          />
          
          {/* Noise overlay */}
          <div className="absolute inset-0 noise" />
        </div>

        {/* Main content */}
        <div className="relative flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
