import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock next/navigation redirect
vi.mock('next/navigation', () => ({
    redirect: vi.fn()
}));

import Home from '../page';
import * as nav from 'next/navigation';

describe('Dashboard home redirect', () => {
    it('calls redirect to /home', () => {
        // Call the component (it's a function that performs redirect)
        Home();
        expect((nav as any).redirect).toHaveBeenCalledWith('/home');
    });
});
