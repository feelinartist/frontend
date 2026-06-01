"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PlacesEditorProps {
    readonly items: readonly string[];
    readonly onChange: (items: readonly string[]) => void;
    readonly placeholder?: string;
}

export function PlacesEditor({ items, onChange, placeholder = "Agregar lugar..." }: Readonly<PlacesEditorProps>) {
    const [value, setValue] = useState("");

    const add = () => {
        const v = value.trim();
        if (!v) return;
        onChange([...items, v]);
        setValue("");
    };

    const remove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Lugares donde te has presentado</Label>

            <div className="flex gap-2">
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            add();
                        }
                    }}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600"
                />

                <Button type="button" onClick={add} variant="secondary" className="h-11 w-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white p-0 flex items-center justify-center shrink-0">
                    <span className="text-xl">+</span>
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {items.map((lugar, index) => (
                    <div key={`${lugar}-${index}`} className="flex items-center gap-1 bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full text-xs">
                        <span>{lugar}</span>
                        <button type="button" onClick={() => remove(index)} className="hover:text-white cursor-pointer ml-1 opacity-60 hover:opacity-100">
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
