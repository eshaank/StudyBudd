import { render, screen, fireEvent } from "@testing-library/react";
import FlashcardViewer from "../app/dashboard/flashcards/components/FlashcardViewer";

// Mock CardNavigation since it's tested separately
jest.mock("../app/dashboard/flashcards/components/CardNavigation", () => {
  return function MockCardNavigation() {
    return <div data-testid="card-navigation">CardNavigation</div>;
  };
});

const mockCard = {
  id: "c1",
  front: "What is compatibilism?",
  back: "The view that free will is compatible with determinism.",
};

const defaultProps = {
  current: mockCard,
  isFlipped: false,
  setIsFlipped: jest.fn(),
  accentColor: "#6366f1",
  tab: "flashcards",
  index: 0,
  cards: [mockCard],
  progressPct: 100,
  disabledPrev: true,
  disabledNext: true,
  flip: jest.fn(),
  prev: jest.fn(),
  next: jest.fn(),
  goToCard: jest.fn(),
};

function renderViewer(overrides = {}) {
  return render(<FlashcardViewer {...{ ...defaultProps, ...overrides }} />);
}

describe("FlashcardViewer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders card front text", () => {
    renderViewer();
    expect(screen.getByText("What is compatibilism?")).toBeInTheDocument();
  });

  it("renders card back text", () => {
    renderViewer();
    expect(screen.getByText("The view that free will is compatible with determinism.")).toBeInTheDocument();
  });

  it("shows 'Flashcards' label when tab is flashcards", () => {
    renderViewer({ tab: "flashcards" });
    expect(screen.getByText("Flashcards")).toBeInTheDocument();
  });

  it("shows 'Preview' label when tab is not flashcards", () => {
    renderViewer({ tab: "learn" });
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("displays card count (1 of 1)", () => {
    renderViewer();
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
  });

  it("shows 0 of 0 when no cards", () => {
    renderViewer({ cards: [], current: null });
    expect(screen.getByText("0 of 0")).toBeInTheDocument();
  });

  it("shows empty state when current is null", () => {
    renderViewer({ current: null, cards: [] });
    expect(screen.getByText("No cards in this deck yet.")).toBeInTheDocument();
  });

  it("calls flip when Flip button is clicked", () => {
    renderViewer();
    fireEvent.click(screen.getByText(/Flip/));
    expect(defaultProps.flip).toHaveBeenCalledTimes(1);
  });

  it("calls setIsFlipped(false) when Front button is clicked", () => {
    renderViewer();
    fireEvent.click(screen.getByText("Front"));
    expect(defaultProps.setIsFlipped).toHaveBeenCalledWith(false);
  });

  it("calls setIsFlipped(true) when Back button is clicked", () => {
    renderViewer();
    fireEvent.click(screen.getByText("Back"));
    expect(defaultProps.setIsFlipped).toHaveBeenCalledWith(true);
  });

  it("renders CardNavigation when a card is present", () => {
    renderViewer();
    expect(screen.getByTestId("card-navigation")).toBeInTheDocument();
  });

  it("applies flipped class when isFlipped is true", () => {
    const { container } = renderViewer({ isFlipped: true });
    const inner = container.querySelector(".fc-card-inner");
    expect(inner).toHaveClass("flipped");
  });

  it("does not apply flipped class when isFlipped is false", () => {
    const { container } = renderViewer({ isFlipped: false });
    const inner = container.querySelector(".fc-card-inner");
    expect(inner).not.toHaveClass("flipped");
  });
});
