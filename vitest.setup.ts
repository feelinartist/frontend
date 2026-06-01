import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React, { createContext, useContext } from 'react';
import { act } from 'react';
import { beforeAll, afterAll } from 'vitest';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
if (typeof window !== 'undefined') {
  (window as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.open = vi.fn();
    globalThis.open = window.open;
    window.scrollTo = vi.fn();
  try {
    const originalLocation = window.location;
    // @ts-expect-error - need to delete read-only location property
    delete window.location;
    const mockLocation = { ...originalLocation, assign: vi.fn(), replace: vi.fn(), reload: vi.fn(), href: '' } as unknown as string & Location;
    window.location = mockLocation;
  } catch {}
  window.history.back = vi.fn(() => {
    // No-op
  });
  window.history.go = vi.fn(() => {
    // No-op
  });
  window.history.pushState = window.history.pushState || vi.fn();
  window.history.replaceState = window.history.replaceState || vi.fn();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  if (typeof window.ResizeObserver === 'undefined') {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }

  if (typeof window.IntersectionObserver === 'undefined') {
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
      root = null;
      rootMargin = '';
      thresholds = [];
      constructor() {}
    }
    (window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  if (typeof window.MutationObserver === 'undefined') {
    class MockMutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
      constructor() {}
    }
    (window as unknown as { MutationObserver?: typeof MutationObserver }).MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;
  }

  console.error = vi.fn();
}

// Mock next/image globally with explicit alt attribute and strip Next-specific props
vi.mock("next/image", () => ({
    __esModule: true,
    default: (props: { src?: string | null; alt?: string; width?: number; height?: number; [key: string]: unknown }) => {
        const { src, alt, width, height, ...rest } = props;
        const nextImageProps = [
            "unoptimized",
            "priority",
            "fill",
            "placeholder",
            "sizes",
            "loader",
            "quality",
            "fetchPriority",
            "decoding",
            "loading",
        ];
        const allowed = Object.fromEntries(
            Object.entries(rest).filter(([key]) => !nextImageProps.includes(key))
        );

        const safeSrc = src === '' ? undefined : src;

        return React.createElement("img", {
            src: safeSrc,
            alt: alt || "",
            width,
            height,
            ...allowed,
        });
    },
}));

// Global mock for next/navigation and next/router to avoid 'Not implemented: navigation' messages
vi.mock('next/navigation', () => {
  const redirect = vi.fn();
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const forward = vi.fn();
  const refresh = vi.fn();
  const prefetch = vi.fn();
  const useRouter = () => ({ push, replace, back, forward, refresh, prefetch });
  const usePathname = () => '/';
  const useSearchParams = () => new URLSearchParams();
  const useParams = () => ({});
  return {
    redirect,
    useRouter,
    usePathname,
    useSearchParams,
    useParams,
  };
});

// Also mock next/router in case some modules import it
vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), asPath: '/' }),
}));

// Shared Select Context for mocking @/components/ui/select
const SelectContext = createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
}>({});

// Mock @/components/ui/select globally
type MockSelectProps = {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
};

type MockSelectItemProps = {
    children: React.ReactNode;
    value: string;
};

vi.mock('@/components/ui/select', () => {
    return {
        Select: ({ children, value, onValueChange }: MockSelectProps) => {
            return React.createElement(
                SelectContext.Provider,
                { value: { value, onValueChange } },
                React.createElement("div", { "data-testid": "mock-select", "data-value": value }, children)
            );
        },
        SelectTrigger: ({ children, className }: Pick<MockSelectProps, 'children' | 'className'>) => {
            return React.createElement(
                "button",
                { type: "button", "data-testid": "mock-select-trigger", className },
                children
            );
        },
        SelectValue: ({ placeholder }: Pick<MockSelectProps, 'placeholder'>) => {
            return React.createElement(
                "span",
                { "data-testid": "mock-select-value" },
                placeholder
            );
        },
        SelectContent: ({ children, className }: Pick<MockSelectProps, 'children' | 'className'>) => {
            return React.createElement(
                "div",
                { "data-testid": "mock-select-content", className },
                children
            );
        },
        SelectItem: ({ children, value }: MockSelectItemProps) => {
            const { onValueChange, value: selectedValue } = useContext(SelectContext);
            const isSelected = selectedValue === value;
            return React.createElement(
                "button",
                {
                    type: "button",
                    "data-testid": `mock-select-item-${value}`,
                    "data-selected": isSelected,
                    onClick: () => onValueChange?.(value),
                },
                children
            );
        },
    };
});

