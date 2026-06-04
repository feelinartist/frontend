import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsernameInput } from "@/components/auth/UsernameInput";

type NameAndUsernameSectionProps = {
  readonly nameLabel: string;
  readonly nameId: string;
  readonly nameValue: string;
  readonly namePlaceholder: string;
  readonly onNameChange: (value: string) => void;
  readonly usernameValue: string;
  readonly onUsernameChange: (value: string) => void;
  readonly onStatusChange: (value: boolean) => void;
  readonly usuarioId?: string;
};

export function NameAndUsernameSection({
  nameLabel,
  nameId,
  nameValue,
  namePlaceholder,
  onNameChange,
  usernameValue,
  onUsernameChange,
  onStatusChange,
  usuarioId,
}: NameAndUsernameSectionProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={nameId} className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
          {nameLabel}
        </Label>
        <Input
          id={nameId}
          name={nameId}
          placeholder={namePlaceholder}
          required
          value={nameValue}
          onChange={(event) => onNameChange(event.target.value)}
          className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <UsernameInput
          value={usernameValue}
          onChange={onUsernameChange}
          onStatusChange={onStatusChange}
          usuarioId={usuarioId}
        />
      </div>
    </>
  );
}
