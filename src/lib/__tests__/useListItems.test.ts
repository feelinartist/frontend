import { renderHook, act } from "@testing-library/react";
import { useListItems } from "../useListItems";

describe("useListItems", () => {
  it("should initialize with empty array if no options provided", () => {
    const { result } = renderHook(() => useListItems());
    expect(result.current.items).toEqual([]);
  });

  it("should initialize with provided initialItems", () => {
    const { result } = renderHook(() => useListItems({ initialItems: [1, 2, 3] }));
    expect(result.current.items).toEqual([1, 2, 3]);
  });

  it("should add item", () => {
    const { result } = renderHook(() => useListItems<number>());
    act(() => {
      result.current.addItem(1);
    });
    expect(result.current.items).toEqual([1]);
  });

  it("should remove item by value", () => {
    const { result } = renderHook(() => useListItems({ initialItems: [1, 2, 3] }));
    act(() => {
      result.current.removeItem(2);
    });
    expect(result.current.items).toEqual([1, 3]);
  });

  it("should remove item by index", () => {
    const { result } = renderHook(() => useListItems({ initialItems: [1, 2, 3] }));
    act(() => {
      result.current.removeItemAt(1);
    });
    expect(result.current.items).toEqual([1, 3]);
  });

  it("should set items directly", () => {
    const { result } = renderHook(() => useListItems({ initialItems: [1, 2] }));
    act(() => {
      result.current.setItems([4, 5, 6]);
    });
    expect(result.current.items).toEqual([4, 5, 6]);
  });

  it("should clear items", () => {
    const { result } = renderHook(() => useListItems({ initialItems: [1, 2, 3] }));
    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toEqual([]);
  });
});
