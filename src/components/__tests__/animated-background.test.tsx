import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedBackground } from '../animated-background';

describe('AnimatedBackground component', () => {
  it('renders the component without errors', () => {
    const { container } = render(<AnimatedBackground />);
    expect(container).toBeTruthy();
  });

  it('renders a div with absolute positioning', () => {
    const { container } = render(<AnimatedBackground />);
    const mainDiv = container.querySelector('.absolute.inset-0');
    expect(mainDiv).toBeInTheDocument();
  });

  it('renders three animated blobs', () => {
    const { container } = render(<AnimatedBackground />);
    const blobs = container.querySelectorAll('.animate-blob');
    expect(blobs).toHaveLength(3);
  });

  it('has correct classes for accessibility and layout', () => {
    const { container } = render(<AnimatedBackground />);
    const mainDiv = container.querySelector('.absolute.inset-0');
    expect(mainDiv).toHaveClass('z-0');
    expect(mainDiv).toHaveClass('overflow-hidden');
    expect(mainDiv).toHaveClass('pointer-events-none');
  });

  it('renders blobs with different colors', () => {
    const { container } = render(<AnimatedBackground />);
    const blobs = container.querySelectorAll('.animate-blob');
    
    // First blob should be indigo
    expect(blobs[0]).toHaveClass('bg-indigo-500/20');
    
    // Second blob should be purple
    expect(blobs[1]).toHaveClass('bg-purple-500/20');
    
    // Third blob should be blue
    expect(blobs[2]).toHaveClass('bg-blue-500/10');
  });

  it('renders blobs with animation delays', () => {
    const { container } = render(<AnimatedBackground />);
    const blobs = container.querySelectorAll('.animate-blob');
    
    // Second blob has 2s delay
    expect(blobs[1]).toHaveStyle({ animationDelay: '2s' });
    
    // Third blob has 4s delay
    expect(blobs[2]).toHaveStyle({ animationDelay: '4s' });
  });
});
