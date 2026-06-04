import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashedEmptyState } from "../DashedEmptyState";

describe("DashedEmptyState", () => {
  it("renders correctly with no props", () => {
    const { container } = render(<DashedEmptyState />);
    expect(container.firstChild).toBeInTheDocument();
    // It should render empty without loading, title, subtitle
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    expect(screen.queryByText(/./)).toBeNull(); // No text content
  });

  it("renders loading spinner when loading is true", () => {
    const { container } = render(<DashedEmptyState loading={true} />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<DashedEmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<DashedEmptyState subtitle="Please create an item" />);
    expect(screen.getByText("Please create an item")).toBeInTheDocument();
  });

  it("renders loading, title, and subtitle together", () => {
    const { container } = render(
      <DashedEmptyState loading={true} title="Loading" subtitle="Wait..." />
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Wait...")).toBeInTheDocument();
  });
});
