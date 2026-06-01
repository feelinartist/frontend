import { useState } from "react";

interface UseListItemsOptions<T> {
    initialItems?: T[];
}

interface UseListItemsReturn<T> {
    items: T[];
    addItem: (item: T) => void;
    removeItem: (item: T) => void;
    removeItemAt: (index: number) => void;
    setItems: (items: T[]) => void;
    clear: () => void;
}

/**
 * Generic hook for managing a list of items (add/remove operations)
 */
export function useListItems<T>(
    options: UseListItemsOptions<T> = {}
): UseListItemsReturn<T> {
    const { initialItems = [] } = options;
    const [items, setItems] = useState<T[]>(initialItems);

    const addItem = (item: T) => {
        setItems(prev => [...prev, item]);
    };

    const removeItem = (item: T) => {
        setItems(prev => prev.filter(i => i !== item));
    };

    const removeItemAt = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const clear = () => {
        setItems([]);
    };

    return {
        items,
        addItem,
        removeItem,
        removeItemAt,
        setItems,
        clear,
    };
}
