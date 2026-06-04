import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PanelCard } from "../PanelCard";

describe("PanelCard", () => {
  it("renders with title and children only", () => {
    render(<PanelCard title="Test Title">Test Children</PanelCard>);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });

  it("renders with description and header actions", () => {
    render(
      <PanelCard
        title="Test Title 2"
        description="Test Description"
        headerActions={<button>Action</button>}
      >
        Test Children 2
      </PanelCard>
    );
    expect(screen.getByText("Test Title 2")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Test Children 2")).toBeInTheDocument();
  });
});
