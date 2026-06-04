import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardPageShell } from "../DashboardPageShell";

// Mock animated background and back button
vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: { href: string }) => <button data-testid="back-button" data-href={href}>Back</button>
}));

describe("DashboardPageShell Component", () => {
    it("renders properly without headerRight", () => {
        render(
            <DashboardPageShell title="My Title" description="My Description" backHref="/home">
                <div data-testid="child-content">Content</div>
            </DashboardPageShell>
        );

        expect(screen.getByText("My Title")).toBeInTheDocument();
        expect(screen.getByText("My Description")).toBeInTheDocument();
        expect(screen.getByTestId("back-button")).toHaveAttribute("data-href", "/home");
        expect(screen.getByTestId("child-content")).toBeInTheDocument();
        expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
        expect(screen.queryByTestId("header-right")).not.toBeInTheDocument();
    });

    it("renders properly with headerRight", () => {
        render(
            <DashboardPageShell title="My Title" description="My Description" backHref="/home" headerRight={<div data-testid="header-right">Right</div>}>
                <div data-testid="child-content">Content</div>
            </DashboardPageShell>
        );

        expect(screen.getByTestId("header-right")).toBeInTheDocument();
        expect(screen.getByText("Right")).toBeInTheDocument();
    });
});
