import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StyledSelect } from "../StyledSelect";
import { vi } from "vitest";
import React from "react";

vi.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { forwardRef } = require("react");
  return {
    Select: ({ children, value, onValueChange, disabled, defaultValue }: any) => (
      <div data-testid="select" data-value={value || defaultValue} data-disabled={disabled} onClick={() => onValueChange && onValueChange("test-value")}>
        {children}
        <button data-testid="trigger" onClick={() => onValueChange && onValueChange("mocked-value")} disabled={disabled}>Trigger</button>
      </div>
    ),
    SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
    SelectTrigger: forwardRef(function SelectTrigger({ children, className }: any, ref: any) { return <div data-testid="select-trigger" className={className} ref={ref}>{children}</div>; }),
    SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
    SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  };
});

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, className }: any) => <label className={className}>{children}</label>,
}));

vi.mock("@/lib/form-styles", () => ({
  FORM_STYLES: {
    label: "label-style",
    select: "select-style",
    selectContent: "select-content-style",
  }
}));

describe("StyledSelect", () => {
    it("renders properly", () => {
        render(
            <StyledSelect value="1" onValueChange={() => {}} placeholder="Select one" label="My Label">
                <div>One</div>
            </StyledSelect>
        );

        expect(screen.getByText("My Label")).toBeInTheDocument();
        expect(screen.getByTestId("select-value")).toHaveTextContent("Select one");
    });

    it("shows error when provided", () => {
        render(
            <StyledSelect value="1" onValueChange={() => {}} error="Required field">
                <div>One</div>
            </StyledSelect>
        );

        expect(screen.getByText("Required field")).toBeInTheDocument();
        expect(screen.getByTestId("select-trigger")).toHaveClass("border-red-500");
    });

    it("disables select when disabled prop is true", () => {
        render(
            <StyledSelect value="1" onValueChange={() => {}} disabled>
                <div>One</div>
            </StyledSelect>
        );

        expect(screen.getByTestId("select-trigger")).toHaveClass("opacity-50 cursor-not-allowed");
    });

    it("calls onValueChange", async () => {
        const onValueChange = vi.fn();
        render(
            <StyledSelect value="1" onValueChange={onValueChange}>
                <div>One</div>
            </StyledSelect>
        );

        await userEvent.click(screen.getByTestId("trigger"));
        expect(onValueChange).toHaveBeenCalledWith("mocked-value");
    });

    it("forwards ref", () => {
        const ref = React.createRef<HTMLDivElement>();
        render(
            <StyledSelect value="1" onValueChange={() => {}} ref={ref as any}>
                <div>One</div>
            </StyledSelect>
        );
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});
