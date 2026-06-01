"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [country, setCountry] = useState("");

    const handleSearch = (e?: React.SyntheticEvent<HTMLFormElement>, selectedCountry?: string) => {
        if (e) e.preventDefault();

        const params = new URLSearchParams();
        if (query.trim()) params.set("termino", query);

        const effectiveCountry = selectedCountry ?? country;
        if (effectiveCountry && effectiveCountry !== "all") params.set("pais", effectiveCountry);

        // Determine target path
        const currentPath = globalThis.location.pathname;
        const isSearchPage = currentPath === '/search' || currentPath === '/home';
        const targetPath = isSearchPage ? currentPath : '/home';

        router.push(`${targetPath}?${params.toString()}`);
    };

    const onCountryChange = (val: string) => {
        setCountry(val);
        handleSearch(undefined, val);
    };

    return (
        <form onSubmit={handleSearch} className="relative flex items-center gap-2 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                    type="search"
                    placeholder="Buscar artistas, usuarios..."
                    className="h-10 w-full rounded-xl bg-white/5 border-white/10 pl-9 text-sm text-white placeholder:text-zinc-500 focus:bg-white/10 focus:border-indigo-500/50 transition-all border-0 ring-1 ring-white/10 focus:ring-indigo-500/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <Select value={country} onValueChange={onCountryChange}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white/5 border-0 ring-1 ring-white/10 text-sm text-white focus:bg-zinc-900 focus:ring-indigo-500/50 transition-all">
                    <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                    <SelectItem value="all" className="text-zinc-400">País</SelectItem>
                    {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                            {c.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <button type="submit" className="hidden">Buscar</button>
        </form>
    );
}
