import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.unmock('@/components/ui/avatar');
vi.unmock('@/components/ui/select');

import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from './alert-dialog';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from './select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from './dropdown-menu';
import { Switch } from './switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Separator } from './separator';

describe('Radix Components', () => {
    describe('Avatar', () => {
        it('renders avatar components', () => {
            render(
                <Avatar className="custom">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            );
            // Since image doesn't load immediately in jsdom, fallback might be visible
            expect(screen.getByText('CN')).toBeInTheDocument();
        });
    });

    describe('Dialog', () => {
        it('renders dialog components', () => {
            render(
                <Dialog open={true}>
                    <DialogTrigger>Open</DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Title</DialogTitle>
                            <DialogDescription>Desc</DialogDescription>
                        </DialogHeader>
                        <div>Content</div>
                        <DialogFooter>Footer</DialogFooter>
                    </DialogContent>
                </Dialog>
            );
            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByText('Desc')).toBeInTheDocument();
            expect(screen.getByText('Footer')).toBeInTheDocument();
        });
    });

    describe('AlertDialog', () => {
        it('renders alert dialog components', () => {
            render(
                <AlertDialog open={true}>
                    <AlertDialogTrigger>Open</AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Title</AlertDialogTitle>
                            <AlertDialogDescription>Desc</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Action</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            );
            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByText('Desc')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Action')).toBeInTheDocument();
        });
    });

    describe('Popover', () => {
        it('renders popover components', () => {
            render(
                <Popover open={true}>
                    <PopoverTrigger>Open</PopoverTrigger>
                    <PopoverContent>Content</PopoverContent>
                </Popover>
            );
            expect(screen.getByText('Content')).toBeInTheDocument();
        });
    });

    describe('Select', () => {
        it('renders select components', () => {
            render(
                <Select open={true}>
                    <SelectTrigger>
                        <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Fruits</SelectLabel>
                            <SelectItem value="apple">Apple</SelectItem>
                            <SelectItem value="banana">Banana</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                    </SelectContent>
                </Select>
            );
            expect(screen.getByText('Fruits')).toBeInTheDocument();
            expect(screen.getByText('Apple')).toBeInTheDocument();
        });
    });

    describe('DropdownMenu', () => {
        it('renders dropdown menu components', () => {
            render(
                <DropdownMenu open={true}>
                    <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                Profile
                                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuCheckboxItem checked>Check</DropdownMenuCheckboxItem>
                        <DropdownMenuRadioGroup value="top">
                            <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSub defaultOpen>
                            <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem>SubItem</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
            expect(screen.getByText('My Account')).toBeInTheDocument();
            expect(screen.getByText('Profile')).toBeInTheDocument();
            expect(screen.getByText('Check')).toBeInTheDocument();
            expect(screen.getByText('Top')).toBeInTheDocument();
            expect(screen.getByText('Sub')).toBeInTheDocument();
        });
    });

    describe('Switch', () => {
        it('renders switch component', () => {
            render(<Switch checked={true} />);
            expect(screen.getByRole('switch')).toBeInTheDocument();
        });
    });

    describe('Tabs', () => {
        it('renders tabs component', () => {
            render(
                <Tabs defaultValue="account">
                    <TabsList>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">Account Content</TabsContent>
                    <TabsContent value="password">Password Content</TabsContent>
                </Tabs>
            );
            expect(screen.getByText('Account')).toBeInTheDocument();
            expect(screen.getByText('Password')).toBeInTheDocument();
            expect(screen.getByText('Account Content')).toBeInTheDocument();
        });
    });

    describe('Separator', () => {
        it('renders separator component', () => {
            render(<Separator orientation="horizontal" />);
            const sep = screen.getByRole('none');
            expect(sep).toBeInTheDocument();
        });
    });
});