// Utility to flush microtasks wrapped in React act to avoid 'not wrapped in act' warnings
const actAndFlush = async (): Promise<void> => {
    await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
};

(globalThis as unknown as { actAndFlush?: () => Promise<void> }).actAndFlush = actAndFlush;

// Global mock for Avatar to avoid passing empty string src in many tests
vi.mock('@/components/ui/avatar', () => ({
    Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => React.createElement('div', { className, 'data-testid': 'avatar' }, children),
    AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => React.createElement('img', { src: src || undefined, alt: alt || '', 'data-testid': 'avatar-image' }),
    AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => React.createElement('span', { className, 'data-testid': 'avatar-fallback' }, children),
}));
// Prevent setting empty string on image `src` property to avoid React DOM warnings
try {
  const imgProto = HTMLImageElement.prototype;
  const originalDescriptor = Object.getOwnPropertyDescriptor(imgProto, 'src');
  if (originalDescriptor && originalDescriptor.set) {
    Object.defineProperty(imgProto, 'src', {
      configurable: true,
      enumerable: true,
      get: originalDescriptor.get,
      set: function (val: string) {
        if (val === '') return;
        return originalDescriptor.set?.call(this, val);
      },
    });
  }
} catch {
  // ignore in non-browser environments
}

// Provide a sane global fetch mock that returns an object with `json()` and `text()` helpers.
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    } as Response;
  }) as unknown as typeof fetch;
}

// Basic FileReader mock that triggers `onload` with a fake data URL. Tests that need error flows can override it.
class MockFileReader {
  onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
  result: string | ArrayBuffer | null = null;
  readAsDataURL(file: Blob | File) {
    void file;
    setTimeout(() => {
      this.result = 'data:image/png;base64,FAKE';
      this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
    }, 0);
  }
  readAsArrayBuffer(file: Blob | File) {
    void file;
    setTimeout(() => {
      this.result = 'FAKE_BUFFER';
      this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
    }, 0);
  }
}
(globalThis as unknown as { FileReader?: typeof FileReader }).FileReader = MockFileReader as unknown as typeof FileReader;

// Mock socket.io-client globally to prevent real socket connections
vi.mock('socket.io-client', () => {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  
  return {
    io: vi.fn(() => ({
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      emit: vi.fn(),
      off: vi.fn((event: string) => {
        if (listeners[event]) delete listeners[event];
      }),
      disconnect: vi.fn(),
      id: 'mock-socket-id',
      connected: true,
      connect: vi.fn(),
    })),
  };
});

// Mock navigator.geolocation with a default successful position. Tests can override to simulate permission errors.
if (!(navigator as unknown as { geolocation?: Geolocation }).geolocation) {
  (navigator as unknown as { geolocation?: Geolocation }).geolocation = {
    getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback) => {
      void error;
      if (typeof success === 'function') {
        success({ coords: { latitude: 0, longitude: 0, accuracy: 1 } } as GeolocationPosition);
      }
    },
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  } as Geolocation;
}

// Suppress console.error and console.warn to keep test output clean
// This hides expected errors from mocked failures, act() warnings, and React DOM attribute warnings.
// Set up dummy environment variables so auth warnings don't trigger
process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';

// Suppress console.error, console.warn, and console.log to keep test output clean
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});


