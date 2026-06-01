import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next-auth SessionProvider
vi.mock('next-auth/react', () => ({ SessionProvider: ({ children }: any) => <div data-testid="mock-session">{children}</div> }));

import Providers from './providers';

describe('Providers component', () => {
  it('renders children inside SessionProvider', () => {
    render(<Providers>{<span>Child</span>}</Providers>);
    expect(screen.getByTestId('mock-session')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });
});
