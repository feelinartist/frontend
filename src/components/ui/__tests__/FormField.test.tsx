import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { FormField } from "../FormField";

describe("FormField", () => {
  it("renders label and input correctly", () => {
    render(<FormField label="Test Label" id="test-input" />);
    
    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", "test-input");

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "test-input");
  });

  it("applies custom container and input classes", () => {
    render(
      <FormField 
        label="Test Label" 
        containerClassName="custom-container"
        className="custom-input"
      />
    );
    
    const container = screen.getByText("Test Label").parentElement;
    expect(container).toHaveClass("custom-container");

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-input");
  });

  it("shows error message and applies error styles when error is provided", () => {
    render(<FormField label="Test Label" error="This is an error" />);
    
    const errorMessage = screen.getByText("This is an error");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass("text-red-400");

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("shows helper text when provided", () => {
    render(<FormField label="Test Label" helperText="This is helper text" />);
    
    const helperText = screen.getByText("This is helper text");
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass("text-zinc-500");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<FormField label="Test Label" ref={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("passes other props to input", () => {
    render(<FormField label="Test Label" placeholder="Placeholder Text" type="email" disabled />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Placeholder Text");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeDisabled();
  });
});
