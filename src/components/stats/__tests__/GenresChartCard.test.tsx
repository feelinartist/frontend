import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GenresChartCard } from "../GenresChartCard";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data }: any) => (
      <div data-testid="pie">
        {data.map((d: any, i: number) => (
          <span key={i} data-testid={`pie-slice-${i}`} data-fill={d.fill}>
            {d.genero}
          </span>
        ))}
      </div>
    ),
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe("GenresChartCard", () => {
  it("renders the title", () => {
    render(<GenresChartCard generosPorConteo={[]} />);
    expect(screen.getByText("Géneros Más Pedidos")).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    render(<GenresChartCard generosPorConteo={[]} />);
    expect(screen.getByText("No hay datos de géneros disponibles")).toBeInTheDocument();
  });

  it("renders empty state when data is null/undefined", () => {
    render(<GenresChartCard generosPorConteo={null as any} />);
    expect(screen.getByText("No hay datos de géneros disponibles")).toBeInTheDocument();
  });

  it("renders chart when data is provided and assigns colors correctly", () => {
    const data = [
      { genero: "Rock", conteo: 10, porcentaje: 10 },
      { genero: "Pop", conteo: 20, porcentaje: 20 },
      { genero: "Jazz", conteo: 30, porcentaje: 30 },
      { genero: "Classical", conteo: 40, porcentaje: 40 },
      { genero: "Hip Hop", conteo: 50, porcentaje: 50 },
      { genero: "R&B", conteo: 60, porcentaje: 60 },
      { genero: "Electronic", conteo: 70, porcentaje: 70 },
      { genero: "Country", conteo: 80, porcentaje: 80 },
      { genero: "Blues", conteo: 90, porcentaje: 90 }, // 9th item, should wrap around colors
    ];
    render(<GenresChartCard generosPorConteo={data} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
    
    // Check if colors wrap around correctly
    const slice0 = screen.getByTestId("pie-slice-0");
    expect(slice0).toHaveAttribute("data-fill", COLORS[0]);
    
    const slice8 = screen.getByTestId("pie-slice-8");
    expect(slice8).toHaveAttribute("data-fill", COLORS[0]); // Wraps around (8 % 8 === 0)
  });
});
