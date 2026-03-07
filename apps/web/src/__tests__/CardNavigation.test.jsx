import { render, screen, fireEvent } from "@testing-library/react";
import CardNavigation from "../app/dashboard/flashcards/components/CardNavigation";

const defaultProps = {
  index: 1,
  cards: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
  accentColor: "#6366f1",
  progressPct: 66,
  disabledPrev: false,
  disabledNext: false,
  prev: jest.fn(),
  next: jest.fn(),
  goToCard: jest.fn(),
};

function renderNav(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<CardNavigation {...props} />);
}

describe("CardNavigation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders Prev and Next buttons", () => {
    renderNav();
    expect(screen.getByText("Prev")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls prev when Prev button is clicked", () => {
    renderNav();
    fireEvent.click(screen.getByText("Prev"));
    expect(defaultProps.prev).toHaveBeenCalledTimes(1);
  });

  it("calls next when Next button is clicked", () => {
    renderNav();
    fireEvent.click(screen.getByText("Next"));
    expect(defaultProps.next).toHaveBeenCalledTimes(1);
  });

  it("disables Prev button when disabledPrev is true", () => {
    renderNav({ disabledPrev: true });
    expect(screen.getByText("Prev").closest("button")).toBeDisabled();
  });

  it("disables Next button when disabledNext is true", () => {
    renderNav({ disabledNext: true });
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
  });

  it("renders dot indicators for each card", () => {
    renderNav();
    const dots = screen.getAllByRole("button", { name: /Go to card/ });
    expect(dots).toHaveLength(3);
  });

  it("calls goToCard when a dot indicator is clicked", () => {
    renderNav();
    const dots = screen.getAllByRole("button", { name: /Go to card/ });
    fireEvent.click(dots[2]);
    expect(defaultProps.goToCard).toHaveBeenCalledWith(2);
  });

  it("shows progress numbers based on index", () => {
    renderNav({ index: 0 });
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
