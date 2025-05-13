import React from 'react';
import { StatusMessageLevel } from '../../../types';
import { MdOutlineClose } from 'react-icons/md';
import IconButton from '../buttons/IconButton';
import styled, { css, keyframes } from 'styled-components';

const MessageContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
`;

const shrink = keyframes`
    from {
        width: 100%;
    }
    to {
        width: 0%;
    }
`;

const animateMixin = css`
    transform: translateZ(0);
    backface-visibility: hidden;
    animation: ${shrink} var(--timeout-duration) linear forwards;
`;

const TimeoutIndicator = styled.div<{ $animate: boolean }>`
    width: 0%;
    background-color: #ffffffa1;
    height: 5px;

    will-change: width;
    ${props => props.$animate && animateMixin}
`;

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
    level: StatusMessageLevel;
    hasTimeout: boolean;
    onClose: () => void;
}

function BaseMessage({ children, onClose, hasTimeout, ...props }: MessageProps) {
    return (
        <div {...props}>
            <MessageContent>
                {children}
                <IconButton onClick={onClose}>
                    <MdOutlineClose />
                </IconButton>
            </MessageContent>
            <TimeoutIndicator $animate={hasTimeout} />
        </div>
    );
}

const messageTypeMixins = {
    info: css`
        background-color: var(--secondary-bg-color);
    `,
    warning: css``,
    error: css`
        background-color: rgb(243, 194, 181);
    `,
};

const Message = styled(BaseMessage)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-radius: 5px;
    overflow: hidden;

    ${props => props.level in messageTypeMixins && messageTypeMixins[props.level]}
`;

export default Message;
