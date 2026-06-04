import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RootLayout, { metadata } from "../layout";

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mocked-inter-class" }),
}));

vi.mock("../providers", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe("RootLayout", () => {
  it("renders HTML, body, Providers, children, and Toaster correctly", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );

    const providers = getByTestId("providers");
    expect(providers).toBeInTheDocument();
    
    const child = getByTestId("child");
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe("Test Child");

    const toaster = getByTestId("toaster");
    expect(toaster).toBeInTheDocument();
  });

  it("exports valid metadata", () => {
    expect(metadata).toHaveProperty("title", "Feelin - Comunidad de Artistas");
    expect(metadata).toHaveProperty("description");
  });
});
