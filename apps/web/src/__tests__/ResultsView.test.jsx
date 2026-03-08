import { render, screen, fireEvent } from "@testing-library/react";
import ResultsView from "../features/quiz/components/ResultsView";

// Mock ProgressRing
jest.mock("../features/quiz/components/ProgressRing", () => {
  return function MockProgressRing({ pct }) {
    return <div data-testid="progress-ring">{pct}%</div>;
  };
});

const mockQuestions = [
  {
    id: "q1",
    question: "Q1?",
    options: [
      { label: "A", text: "Option A" },
      { label: "B", text: "Option B" },
      { label: "C", text: "Option C" },
    ],
    correct_option: "B",
    explanation: "Explanation for q1",
  },
  {
    id: "q2",
    question: "Q2?",
    options: [
      { label: "A", text: "Option X" },
      { label: "B", text: "Option Y" },
    ],
    correct_option: "A",
    explanation: "Explanation for q2",
  },
];

const breakdown = [
  { question: mockQuestions[0], picked: "B", ok: true },
  { question: mockQuestions[1], picked: "B", ok: false },
];

describe("ResultsView", () => {
  const resetQuiz = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders 'Session Complete' title", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText("Session Complete")).toBeInTheDocument();
  });

  it("renders score gauge", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByTestId("progress-ring")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThanOrEqual(1);
  });

  it("renders breakdown for each question", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText(/Q1: Q1\?/)).toBeInTheDocument();
    expect(screen.getByText(/Q2: Q2\?/)).toBeInTheDocument();
  });

  it("shows correct answer for wrong questions", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText(/Correct: A. Option X/)).toBeInTheDocument();
  });

  it("calls resetQuiz when Retry button is clicked", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    fireEvent.click(screen.getByText(/Retry Quiz/));
    expect(resetQuiz).toHaveBeenCalledTimes(1);
  });

  it("renders explanations for each question", () => {
    render(<ResultsView questions={mockQuestions} score={1} breakdown={breakdown} resetQuiz={resetQuiz} />);
    expect(screen.getByText("Explanation for q1")).toBeInTheDocument();
    expect(screen.getByText("Explanation for q2")).toBeInTheDocument();
  });
});
