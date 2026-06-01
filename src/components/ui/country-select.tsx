import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';

interface CountrySelectProps {
    readonly value: string;
    readonly onValueChange: (value: string) => void;
    readonly placeholder?: string;
    readonly className?: string;
}

export function CountrySelect({ value, onValueChange, placeholder = 'Selecciona tu país', className = '' }: CountrySelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={`w-full bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-4 text-sm ${className}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl max-h-[300px] overflow-y-auto">
                {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                            <Image
                                src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                alt={country.name}
                                width={20}
                                height={15}
                                className="w-5 h-auto object-cover rounded-sm"
                                unoptimized
                            />
                            <span>{country.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
