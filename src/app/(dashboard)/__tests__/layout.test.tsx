import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import DashboardLayout from "../layout";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock auth lib
vi.mock("@/lib/auth", () => ({
  getAuthOptions: vi.fn(() => ({})),
}));

// Mock Navbar component
vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no session", async () => {
    (getServerSession as any).mockResolvedValue(null);

    const children = <div>Dashboard Content</div>;
    await DashboardLayout({ children });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when session has no user id", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { name: "Test User" },
    });

    const children = <div>Dashboard Content</div>;
    await DashboardLayout({ children });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders Navbar and children when user is authenticated", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-123", name: "Test User" },
    });

    const children = <div data-testid="dashboard-content">Dashboard Content</div>;
    const result = await DashboardLayout({ children });

    render(result);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
  });

  it("calls getAuthOptions during layout initialization", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user-123" },
    });

    const children = <div>Content</div>;
    await DashboardLayout({ children });

    expect(getAuthOptions).toHaveBeenCalled();
  });
});
