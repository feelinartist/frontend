import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Icons } from '../icons';

describe('Icons component', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Icons />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has correct SVG attributes', () => {
    const { container } = render(<Icons />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('renders four colored paths (Google logo)', () => {
    const { container } = render(<Icons />);
    const paths = container.querySelectorAll('path[fill]');
    expect(paths.length).toBeGreaterThanOrEqual(4);
  });

  it('renders Google brand colors', () => {
    const { container } = render(<Icons />);
    const paths = container.querySelectorAll('path[fill]');
    
    const colors = Array.from(paths).map(p => p.getAttribute('fill'));
    expect(colors).toContain('#4285F4'); // Google Blue
    expect(colors).toContain('#34A853'); // Google Green
    expect(colors).toContain('#FBBC05'); // Google Yellow
    expect(colors).toContain('#EA4335'); // Google Red
  });

  it('accepts and applies custom SVG props', () => {
    const { container } = render(<Icons data-testid="custom-icon" className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-testid', 'custom-icon');
    expect(svg).toHaveClass('custom-class');
  });

  it('maintains width and height aspect ratio of 1:1', () => {
    const { container } = render(<Icons />);
    const svg = container.querySelector('svg');
    const width = svg?.getAttribute('width');
    const height = svg?.getAttribute('height');
    expect(width).toBe(height);
  });

  it('renders with proper Google sign-in styling', () => {
    const { container } = render(<Icons width="40" height="40" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });
});
