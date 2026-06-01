import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";

interface UsernameInputProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly onStatusChange: (isValid: boolean) => void;
    readonly currentUsername?: string; // To allow keeping the same username if editing
    readonly className?: string;
}

export function UsernameInput({
    value,
    onChange,
    onStatusChange,
    currentUsername,
    className
}: UsernameInputProps) {
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isValid, setIsValid] = useState(false);

    // Debounce verification or check on blur? 
    // Profile implementation used onBlur. Let's stick to that or a long debounce.
    // User interaction: user types -> value updates (clean) -> user leaves -> verify.

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Clean input (lowercase, no spaces/special chars)
        const rawValue = e.target.value;
        const cleanedValue = rawValue.toLowerCase().replaceAll(/[^a-z0-9._]/g, "");

        onChange(cleanedValue);

        // Reset status on change
        setIsValid(false);
        setError("");
        setSuggestions([]);
        onStatusChange(false);
    };

    const verifyUsername = async () => {
        if (!value) return;

        // If it's the same as current, it's valid (unless empty, but that's handled above)
        if (value === currentUsername?.toLowerCase()) {
            setIsValid(false);
            setError("");
            onStatusChange(true);
            return;
        }

        if (value.length < 3) {
            setError("Mínimo 3 caracteres");
            setIsValid(false);
            onStatusChange(false);
            return;
        }

        setVerifying(true);
        try {
            const response = await fetchApi('/api/usuarios/verificar-nombre-usuario', {
                method: 'POST',
                body: JSON.stringify({ nombreUsuario: value })
            });

            if (!response.ok) {
                setError("Error al verificar");
                setIsValid(false);
                onStatusChange(false);
                return;
            }

            const data = await response.json();
            if (data.disponible) {
                setError("");
                setSuggestions([]);
                setIsValid(true);
                onStatusChange(true);
            } else {
                setError("No disponible");
                setSuggestions(Array.isArray(data.sugerencias) ? data.sugerencias : []);
                setIsValid(false);
                onStatusChange(false);
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión");
            setIsValid(false);
            onStatusChange(false);
        } finally {
            setVerifying(false);
        }
    };

    const renderStatusIcon = () => {
        if (verifying) return <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />;
        if (isValid) return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (error) return <XCircle className="h-5 w-5 text-red-500" />;
        return null;
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor="username" className={cn("text-xs font-medium uppercase tracking-wider ml-1", error ? "text-red-500" : "text-zinc-500")}>
                Usuario {error && `- ${error.toUpperCase()}`}
            </Label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
                <Input
                    id="username"
                    value={value}
                    onChange={handleInputChange}
                    onBlur={verifyUsername}
                    className={cn(
                        "bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 transition-colors pl-8 pr-10",
                        error && "border-red-500 focus:border-red-500",
                        isValid && "border-green-500 focus:border-green-500"
                    )}
                    placeholder="usuario"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-2.5">
                    {renderStatusIcon()}
                </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <p className="text-xs text-zinc-400 mb-2 ml-1">Sugerencias disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((sug) => (
                            <button
                                key={sug}
                                type="button"
                                onClick={() => {
                                    onChange(sug);
                                    // Optionally trigger verification immediately or assume valid?
                                    // Better to just set it and let user verify or auto-verify.
                                    // Let's manually trigger state update to valid since it came from server suggestions
                                    setSuggestions([]);
                                    setError("");
                                    setIsValid(true);
                                    onStatusChange(true);
                                }}
                                className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors border border-zinc-700 hover:border-zinc-500"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
