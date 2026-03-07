"use client";

import QUIZ from "../../data/dsaQuiz.json";
import QuizPage from "../../../features/quiz/QuizPage";

export default function DashboardQuizzesRoute() {
  return <QuizPage quiz={QUIZ} />;
}
