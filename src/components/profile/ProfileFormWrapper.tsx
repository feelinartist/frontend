import React from 'react';
import { SaveButton } from '@/components/ui/SaveButton';

interface ProfileFormWrapperProps {
  readonly onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly isLoading?: boolean;
  readonly saveDisabled?: boolean;
  readonly saveLabel?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function ProfileFormWrapper({ onSubmit, isLoading = false, saveDisabled = false, saveLabel = 'Guardar Cambios', children, className = '' }: ProfileFormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-8 ${className}`}>
      {children}

      <div className="pt-4">
        <SaveButton isLoading={!!isLoading} disabled={!!(isLoading || saveDisabled)}>
          {saveLabel}
        </SaveButton>
      </div>
    </form>
  );
}
