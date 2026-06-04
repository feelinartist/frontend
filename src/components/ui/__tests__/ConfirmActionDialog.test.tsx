import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

describe("ConfirmActionDialog", () => {
  it("renders trigger and dialog content correctly", () => {
    const onConfirmMock = vi.fn();
    render(
      <ConfirmActionDialog
        trigger={<button>Abrir</button>}
        title="¿Estás seguro?"
        description="Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        onConfirm={onConfirmMock}
      />
    );

    // Open the dialog
    fireEvent.click(screen.getByText("Abrir"));

    // Check content
    expect(screen.getByText("¿Estás seguro?")).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();

    // Cancel doesn't trigger confirm
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onConfirmMock).not.toHaveBeenCalled();

    // Open again
    fireEvent.click(screen.getByText("Abrir"));

    // Confirm triggers action
    fireEvent.click(screen.getByText("Sí, eliminar"));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });
});
