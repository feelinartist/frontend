import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryPhoneSelector } from "@/components/ui/country-phone-selector";
import { CountrySelect } from "@/components/ui/country-select";
import { TimezoneSelect } from "@/components/ui/timezone-select";

type ProfileContactSectionProps = {
  readonly country: string;
  readonly city: string;
  readonly phoneCode: string;
  readonly phoneNumber: string;
  readonly timezone: string;
  readonly onCountryChange: (value: string) => void;
  readonly onCityChange: (value: string) => void;
  readonly onPhoneCodeChange: (value: string) => void;
  readonly onPhoneNumberChange: (value: string) => void;
  readonly onTimezoneChange: (value: string) => void;
};

export function ProfileContactSection({
  country,
  city,
  phoneCode,
  phoneNumber,
  timezone,
  onCountryChange,
  onCityChange,
  onPhoneCodeChange,
  onPhoneNumberChange,
  onTimezoneChange,
}: ProfileContactSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1.5">
        <Label htmlFor="numeroTelefono" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          Número de celular
        </Label>
        <div className="flex gap-3">
          <CountryPhoneSelector value={phoneCode} onValueChange={onPhoneCodeChange} />
          <Input
            id="numeroTelefono"
            name="numeroTelefono"
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(event.target.value.replaceAll(/\D/g, ""))}
            className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm flex-1"
            placeholder="999 999 999"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pais" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          País
        </Label>
        <CountrySelect value={country} onValueChange={onCountryChange} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ciudad" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          Ciudad
        </Label>
        <Input
          id="ciudad"
          name="ciudad"
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
          placeholder="Ciudad"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zonaHoraria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          Zona Horaria
        </Label>
        <TimezoneSelect value={timezone} onValueChange={onTimezoneChange} />
      </div>
    </div>
  );
}
