import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from "@/components/ui/select";
import { countries, getCountryByPhoneCode } from "@/lib/countries";

interface CountryPhoneSelectorProps {
    readonly value: string;  // Phone code like "+51"
    readonly onValueChange: (phoneCode: string) => void;
    readonly className?: string;
}

export function CountryPhoneSelector({ value, onValueChange, className }: CountryPhoneSelectorProps) {
    const selectedCountry = getCountryByPhoneCode(value);

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={`w-[110px] bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-3 text-sm ${className || ''}`}>
                {selectedCountry ? (
                    <div className="flex items-center gap-2">
                        <Image
                            src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                            alt={selectedCountry.name}
                            width={20}
                            height={15}
                            className="w-5 h-auto object-cover rounded-sm"
                            unoptimized
                        />
                        <span>{selectedCountry.phoneCode}</span>
                    </div>
                ) : (
                    <span>{value}</span>
                )}
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px] overflow-y-auto">
                {countries.map(country => (
                    <SelectItem key={country.code} value={country.phoneCode}>
                        <div className="flex items-center gap-2">
                            <Image
                                src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                alt={country.name}
                                width={20}
                                height={15}
                                className="w-5 h-auto object-cover rounded-sm"
                                unoptimized
                            />
                            <span>{country.phoneCode}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
