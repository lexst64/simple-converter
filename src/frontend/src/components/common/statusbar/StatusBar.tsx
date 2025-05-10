import Message from './Message';
import { useStatus } from '../../../hooks/Status';

export default function StatusBar() {
    const { messages, deleteMessage, removeTimeout, resetTimeout } = useStatus();

    return (
        <div className="status-bar">
            {messages.map(m => (
                <Message
                    hasTimeout={m.timeoutId !== undefined}
                    onPointerEnter={() => {
                        if (m.timeoutId === undefined) {
                            return;
                        }
                        removeTimeout(m.id);
                    }}
                    onPointerLeave={() => {
                        if (m.timeoutId !== undefined) {
                            return;
                        }
                        resetTimeout(m.id);
                    }}
                    onClose={() => deleteMessage(m.id)}
                    key={m.id}
                    level={m.level}
                >
                    <span className="non-selectable">{m.content}</span>
                </Message>
            ))}
        </div>
    );
}
