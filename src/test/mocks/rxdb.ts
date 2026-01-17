import { vi } from "vitest";

/**
 * Creates a mock for the useRxData hook that returns the provided data.
 * @param data - Array of data to return from the mock
 * @returns Mock function that can be used with vi.mock
 */
export function createMockUseRxData<T>(data: T[]) {
  return vi.fn(() => ({
    result: data,
    isFetching: false,
    isExhausted: true,
    fetchMore: vi.fn(),
    resetList: vi.fn(),
  }));
}

/**
 * Creates a mock RxDB collection with common methods.
 * @returns Mock collection object
 */
export function createMockCollection<T>() {
  return {
    insert: vi.fn((doc: T) => Promise.resolve(doc)),
    upsert: vi.fn((doc: T) => Promise.resolve(doc)),
    find: vi.fn(() => ({
      exec: vi.fn(() => Promise.resolve([])),
      $: { subscribe: vi.fn() },
    })),
    findOne: vi.fn(() => ({
      exec: vi.fn(() => Promise.resolve(null)),
      $: { subscribe: vi.fn() },
    })),
    remove: vi.fn(() => Promise.resolve()),
  };
}

/**
 * Creates a mock for the useRxCollection hook.
 * @returns Mock collection that can be returned from the hook
 */
export function createMockUseRxCollection<T>() {
  return vi.fn(() => createMockCollection<T>());
}

/**
 * Sets up a complete rxdb-hooks mock module.
 * Call this at the top of test files that need to mock RxDB hooks.
 *
 * @example
 * ```typescript
 * vi.mock("rxdb-hooks", () => setupRxdbMocks());
 *
 * const mockUseRxData = createMockUseRxData(testData);
 * vi.mocked(useRxData).mockImplementation(mockUseRxData);
 * ```
 */
export function setupRxdbMocks() {
  return {
    useRxData: vi.fn(() => ({
      result: [],
      isFetching: false,
      isExhausted: true,
      fetchMore: vi.fn(),
      resetList: vi.fn(),
    })),
    useRxCollection: vi.fn(() => createMockCollection()),
    useRxQuery: vi.fn(() => ({
      result: [],
      isFetching: false,
    })),
  };
}
