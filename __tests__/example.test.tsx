import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Example Test", () => {
  it("should render correctly", () => {
    const TestComponent = () => <div>Hello, World!</div>;
    render(<TestComponent />);
    expect(screen.getByText("Hello, World!")).toBeInTheDocument();
  });
});
