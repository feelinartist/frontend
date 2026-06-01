import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NameAndUsernameSection } from "@/components/profile/NameAndUsernameSection";
import { ProfileDatePicker } from "@/components/profile/ProfileDatePicker";

type ProfileFormHeaderProps = {
  readonly email: string;
  readonly dateLabel: string;
  readonly date: Date | undefined;
  readonly dateOpen: boolean;
  readonly onDateOpenChange: (open: boolean) => void;
  readonly onDateSelect: (date: Date) => void;
  readonly datePlaceholder: string;
  readonly nameLabel: string;
  readonly nameId: string;
  readonly nameValue: string;
  readonly namePlaceholder: string;
  readonly onNameChange: (value: string) => void;
  readonly usernameValue: string;
  readonly onUsernameChange: (value: string) => void;
  readonly onStatusChange: (value: boolean) => void;
};

export function ProfileFormHeader({
  email,
  dateLabel,
  date,
  dateOpen,
  onDateOpenChange,
  onDateSelect,
  datePlaceholder,
  nameLabel,
  nameId,
  nameValue,
  namePlaceholder,
  onNameChange,
  usernameValue,
  onUsernameChange,
  onStatusChange,
}: ProfileFormHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NameAndUsernameSection
        nameLabel={nameLabel}
        nameId={nameId}
        nameValue={nameValue}
        namePlaceholder={namePlaceholder}
        onNameChange={onNameChange}
        usernameValue={usernameValue}
        onUsernameChange={onUsernameChange}
        onStatusChange={onStatusChange}
      />

      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="correo" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          Correo Electrónico
        </Label>
        <Input
          id="correo"
          value={email}
          disabled
          className="bg-zinc-900/50 border-zinc-800 text-zinc-500 cursor-not-allowed h-11 rounded-xl px-4 text-sm"
        />
        <p className="text-xs text-zinc-600 ml-1">El correo electrónico no se puede cambiar.</p>
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <ProfileDatePicker
          label={dateLabel}
          date={date}
          open={dateOpen}
          onOpenChange={onDateOpenChange}
          onSelect={onDateSelect}
          placeholder={datePlaceholder}
        />
      </div>
    </div>
  );
}
