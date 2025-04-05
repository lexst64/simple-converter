import Message from './Message';
import { useStatus } from '../../../hooks/Status';

export default function StatusBar() {
    const { messages, deleteMessage } = useStatus();

    return (
        <div className="status-bar">
            {messages.map(m => (
                <Message onClose={() => deleteMessage(m.id)} key={m.id} level={m.level}>
                    <span className="non-selectable">{m.content}</span>
                </Message>
            ))}
        </div>
    );
}
