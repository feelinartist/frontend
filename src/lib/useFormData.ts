import { useEffect, useRef, useState } from "react";

interface UseFormDataOptions<T> {
    initialData: T;
    dependencies: readonly unknown[];
}

interface UseFormDataReturn<T> {
    formData: T;
    setFormData: (updater: ((prev: T) => T) | T) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    updateField: <K extends keyof T>(field: K, value: T[K]) => void;
}

/**
 * Generic hook for managing form state with syncing
 */
export function useFormData<T extends Record<string, unknown>>(
    options: UseFormDataOptions<T>
): UseFormDataReturn<T> {
    const { initialData, dependencies } = options;
    const [formData, setFormData] = useState<T>(initialData);
    const previousDependencies = useRef(dependencies);

    useEffect(() => {
        const depsChanged =
            previousDependencies.current.length !== dependencies.length ||
            dependencies.some((value, index) => previousDependencies.current[index] !== value);

        if (depsChanged) {
            previousDependencies.current = dependencies;
            setFormData(initialData);
        }
    }, [dependencies, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "numeroTelefono") {
            const numericValue = value.replaceAll(/\D/g, "");
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const updateField = <K extends keyof T>(field: K, value: T[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return {
        formData,
        setFormData,
        handleChange,
        updateField,
    };
}
