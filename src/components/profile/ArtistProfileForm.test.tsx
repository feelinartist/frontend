import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks for child components to keep the test focused
vi.mock('@/components/profile/ProfileFormHeader', () => ({
  ProfileFormHeader: ({ nameValue, onNameChange, usernameValue, onUsernameChange }: any) => (
    <div>
      <input data-testid="header-name" value={nameValue} onChange={(e: any) => onNameChange(e.target.value)} />
      <input data-testid="header-username" value={usernameValue} onChange={(e: any) => onUsernameChange(e.target.value)} />
    </div>
  )
}));

vi.mock('@/components/profile/ProfileContactSection', () => ({
  ProfileContactSection: ({ city, onCityChange }: any) => (
    <div>
      <input data-testid="contact-city" value={city} onChange={(e: any) => onCityChange(e.target.value)} />
    </div>
  )
}));

// Prevent useSyncedState from causing repeated updates during tests
vi.mock('@/lib/use-synced-state', () => ({
  useSyncedState: (value: unknown, initializer: () => unknown) => [initializer(), (v: unknown) => v],
}));

import { ArtistProfileForm } from './ArtistProfileForm';

const baseCountries = [{ name: 'Peru', code: 'PE', phoneCode: '+51' }];

const makeProps = (overrides = {}) => ({
  userData: {
    nombre: 'Test Name',
    nombreUsuario: 'testuser',
    correo: 'a@b.com',
    perfilArtista: { biografia: 'bio', lugaresConocidos: ['Local A'] }
  },
  countries: baseCountries,
  onSubmit: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
  ...overrides
});

describe('ArtistProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and allows adding/removing lugares and submits form', async () => {
    const props = makeProps();
    render(<ArtistProfileForm {...props} />);

    // Ensure bio textarea exists and has initial value
    const bio = screen.getByPlaceholderText(/Cuéntanos un poco sobre ti/i);
    expect(bio).toBeInTheDocument();

    // Add a new lugar
    const lugarInput = screen.getByPlaceholderText('Agregar lugar...');
    fireEvent.change(lugarInput, { target: { value: 'Club X' } });
    const addButton = screen.getByText('+');
    fireEvent.click(addButton);

    await waitFor(() => expect(screen.getByText('Club X')).toBeInTheDocument());

    // Remove the place specifically for 'Club X'
    const clubXNode = screen.getByText('Club X');
    const clubXContainer = clubXNode.closest('div');
    const removeButton = clubXContainer?.querySelector('button');
    expect(removeButton).toBeTruthy();
    if (removeButton) fireEvent.click(removeButton);

    await waitFor(() => expect(screen.queryByText('Club X')).not.toBeInTheDocument());

    // Submit the form via the SaveButton
    const submitButton = screen.getByText(/Guardar Cambios/i);
    fireEvent.click(submitButton);

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalled());
  });
});
