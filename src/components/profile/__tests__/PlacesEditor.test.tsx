import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlacesEditor } from "../PlacesEditor";

describe("PlacesEditor", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders list of items", () => {
    render(<PlacesEditor items={["Club A", "Bar B"]} onChange={mockOnChange} />);
    expect(screen.getByText("Club A")).toBeInTheDocument();
    expect(screen.getByText("Bar B")).toBeInTheDocument();
  });

  it("adds item on button click", () => {
    render(<PlacesEditor items={[]} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText("Agregar lugar...");
    const addBtn = screen.getByRole("button", { name: "+" });

    fireEvent.change(input, { target: { value: "New Place" } });
    fireEvent.click(addBtn);

    expect(mockOnChange).toHaveBeenCalledWith(["New Place"]);
  });

  it("adds item on Enter key down", () => {
    render(<PlacesEditor items={[]} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText("Agregar lugar...");

    fireEvent.change(input, { target: { value: "New Place 2" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockOnChange).toHaveBeenCalledWith(["New Place 2"]);
  });

  it("does not add item on other key down", () => {
    render(<PlacesEditor items={[]} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText("Agregar lugar...");

    fireEvent.change(input, { target: { value: "New Place 3" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("does not add empty item", () => {
    render(<PlacesEditor items={[]} onChange={mockOnChange} />);
    const addBtn = screen.getByRole("button", { name: "+" });

    fireEvent.click(addBtn);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("removes item on click remove button", () => {
    render(<PlacesEditor items={["Club A"]} onChange={mockOnChange} />);
    const removeBtn = screen.getByRole("button", { name: "×" });

    fireEvent.click(removeBtn);
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});
