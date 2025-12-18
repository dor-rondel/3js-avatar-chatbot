import '@testing-library/jest-dom/vitest';

const ResizeObserverMock = {
  observe: () => {},
  unobserve: () => {},
  disconnect: () => {},
};

if (typeof globalThis.ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - test environment polyfill
  globalThis.ResizeObserver = ResizeObserverMock;
}
