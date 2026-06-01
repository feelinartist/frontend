import { useState } from 'react';

export function useProfileFormControls(initialDate?: string | Date, initialVerified = true) {
    const [date, setDate] = useState<Date | undefined>(() =>
        initialDate ? new Date(initialDate) : undefined
    );
    const [open, setOpen] = useState(false);
    const [verified, setVerified] = useState(initialVerified);

    return {
        date,
        setDate,
        open,
        setOpen,
        verified,
        setVerified,
    } as const;
}
