import { renderHook, act } from "@testing-library/react";
import { useSyncedState } from "../use-synced-state";

describe("useSyncedState", () => {
  it("should initialize with the initializer value", () => {
    const initializer = () => "initial";
    const { result } = renderHook(() => useSyncedState("syncValue", initializer));
    
    expect(result.current[0]).toBe("initial");
  });

  it("should update state when setState is called", () => {
    const { result } = renderHook(() => useSyncedState("syncValue", () => "initial"));
    
    act(() => {
      result.current[1]("updated");
    });
    
    expect(result.current[0]).toBe("updated");
  });

  it("should update state when synced value changes", () => {
    let syncValue = "v1";
    let initializerValue = "initial1";
    
    const { result, rerender } = renderHook(() => useSyncedState(syncValue, () => initializerValue));
    
    expect(result.current[0]).toBe("initial1");

    // Change syncValue and initializer
    syncValue = "v2";
    initializerValue = "initial2";
    
    rerender();
    
    expect(result.current[0]).toBe("initial2");
  });

  it("should not update state when synced value stays the same", () => {
    const syncValue = "v1";
    let initializerValue = "initial1";
    
    const { result, rerender } = renderHook(() => useSyncedState(syncValue, () => initializerValue));
    
    act(() => {
      result.current[1]("updated");
    });
    
    // Change initializer but not syncValue
    initializerValue = "initial2";
    rerender();
    
    expect(result.current[0]).toBe("updated");
  });
});
