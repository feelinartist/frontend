import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';
import { Button, buttonVariants } from './button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

describe('UI Basic Components', () => {
    describe('Badge', () => {
        it('renders default badge', () => {
            render(<Badge>Default Badge</Badge>);
            const badge = screen.getByText('Default Badge');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
        });

        it('renders secondary badge', () => {
            render(<Badge variant="secondary">Secondary</Badge>);
            const badge = screen.getByText('Secondary');
            expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
        });

        it('renders destructive badge', () => {
            render(<Badge variant="destructive">Destructive</Badge>);
            const badge = screen.getByText('Destructive');
            expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
        });

        it('renders outline badge', () => {
            render(<Badge variant="outline">Outline</Badge>);
            const badge = screen.getByText('Outline');
            expect(badge).toHaveClass('text-foreground');
        });

        it('applies custom className', () => {
            render(<Badge className="custom-class">Custom</Badge>);
            expect(screen.getByText('Custom')).toHaveClass('custom-class');
        });
    });

    describe('Button', () => {
        it('renders button with default variant', () => {
            render(<Button>Click me</Button>);
            const btn = screen.getByRole('button', { name: 'Click me' });
            expect(btn).toBeInTheDocument();
            expect(btn).toHaveClass('bg-primary', 'text-primary-foreground');
        });

        it('renders button with destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>);
            const btn = screen.getByRole('button', { name: 'Delete' });
            expect(btn).toHaveClass('bg-destructive', 'text-destructive-foreground');
        });

        it('renders button with outline variant', () => {
            render(<Button variant="outline">Outline</Button>);
            const btn = screen.getByRole('button', { name: 'Outline' });
            expect(btn).toHaveClass('border-input');
        });

        it('renders button with secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);
            const btn = screen.getByRole('button', { name: 'Secondary' });
            expect(btn).toHaveClass('bg-secondary');
        });

        it('renders button with ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);
            const btn = screen.getByRole('button', { name: 'Ghost' });
            expect(btn).toHaveClass('hover:bg-accent');
        });

        it('renders button with link variant', () => {
            render(<Button variant="link">Link</Button>);
            const btn = screen.getByRole('button', { name: 'Link' });
            expect(btn).toHaveClass('text-primary', 'underline-offset-4');
        });

        it('renders with different sizes', () => {
            render(<Button size="sm">Small</Button>);
            expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-9', 'px-3');

            render(<Button size="lg">Large</Button>);
            expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-11', 'px-8');

            render(<Button size="icon">Icon</Button>);
            expect(screen.getByRole('button', { name: 'Icon' })).toHaveClass('h-10', 'w-10');
        });

        it('can be rendered as a different element using asChild', () => {
            render(
                <Button asChild>
                    <a href="/link">Link Button</a>
                </Button>
            );
            const link = screen.getByRole('link', { name: 'Link Button' });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/link');
        });
    });

    describe('Card', () => {
        it('renders card and its subcomponents', () => {
            render(
                <Card>
                    <CardHeader>
                        <CardTitle>Title</CardTitle>
                        <CardDescription>Description</CardDescription>
                    </CardHeader>
                    <CardContent>Content</CardContent>
                    <CardFooter>Footer</CardFooter>
                </Card>
            );

            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByText('Description')).toBeInTheDocument();
            expect(screen.getByText('Content')).toBeInTheDocument();
            expect(screen.getByText('Footer')).toBeInTheDocument();
        });

        it('renders CardTitle fallback when no children', () => {
            render(<CardTitle />);
            expect(screen.getByText('Título de Tarjeta')).toBeInTheDocument();
        });
    });
});
