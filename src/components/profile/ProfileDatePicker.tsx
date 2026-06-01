import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ProfileDatePickerProps = {
  readonly label: string;
  readonly date: Date | undefined;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (date: Date) => void;
  readonly placeholder: string;
};

export function ProfileDatePicker({
  label,
  date,
  open,
  onOpenChange,
  onSelect,
  placeholder,
}: ProfileDatePickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">{label}</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:text-white h-11 rounded-xl px-4 text-sm",
              !date && "text-zinc-600"
            )}
          >
            <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
            {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-2xl overflow-hidden" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(value) => {
              if (value) {
                onSelect(value);
                onOpenChange(false);
              }
            }}
            disabled={(day) => day > new Date()}
            className="p-4"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
