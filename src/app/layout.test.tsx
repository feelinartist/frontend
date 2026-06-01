import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next font utility used in layout
vi.mock('next/font/google', () => ({ Inter: () => ({ className: 'mock-inter' }) }));

// Mock local Providers (same relative path as layout.tsx)
vi.mock('./providers', () => ({
  default: ({ children }: any) => <div data-testid="mock-providers">{children}</div>
}));

// Mock Toaster from sonner
vi.mock('sonner', () => ({ Toaster: () => <div data-testid="toaster" /> }));

import RootLayout from './layout';

describe('RootLayout', () => {
  it('renders children inside Providers and shows Toaster', () => {
    render(
      <RootLayout>
        <div>TestChild</div>
      </RootLayout>
    );

    expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
    expect(screen.getByText('TestChild')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});
