import { render, screen, fireEvent } from "@testing-library/react";
import QuizView from "../features/quiz/components/QuizView";

// Mock FeedbackPanel
jest.mock("../features/quiz/components/FeedbackPanel", () => {
  return function MockFeedbackPanel({ onNext, isLast }) {
    return (
      <div data-testid="feedback-panel">
        <button onClick={onNext}>{isLast ? "See Results" : "Next Question"}</button>
      </div>
    );
  };
});

const mockQuestion = {
  id: "q1",
  prompt: "What is the time complexity of binary search?",
  options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
  correctIndex: 1,
};

const mockQuiz = {
  title: "DSA Quiz",
  questions: [mockQuestion, { id: "q2", prompt: "Q2", options: ["a", "b"], correctIndex: 0 }],
};

const defaultProps = {
  quiz: mockQuiz,
  q: mockQuestion,
  currentIndex: 0,
  cardKey: 0,
  pickedForCurrent: undefined,
  hasAnswered: false,
  isFirst: true,
  isLast: false,
  progressPct: 0,
  shakeRef: { current: null },
  selectAnswer: jest.fn(),
  goNext: jest.fn(),
  goBack: jest.fn(),
};

describe("QuizView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders question prompt", () => {
    render(<QuizView {...defaultProps} />);
    expect(screen.getByText("What is the time complexity of binary search?")).toBeInTheDocument();
  });

  it("renders all answer options with letter labels", () => {
    render(<QuizView {...defaultProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("O(n)")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("O(log n)")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("O(n^2)")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("O(1)")).toBeInTheDocument();
  });

  it("shows question counter", () => {
    render(<QuizView {...defaultProps} />);
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("calls selectAnswer when option is clicked", () => {
    render(<QuizView {...defaultProps} />);
    fireEvent.click(screen.getByText("O(log n)"));
    expect(defaultProps.selectAnswer).toHaveBeenCalledWith(1);
  });

  it("shows Previous button when not answered", () => {
    render(<QuizView {...defaultProps} />);
    expect(screen.getByText(/Previous/)).toBeInTheDocument();
  });

  it("disables Previous button when isFirst", () => {
    render(<QuizView {...defaultProps} />);
    const prevBtn = screen.getByText(/Previous/).closest("button");
    expect(prevBtn).toBeDisabled();
  });

  it("shows FeedbackPanel when answered", () => {
    render(<QuizView {...defaultProps} hasAnswered={true} pickedForCurrent={1} />);
    expect(screen.getByTestId("feedback-panel")).toBeInTheDocument();
  });

  it("hides Previous button when answered", () => {
    render(<QuizView {...defaultProps} hasAnswered={true} pickedForCurrent={1} />);
    expect(screen.queryByText(/Previous/)).not.toBeInTheDocument();
  });

  it("shows progress percentage", () => {
    render(<QuizView {...defaultProps} progressPct={50} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
