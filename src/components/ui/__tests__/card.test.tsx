import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";

describe("Card Components", () => {
    it("renders Card component with content", () => {
        render(<Card data-testid="card">Card Content</Card>);
        expect(screen.getByTestId("card")).toHaveTextContent("Card Content");
    });

    it("renders CardHeader with content", () => {
        render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
        expect(screen.getByTestId("card-header")).toHaveTextContent("Header Content");
    });

    it("renders CardTitle with content using heading tag <h3>", () => {
        render(<CardTitle data-testid="card-title">Title Content</CardTitle>);
        const heading = screen.getByRole("heading", { level: 3 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent("Title Content");
    });

    it("renders CardDescription with content", () => {
        render(<CardDescription data-testid="card-description">Description Content</CardDescription>);
        expect(screen.getByTestId("card-description")).toHaveTextContent("Description Content");
    });

    it("renders CardContent with content", () => {
        render(<CardContent data-testid="card-content">Main Content</CardContent>);
        expect(screen.getByTestId("card-content")).toHaveTextContent("Main Content");
    });

    it("renders CardFooter with content", () => {
        render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>);
        expect(screen.getByTestId("card-footer")).toHaveTextContent("Footer Content");
    });
});
