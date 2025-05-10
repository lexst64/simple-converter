import React, { createContext, useCallback, useMemo, useState } from 'react';
import { StatusMessage, StatusMessageLevel } from '../types';

export interface StatusContextType {
    pushMessage: (content: string, level?: StatusMessageLevel) => void;
    deleteMessage: (id: string) => void;
    removeTimeout: (id: string) => void;
    resetTimeout: (id: string) => void;
    messages: StatusMessage[];
}

export const StatusContext = createContext<StatusContextType | undefined>(undefined);

export default function StatusProvider({ children }: React.PropsWithChildren) {
    const [messages, setMessages] = useState<StatusMessage[]>([]);

    const timeoutDurationMs = 5000;

    const deleteMessage = useCallback(
        (id: string) => {
            setMessages(messages => {
                const messageToDelete = messages.find(m => m.id === id);
                if (!messageToDelete) {
                    return messages;
                }
                clearTimeout(messageToDelete.timeoutId);
                return messages.filter(m => m.id !== id);
            });
        },
        [messages],
    );

    const pushMessage = useCallback(
        (content: string, level: StatusMessageLevel = 'info') => {
            const newMessage = {
                id: crypto.randomUUID(),
                content,
                level,
                timeoutId: setTimeout(() => deleteMessage(newMessage.id), timeoutDurationMs),
            } satisfies StatusMessage;
            setMessages([...messages, newMessage]);
        },
        [deleteMessage, messages],
    );

    const removeTimeout = useCallback(
        (id: string) => {
            setMessages(
                messages.map(m => {
                    if (m.id !== id) {
                        return m;
                    }
                    clearTimeout(m.timeoutId);
                    return { ...m, timeoutId: undefined };
                }),
            );
        },
        [messages],
    );

    const resetTimeout = useCallback(
        (id: string) => {
            setMessages(
                messages.map(m => {
                    if (m.id !== id) {
                        return m;
                    }
                    clearTimeout(m.timeoutId);
                    return {
                        ...m,
                        timeoutId: setTimeout(() => deleteMessage(m.id), timeoutDurationMs),
                    };
                }),
            );
        },
        [deleteMessage, messages],
    );

    const contextValue = useMemo(
        () => ({
            messages,
            pushMessage,
            deleteMessage,
            removeTimeout,
            resetTimeout,
        }),
        [messages, pushMessage, deleteMessage, removeTimeout, resetTimeout],
    );

    return <StatusContext.Provider value={contextValue}>{children}</StatusContext.Provider>;
}
