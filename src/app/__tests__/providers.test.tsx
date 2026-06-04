import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Providers from "../providers";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}));

describe("Providers", () => {
  it("renders SessionProvider with children", () => {
    const { getByTestId, getByText } = render(
      <Providers>
        <div>Test Child</div>
      </Providers>
    );

    const sessionProvider = getByTestId("session-provider");
    expect(sessionProvider).toBeInTheDocument();
    expect(getByText("Test Child")).toBeInTheDocument();
  });
});
