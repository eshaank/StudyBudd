import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import HorizontalScroll from "./components/HorizontalScroll";
import { createSupabaseServer } from "../lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const line1 =
    "1. Improve your learning skills and Study alongside effective A.I. study mate.";
  const line2 =
    "2. Create effective cheat sheets and learn according to your schedule!!";

  const cardsData = [
    {
      title: "Study Prep Sheets",
      description:
        "Deploy and build your custom study prep sheets based on our new A.I models.",
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

  const typingStyle = (text, delay = "0s") => ({
    "--nch": `${text.length}ch`,
    "--steps": text.length,
    "--dur": "3.2s",
    "--delay": delay,
  });

  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-white to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 px-4 py-8 sm:px-6 md:px-8 lg:px-12 xl:px-20">
      <main className="flex flex-col items-center max-w-7xl mx-auto">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <Image
            className="w-32 h-auto sm:w-40 md:w-48 lg:w-[180px]"
            src="/S.svg"
            alt="StudyBudd logo"
            width={180}
            height={38}
            priority
          />
        </div>

        <div className="text-center space-y-6 sm:space-y-8 w-full">
          {/* First typing text */}
          <div className="w-full flex justify-center px-2">
            <h1
              className="animate-typing overflow-hidden whitespace-normal sm:whitespace-nowrap border-r-2 sm:border-r-4 border-r-black dark:border-r-white pr-1 sm:pr-2 text-sm sm:text-base md:text-lg lg:text-[19px] font-medium leading-relaxed"
              style={typingStyle(line1, "0s")}
            >
              {line1}
            </h1>
          </div>

          {/* Second typing text */}
          <div className="w-full flex justify-center px-2">
            <h2
              className="animate-typing overflow-hidden whitespace-normal sm:whitespace-nowrap border-r-2 sm:border-r-4 border-r-black dark:border-r-white pr-1 sm:pr-2 text-sm sm:text-base md:text-lg lg:text-[20px] font-medium leading-relaxed"
              style={typingStyle(line2, "0.4s")}
            >
              {line2}
            </h2>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3 pt-4 sm:pt-6 md:pt-8">
            <Link
              href="/signup"
              className="click-btn btn-style501 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg inline-flex items-center justify-center"
            >
              <span className="relative z-10">ENROLL NOW!!</span>
            </Link>

            <Link
              href="/dashboard"
              className="click-btn btn-style501 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg inline-flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Carousel */}
          <div className="mt-8 sm:mt-10 md:mt-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">
              Our AI-Powered Features
            </h3>
            <HorizontalScroll cards={cardsData} />
          </div>
        </div>
      </main>
    </div>
  );
}
