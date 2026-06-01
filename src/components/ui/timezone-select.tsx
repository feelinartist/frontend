import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { timezones } from '@/lib/timezones';
import { formatTimezoneLabel } from '@/lib/form-helpers';

interface TimezoneSelectProps {
    readonly value: string;
    readonly onValueChange: (value: string) => void;
    readonly placeholder?: string;
    readonly className?: string;
}

export function TimezoneSelect({ value, onValueChange, placeholder = 'Selecciona tu zona horaria', className = '' }: TimezoneSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={`w-full bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-4 text-sm ${className}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl max-h-[260px] overflow-y-auto">
                {timezones.map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                        {formatTimezoneLabel(timezone)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
