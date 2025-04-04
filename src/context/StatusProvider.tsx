import React, { createContext, useCallback, useMemo, useState } from "react";
import { StatusMessage } from "../types";

export interface StatusContextType {
    pushMessage: (message: StatusMessage) => void;
    deleteMessage: (id: string) => void;
    messages: StatusMessage[];
}

export const StatusContext = createContext<StatusContextType | undefined>(undefined)

export default function StatusProvider({ children }: React.PropsWithChildren) {
    const [messages, setMessages] = useState<StatusMessage[]>([]); 

    const deleteMessage = useCallback(
        (id: string) => setMessages(newMessages => newMessages.filter(m => m.id !== id)),
        []
    )
    const pushMessage = useCallback(
        (message: StatusMessage) => {
            setMessages([...messages, message]);
            setTimeout(() => deleteMessage(message.id), 5000);
        },
        [messages, deleteMessage]
    )

    const contextValue = useMemo(() => ({
        messages,
        pushMessage,
        deleteMessage,
    }), [messages, pushMessage, deleteMessage]);

    return (
        <StatusContext.Provider value={contextValue}>
            {children}
        </StatusContext.Provider>
    )
}
