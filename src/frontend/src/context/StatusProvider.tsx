import React, { createContext, useCallback, useMemo, useState } from 'react';
import { StatusMessage, StatusMessageLevel } from '../types';

export interface StatusContextType {
    pushMessage: (content: string, level: StatusMessageLevel) => void;
    deleteMessage: (id: string) => void;
    messages: StatusMessage[];
}

export const StatusContext = createContext<StatusContextType | undefined>(undefined);

export default function StatusProvider({ children }: React.PropsWithChildren) {
    const [messages, setMessages] = useState<StatusMessage[]>([]);

    const deleteMessage = useCallback(
        (id: string) => setMessages(newMessages => newMessages.filter(m => m.id !== id)),
        [],
    );
    const pushMessage = useCallback(
        (content: string, level: StatusMessageLevel) => {
            const statusMessage = {
                id: crypto.randomUUID(),
                content,
                level,
            } satisfies StatusMessage;
            setMessages([...messages, statusMessage]);
            setTimeout(() => deleteMessage(statusMessage.id), 5000);
        },
        [messages, deleteMessage],
    );

    const contextValue = useMemo(
        () => ({
            messages,
            pushMessage,
            deleteMessage,
        }),
        [messages, pushMessage, deleteMessage],
    );

    return <StatusContext.Provider value={contextValue}>{children}</StatusContext.Provider>;
}
