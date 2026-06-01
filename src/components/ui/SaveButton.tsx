import React from 'react';
import { Loader2, Save } from 'lucide-react';

type Props = {
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
  readonly children?: React.ReactNode;
};

export function SaveButton({ isLoading, disabled, children }: Props) {
  return (
    <div className="pt-4">
      <button
        type="submit"
        className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 rounded-xl text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando cambios...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {children || 'Guardar Cambios'}
          </>
        )}
      </button>
    </div>
  );
}

export default SaveButton;
