import Message from './Message';
import { useStatus } from '../../../hooks/Status';
import styled from 'styled-components';

const Wrapper = styled.div`
    /* make status bar absolute positioned relative to outer-container */
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px;

    display: flex;
    flex-direction: column;
    gap: 5px;

    z-index: 1;

    @media (max-width: 400px) {
        width: 100%;
    }
    @media (min-width: 400px) {
        width: 300px;
    }
`;

function StatusBar() {
    const { messages, deleteMessage, removeTimeout, resetTimeout } = useStatus();

    return (
        <Wrapper>
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
                    {m.content}
                </Message>
            ))}
        </Wrapper>
    );
}

export default StatusBar;
