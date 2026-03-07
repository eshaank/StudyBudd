import { render, screen, fireEvent } from "@testing-library/react";
import GoogleAuthButton from "../app/(auth)/components/GoogleAuthButton";

describe("GoogleAuthButton", () => {
  const onClick = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders the default label", () => {
    render(<GoogleAuthButton onClick={onClick} loading={false} />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("renders the loading label when loading", () => {
    render(<GoogleAuthButton onClick={onClick} loading={true} />);
    expect(screen.getByText("Opening Google...")).toBeInTheDocument();
  });

  it("renders custom labels", () => {
    render(
      <GoogleAuthButton onClick={onClick} loading={false} label="Sign in with Google" loadingLabel="Please wait..." />
    );
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<GoogleAuthButton onClick={onClick} loading={false} />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("button is disabled when loading", () => {
    render(<GoogleAuthButton onClick={onClick} loading={true} />);
    expect(screen.getByText("Opening Google...").closest("button")).toBeDisabled();
  });

  it("renders OR divider", () => {
    render(<GoogleAuthButton onClick={onClick} loading={false} />);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });
});
