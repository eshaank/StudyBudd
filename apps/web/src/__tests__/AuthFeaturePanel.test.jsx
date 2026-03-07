import { render, screen } from "@testing-library/react";
import AuthFeaturePanel from "../app/(auth)/components/AuthFeaturePanel";

describe("AuthFeaturePanel", () => {
  const props = {
    badge: "Study smarter",
    title: "Your AI Study Companion",
    description: "Plan smarter. Learn faster.",
    features: ["Feature A", "Feature B", "Feature C"],
    tip: "Finish your homework",
  };

  it("renders the badge text", () => {
    render(<AuthFeaturePanel {...props} />);
    expect(screen.getByText("Study smarter")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<AuthFeaturePanel {...props} />);
    expect(screen.getByText("Your AI Study Companion")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<AuthFeaturePanel {...props} />);
    expect(screen.getByText("Plan smarter. Learn faster.")).toBeInTheDocument();
  });

  it("renders all features", () => {
    render(<AuthFeaturePanel {...props} />);
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  it("renders the tip when provided", () => {
    render(<AuthFeaturePanel {...props} />);
    expect(screen.getByText("Finish your homework")).toBeInTheDocument();
  });

  it("does not render tip section when tip is not provided", () => {
    render(<AuthFeaturePanel {...props} tip={undefined} />);
    expect(screen.queryByText("Finish your homework")).not.toBeInTheDocument();
  });
});
