import { render, screen, fireEvent } from "@testing-library/react";
import ModeBtn from "../app/components/pomodoro/ModeBtn";

describe("ModeBtn", () => {
  const onClick = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders children text", () => {
    render(<ModeBtn active={false} activeClass="bg-indigo-600 text-white" onClick={onClick}>Focus</ModeBtn>);
    expect(screen.getByText("Focus")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<ModeBtn active={false} activeClass="bg-indigo-600 text-white" onClick={onClick}>Focus</ModeBtn>);
    fireEvent.click(screen.getByText("Focus"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies active class when active", () => {
    render(<ModeBtn active={true} activeClass="bg-indigo-600 text-white" onClick={onClick}>Focus</ModeBtn>);
    const btn = screen.getByText("Focus");
    expect(btn).toHaveClass("bg-indigo-600");
    expect(btn).toHaveClass("text-white");
  });

  it("applies inactive class when not active", () => {
    render(<ModeBtn active={false} activeClass="bg-indigo-600 text-white" onClick={onClick}>Focus</ModeBtn>);
    const btn = screen.getByText("Focus");
    expect(btn).toHaveClass("bg-white");
    expect(btn).toHaveClass("text-slate-600");
  });
});
