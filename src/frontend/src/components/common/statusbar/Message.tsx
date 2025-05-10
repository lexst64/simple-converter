import React, { useEffect, useRef } from 'react';
import { StatusMessageLevel } from '../../../types';
import { MdOutlineClose } from 'react-icons/md';
import IconButton from '../IconButton';
import classNames from 'classnames';

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
    level: StatusMessageLevel;
    hasTimeout: boolean;
    onClose: () => void;
}

export default function Message({
    children,
    level = 'info',
    onClose,
    hasTimeout,
    ...props
}: MessageProps) {
    const indicatorRef = useRef<HTMLDivElement>(null);

    // Set "has-timeout" class after the component has rendered to trigger the CSS transition
    // for the timeout indicator
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!indicatorRef || !indicatorRef.current) {
                return;
            }
            if (hasTimeout) {
                indicatorRef.current.classList.add('has-timeout');
            } else {
                // does nothing if there's no such class
                indicatorRef.current.classList.remove('has-timeout');
            }
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [indicatorRef, hasTimeout]);

    return (
        <div className={classNames('status-bar-message', level)} {...props}>
            <div className="status-bar-message-info">
                {children}
                <IconButton onClick={onClose}>
                    <MdOutlineClose />
                </IconButton>
            </div>
            <div ref={indicatorRef} className="status-bar-timeout-indicator" />
        </div>
    );
}
