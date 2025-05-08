import { useEffect } from 'react';

export default function useEscapeKey(onKeydown: (ev: KeyboardEvent) => void): void {
    useEffect(() => {
        const handler = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape') {
                onKeydown(ev);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onKeydown]);
}
