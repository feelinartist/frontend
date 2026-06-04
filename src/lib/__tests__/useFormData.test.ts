import { renderHook, act } from "@testing-library/react";
import { useFormData } from "../useFormData";

describe("useFormData", () => {
    it("should initialize with initialData", () => {
        const { result } = renderHook(() =>
            useFormData({
                initialData: { name: "John", age: "30" },
                dependencies: []
            })
        );
        expect(result.current.formData).toEqual({ name: "John", age: "30" });
    });

    it("should update formData when dependencies change", () => {
        const initialData1 = { name: "John" };
        const initialData2 = { name: "Jane" };

        const { result, rerender } = renderHook(
            ({ initialData, dependencies }) => useFormData({ initialData, dependencies }),
            {
                initialProps: { initialData: initialData1, dependencies: [1] }
            }
        );

        expect(result.current.formData).toEqual({ name: "John" });

        // Update with new dependencies and initialData
        rerender({ initialData: initialData2, dependencies: [2] });

        expect(result.current.formData).toEqual({ name: "Jane" });
    });

    it("should not update formData when dependencies are the same", () => {
        const initialData1 = { name: "John" };
        const initialData2 = { name: "Jane" }; // Even if this changes, deps are same

        const { result, rerender } = renderHook(
            ({ initialData, dependencies }) => useFormData({ initialData, dependencies }),
            {
                initialProps: { initialData: initialData1, dependencies: [1] }
            }
        );

        rerender({ initialData: initialData2, dependencies: [1] });

        expect(result.current.formData).toEqual({ name: "John" });
    });

    it("should update formData when dependencies length changes", () => {
        const { result, rerender } = renderHook(
            ({ initialData, dependencies }) => useFormData({ initialData, dependencies }),
            {
                initialProps: { initialData: { name: "John" }, dependencies: [1] }
            }
        );

        rerender({ initialData: { name: "Jane" }, dependencies: [1, 2] });

        expect(result.current.formData).toEqual({ name: "Jane" });
    });

    it("should handle change for normal fields", () => {
        const { result } = renderHook(() =>
            useFormData({
                initialData: { name: "John" },
                dependencies: []
            })
        );

        act(() => {
            result.current.handleChange({
                target: { name: "name", value: "Jane" }
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formData).toEqual({ name: "Jane" });
    });

    it("should handle change for numeroTelefono field (stripping non-digits)", () => {
        const { result } = renderHook(() =>
            useFormData({
                initialData: { numeroTelefono: "123" },
                dependencies: []
            })
        );

        act(() => {
            result.current.handleChange({
                target: { name: "numeroTelefono", value: "123abc456" }
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formData).toEqual({ numeroTelefono: "123456" });
    });

    it("should update specific field using updateField", () => {
        const { result } = renderHook(() =>
            useFormData({
                initialData: { name: "John", age: 30 },
                dependencies: []
            })
        );

        act(() => {
            result.current.updateField("age", 31);
        });

        expect(result.current.formData).toEqual({ name: "John", age: 31 });
    });

    it("should allow setFormData with a functional updater", () => {
        const { result } = renderHook(() =>
            useFormData({
                initialData: { name: "John", age: 30 },
                dependencies: []
            })
        );

        act(() => {
            result.current.setFormData((prev) => ({ ...prev, age: prev.age + 1 }));
        });

        expect(result.current.formData).toEqual({ name: "John", age: 31 });
    });
});
