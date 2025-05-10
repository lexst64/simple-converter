import React from 'react';
import { StatusMessageLevel } from '../../../types';
import { MdOutlineClose } from 'react-icons/md';
import IconButton from '../IconButton';
import classNames from 'classnames';

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
    level: StatusMessageLevel;
    hasTimeout: boolean;
    onClose: () => void;
}

export default function Message({ children, level, onClose, hasTimeout, ...props }: MessageProps) {
    return (
        <div className={classNames('status-bar-message', level)} {...props}>
            <div className="status-bar-message-info">
                {children}
                <IconButton onClick={onClose}>
                    <MdOutlineClose />
                </IconButton>
            </div>
            <div className={classNames('status-bar-timeout-indicator', { animate: hasTimeout })} />
        </div>
    );
}
