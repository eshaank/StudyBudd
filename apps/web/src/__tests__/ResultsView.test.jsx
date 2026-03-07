import { render, screen, fireEvent } from "@testing-library/react";
import ResultsView from "../features/quiz/components/ResultsView";

// Mock ProgressRing
jest.mock("../features/quiz/components/ProgressRing", () => {
  return function MockProgressRing({ pct }) {
    return <div data-testid="progress-ring">{pct}%</div>;
  };
});

// Mock explanations
jest.mock("../features/quiz/constants/explanations", () => ({
  getExplanation: (q, picked) => `Explanation for ${q.id}`,
}));

const mockQuiz = {
  title: "DSA Quiz",
  questions: [
    { id: "q1", prompt: "Q1?", options: ["A", "B", "C"], correctIndex: 1 },
    { id: "q2", prompt: "Q2?", options: ["X", "Y"], correctIndex: 0 },
  ],
};

const breakdown = [
  { question: mockQuiz.questions[0], picked: 1, correct: 1, ok: true },
  { question: mockQuiz.questions[1], picked: 1, correct: 0, ok: false },
];

describe("ResultsView", () => {
  const resetQuiz = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders 'Session Complete' title", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText("Session Complete")).toBeInTheDocument();
  });

  it("renders score gauge", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByTestId("progress-ring")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThanOrEqual(1);
  });

  it("renders breakdown for each question", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText(/Q1: Q1\?/)).toBeInTheDocument();
    expect(screen.getByText(/Q2: Q2\?/)).toBeInTheDocument();
  });

  it("shows correct answer for wrong questions", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    // For the wrong answer (q2), correct option is "X"
    expect(screen.getByText(/Correct: X/)).toBeInTheDocument();
  });

  it("calls resetQuiz when Retry button is clicked", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    fireEvent.click(screen.getByText(/Retry Quiz/));
    expect(resetQuiz).toHaveBeenCalledTimes(1);
  });

  it("renders explanations for each question", () => {
    render(<ResultsView quiz={mockQuiz} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText("Explanation for q1")).toBeInTheDocument();
    expect(screen.getByText("Explanation for q2")).toBeInTheDocument();
  });
});
