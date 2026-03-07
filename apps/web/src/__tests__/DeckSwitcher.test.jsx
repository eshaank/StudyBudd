import { render, screen, fireEvent } from "@testing-library/react";
import DeckSwitcher from "../app/dashboard/flashcards/components/DeckSwitcher";

// Mock the constants module
jest.mock("../app/dashboard/flashcards/constants/flashcards", () => ({
  DEMO_DECKS: [
    { id: "deck-1", title: "PHIL-100", subtitle: "Philosophy", total: 42, color: "#6366f1" },
    { id: "deck-2", title: "CSE-130", subtitle: "CS", total: 55, color: "#0ea5e9" },
    { id: "deck-3", title: "CSE-114A", subtitle: "Haskell", total: 30, color: "#10b981" },
  ],
}));

describe("DeckSwitcher", () => {
  const setActiveDeckId = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders a button for each demo deck", () => {
    render(<DeckSwitcher activeDeckId="deck-1" setActiveDeckId={setActiveDeckId} />);
    expect(screen.getByText("PHIL-100")).toBeInTheDocument();
    expect(screen.getByText("CSE-130")).toBeInTheDocument();
    expect(screen.getByText("CSE-114A")).toBeInTheDocument();
  });

  it("calls setActiveDeckId when a deck button is clicked", () => {
    render(<DeckSwitcher activeDeckId="deck-1" setActiveDeckId={setActiveDeckId} />);
    fireEvent.click(screen.getByText("CSE-130"));
    expect(setActiveDeckId).toHaveBeenCalledWith("deck-2");
  });

  it("applies active styling to selected deck", () => {
    render(<DeckSwitcher activeDeckId="deck-1" setActiveDeckId={setActiveDeckId} />);
    const activeBtn = screen.getByText("PHIL-100");
    expect(activeBtn).toHaveStyle({ color: "#fff", background: "#6366f1" });
  });

  it("applies inactive styling to non-selected decks", () => {
    render(<DeckSwitcher activeDeckId="deck-1" setActiveDeckId={setActiveDeckId} />);
    const inactiveBtn = screen.getByText("CSE-130");
    expect(inactiveBtn).toHaveStyle({ color: "#475569", background: "#fff" });
  });
});
