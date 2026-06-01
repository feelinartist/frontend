import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/components/ui/loading-screen", () => ({
    LoadingScreen: () => <div data-testid="loading-screen">Cargando...</div>,
}));

vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href, className }: any) => (
        <a href={href} className={className} data-testid="back-button">
            Atrás
        </a>
    ),
}));

vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// ── Imports under test ─────────────────────────────────────────────────────────

import Loading from "../loading";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";

// ── Test suites ────────────────────────────────────────────────────────────────

describe("Loading component", () => {
    it("renders the LoadingScreen component", () => {
        render(<Loading />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });
});

describe("PrivacyPage component", () => {
    beforeEach(() => {
        render(<PrivacyPage />);
    });

    it("renders the AnimatedBackground", () => {
        expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
    });

    it("renders the BackButton with href='/login'", () => {
        const backBtn = screen.getByTestId("back-button");
        expect(backBtn).toBeInTheDocument();
        expect(backBtn).toHaveAttribute("href", "/login");
    });

    it("renders the page title 'Política de Privacidad'", () => {
        expect(screen.getByText("Política de Privacidad")).toBeInTheDocument();
    });

    it("renders section '1. Información que Recopilamos'", () => {
        expect(screen.getByText("1. Información que Recopilamos")).toBeInTheDocument();
    });

    it("renders section '2. Uso de la Información'", () => {
        expect(screen.getByText("2. Uso de la Información")).toBeInTheDocument();
    });

    it("renders section '3. Visibilidad y Compartición de Datos'", () => {
        expect(screen.getByText("3. Visibilidad y Compartición de Datos")).toBeInTheDocument();
    });

    it("renders section '4. Seguridad'", () => {
        expect(screen.getByText("4. Seguridad")).toBeInTheDocument();
    });

    it("renders the 'Última actualización: Diciembre 2025' footer", () => {
        expect(screen.getByText("Última actualización: Diciembre 2025")).toBeInTheDocument();
    });

    it("renders list items under 'Uso de la Información'", () => {
        expect(screen.getByText("Proporcionar y mantener el servicio.")).toBeInTheDocument();
        expect(screen.getByText("Personalizar tu experiencia en eventos.")).toBeInTheDocument();
        expect(screen.getByText("Comunicarnos contigo sobre actualizaciones o cambios.")).toBeInTheDocument();
    });

    it("renders list items under 'Visibilidad y Compartición de Datos'", () => {
        expect(
            screen.getByText("Información de tu perfil público (nombre, foto, identificación).")
        ).toBeInTheDocument();
        expect(
            screen.getByText("Historial de solicitudes de canciones y dedicatorias.")
        ).toBeInTheDocument();
        expect(
            screen.getByText("Interacciones en tiempo real en los eventos.")
        ).toBeInTheDocument();
    });

    it("renders the important notice about the public nature of the platform", () => {
        expect(
            screen.getByText("IMPORTANTE: Naturaleza Pública de la Plataforma.")
        ).toBeInTheDocument();
    });
});

describe("TermsPage component", () => {
    beforeEach(() => {
        render(<TermsPage />);
    });

    it("renders the AnimatedBackground", () => {
        expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
    });

    it("renders the BackButton with href='/login'", () => {
        const backBtn = screen.getByTestId("back-button");
        expect(backBtn).toBeInTheDocument();
        expect(backBtn).toHaveAttribute("href", "/login");
    });

    it("renders the page title 'Términos de Servicio'", () => {
        expect(screen.getByText("Términos de Servicio")).toBeInTheDocument();
    });

    it("renders section '1. Aceptación de los Términos'", () => {
        expect(screen.getByText("1. Aceptación de los Términos")).toBeInTheDocument();
    });

    it("renders section '2. Descripción del Servicio'", () => {
        expect(screen.getByText("2. Descripción del Servicio")).toBeInTheDocument();
    });

    it("renders section '3. Cuentas de Usuario'", () => {
        expect(screen.getByText("3. Cuentas de Usuario")).toBeInTheDocument();
    });

    it("renders section '4. Conducta del Usuario'", () => {
        expect(screen.getByText("4. Conducta del Usuario")).toBeInTheDocument();
    });

    it("renders section '5. Transparencia y Datos Públicos'", () => {
        expect(screen.getByText("5. Transparencia y Datos Públicos")).toBeInTheDocument();
    });

    it("renders section '6. Modificaciones'", () => {
        expect(screen.getByText("6. Modificaciones")).toBeInTheDocument();
    });

    it("renders the 'Última actualización: Diciembre 2025' footer", () => {
        expect(screen.getByText("Última actualización: Diciembre 2025")).toBeInTheDocument();
    });
});
