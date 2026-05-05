import '@testing-library/jest-dom';

// uPlot probes `prefers-color-scheme` via `matchMedia`; JSDOM exposes no-op matchMedia unless defined.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: unknown) => ({
    matches: false,
    media: String(query),
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
