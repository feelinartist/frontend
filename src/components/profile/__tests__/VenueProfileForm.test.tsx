import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VenueProfileForm } from "../VenueProfileForm";

vi.mock("@/components/profile/ProfileContactSection", () => ({
  ProfileContactSection: ({
    onCountryChange,
    onCityChange,
    onPhoneCodeChange,
    onPhoneNumberChange,
    onTimezoneChange,
  }: any) => (
    <div data-testid="profile-contact-section">
      <button onClick={() => onCountryChange("PE")} data-testid="change-country">Country</button>
      <button onClick={() => onCityChange("Lima")} data-testid="change-city">City</button>
      <button onClick={() => onPhoneCodeChange("+51")} data-testid="change-phone-code">Phone Code</button>
      <button onClick={() => onPhoneNumberChange("123456789")} data-testid="change-phone-number">Phone Num</button>
      <button onClick={() => onTimezoneChange("America/Lima")} data-testid="change-timezone">Timezone</button>
    </div>
  ),
}));

vi.mock("@/components/profile/ProfileFormHeader", () => ({
  ProfileFormHeader: ({
    onNameChange,
    onUsernameChange,
    onDateSelect,
    onStatusChange,
    onDateOpenChange
  }: any) => (
    <div data-testid="profile-form-header">
      <button onClick={() => onNameChange("New Name")} data-testid="change-name">Name</button>
      <button onClick={() => onUsernameChange("newuser")} data-testid="change-username">Username</button>
      <button onClick={() => onDateSelect(new Date("2023-01-01T00:00:00.000Z"))} data-testid="change-date">Date</button>
      <button onClick={() => onDateSelect(null)} data-testid="change-date-null">Date Null</button>
      <button onClick={() => onStatusChange(true)} data-testid="change-status">Status</button>
      <button onClick={() => onDateOpenChange(true)} data-testid="change-date-open">Date Open</button>
    </div>
  ),
}));

vi.mock("@/components/profile/ProfileFormWrapper", () => ({
  ProfileFormWrapper: ({ children, onSubmit }: any) => (
    <form data-testid="profile-form-wrapper" onSubmit={onSubmit}>
      {children}
      <button type="submit" data-testid="submit-btn">Submit</button>
    </form>
  ),
}));

describe("VenueProfileForm", () => {
  const defaultProps = {
    userData: {
      nombre: "Venue 1",
      nombreUsuario: "venue1",
      correo: "venue1@test.com",
      perfilDiscoteca: {
        ciudad: "City",
        pais: "Country",
        codigoTelefono: "+1",
        numeroTelefono: "123",
        zonaHoraria: "UTC",
        fechaFundacion: "2020-01-01T00:00:00.000Z",
      },
    },
    countries: [],
    isLoading: false,
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and initializes form data", () => {
    render(<VenueProfileForm {...defaultProps} />);
    expect(screen.getByTestId("profile-form-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("profile-form-header")).toBeInTheDocument();
    expect(screen.getByTestId("profile-contact-section")).toBeInTheDocument();
  });

  it("handles form submission with date", () => {
    render(<VenueProfileForm {...defaultProps} />);
    
    fireEvent.submit(screen.getByTestId("profile-form-wrapper"));
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      nombre: "Venue 1",
      nombreUsuario: "venue1",
      ciudad: "City",
      pais: "PE",
      codigoTelefono: "+1",
      numeroTelefono: "123",
      zonaHoraria: "UTC",
      fechaFundacion: "2020-01-01T00:00:00.000Z",
    }));
  });

  it("handles field updates in ProfileFormHeader", () => {
    render(<VenueProfileForm {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("change-name"));
    fireEvent.click(screen.getByTestId("change-username"));
    fireEvent.click(screen.getByTestId("change-date"));
    fireEvent.click(screen.getByTestId("change-status"));
    fireEvent.click(screen.getByTestId("change-date-open"));

    fireEvent.submit(screen.getByTestId("profile-form-wrapper"));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      nombre: "New Name",
      nombreUsuario: "newuser",
      fechaFundacion: "2023-01-01T00:00:00.000Z",
    }));
  });

  it("handles field updates in ProfileContactSection", () => {
    render(<VenueProfileForm {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("change-country"));
    fireEvent.click(screen.getByTestId("change-city"));
    fireEvent.click(screen.getByTestId("change-phone-code"));
    fireEvent.click(screen.getByTestId("change-phone-number"));
    fireEvent.click(screen.getByTestId("change-timezone"));

    fireEvent.submit(screen.getByTestId("profile-form-wrapper"));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      pais: "PE",
      ciudad: "Lima",
      codigoTelefono: "+51",
      numeroTelefono: "123456789",
      zonaHoraria: "America/Lima",
    }));
  });

  it("handles form submission with null date", () => {
    render(<VenueProfileForm {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("change-date-null"));
    fireEvent.submit(screen.getByTestId("profile-form-wrapper"));
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fechaFundacion: null,
    }));
  });

  it("handles null/undefined userData profile", () => {
    render(<VenueProfileForm {...defaultProps} userData={{}} />);
    fireEvent.submit(screen.getByTestId("profile-form-wrapper"));
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fechaFundacion: null,
    }));
  });
});
