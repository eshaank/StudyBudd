import { render, screen } from "@testing-library/react";
import AuthLayout, { AuthLoadingScreen } from "../app/(auth)/components/AuthLayout";

describe("AuthLayout", () => {
  it("renders children", () => {
    render(
      <AuthLayout featurePanel={null}>
        <div>Login Form</div>
      </AuthLayout>
    );
    expect(screen.getByText("Login Form")).toBeInTheDocument();
  });

  it("renders the feature panel", () => {
    render(
      <AuthLayout featurePanel={<div>Feature Panel</div>}>
        <div>Form</div>
      </AuthLayout>
    );
    expect(screen.getByText("Feature Panel")).toBeInTheDocument();
  });

  it("renders with correct layout structure", () => {
    const { container } = render(
      <AuthLayout featurePanel={<div>Panel</div>}>
        <div>Form</div>
      </AuthLayout>
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("min-h-screen");
  });
});

describe("AuthLoadingScreen", () => {
  it("shows 'Checking session...' text", () => {
    render(<AuthLoadingScreen />);
    expect(screen.getByText("Checking session...")).toBeInTheDocument();
  });
});
