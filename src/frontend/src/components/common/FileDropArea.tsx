import React, { DragEvent, useState } from 'react';
import { MdFileUpload } from 'react-icons/md';
import styled from 'styled-components';

const Wrapper = styled.div`
    position: relative;
`;

const DropPopup = styled.div<{ $draggedOver: boolean }>`
    /* show only when is hovered with a file */
    display: ${props => (props.$draggedOver ? 'flex' : 'none')};

    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;

    position: absolute;
    top: 0;
    left: 0;

    background: #666effe6;
    color: #ffffff;

    /* ensure popup is above children */
    z-index: 1;
`;

const Hint = styled.span`
    font-size: 1.5rem;
`;

interface FileDropAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    onDrop?: (ev: DragEvent) => void;
}

export default function FileDropArea({ onDrop, children }: FileDropAreaProps) {
    const [isDraggedOver, setIsDragedOver] = useState<boolean>(false);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragedOver(true);
        }
        e.stopPropagation();
        e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragedOver(false);
        }
        e.stopPropagation();
        e.preventDefault();
    };

    const handleDrop = (ev: DragEvent) => {
        setIsDragedOver(false);

        if (onDrop) {
            onDrop(ev);
        }

        ev.stopPropagation();
        ev.preventDefault();
    };

    return (
        <Wrapper
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
        >
            {children}
            <DropPopup $draggedOver={isDraggedOver}>
                <MdFileUpload />
                <Hint>Drop here</Hint>
            </DropPopup>
        </Wrapper>
    );
}
