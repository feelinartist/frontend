import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';

describe('Form & Table UI Components', () => {
    describe('Input', () => {
        it('renders input', () => {
            render(<Input placeholder="Enter text" type="text" />);
            const input = screen.getByPlaceholderText('Enter text');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('type', 'text');
        });
    });

    describe('Textarea', () => {
        it('renders textarea', () => {
            render(<Textarea placeholder="Enter multiline text" />);
            const textarea = screen.getByPlaceholderText('Enter multiline text');
            expect(textarea).toBeInTheDocument();
        });
    });

    describe('Label', () => {
        it('renders label', () => {
            render(<Label htmlFor="my-input">My Label</Label>);
            const label = screen.getByText('My Label');
            expect(label).toBeInTheDocument();
            expect(label).toHaveAttribute('for', 'my-input');
        });
    });

    describe('Table', () => {
        it('renders table components', () => {
            render(
                <Table>
                    <TableCaption>A list of invoices.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">INV001</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Credit Card</TableCell>
                            <TableCell className="text-right">$250.00</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell className="text-right">$250.00</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );

            expect(screen.getByText('A list of invoices.')).toBeInTheDocument();
            expect(screen.getByText('Invoice')).toBeInTheDocument();
            expect(screen.getByText('INV001')).toBeInTheDocument();
            expect(screen.getByText('Total')).toBeInTheDocument();
        });
    });
});
