import { RefObject, useEffect } from 'react';

export default function useClickOutside(
    ref: RefObject<HTMLElement | null>,
    onClickOutside: (ev: MouseEvent) => void,
): void {
    useEffect(() => {
        const handler = (ev: MouseEvent) => {
            if (ref.current && !ref.current.contains(ev.target as Node)) {
                onClickOutside(ev);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, [ref, onClickOutside]);
}
