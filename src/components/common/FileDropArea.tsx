import classNames from "classnames";
import React, { DragEvent, useState } from "react";

interface FileDropAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    onDrop?: (ev: DragEvent) => void;
}

export default function FileDropArea({ onDrop, children }: FileDropAreaProps) {
    const [isDraggedOver, setIsDragedOver] = useState<boolean>(false);
        
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragedOver(true)
        }
        e.stopPropagation()
        e.preventDefault()
    }

    const handleDragLeave = (e: DragEvent) => {
        if  (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragedOver(false)
        }
        e.stopPropagation()
        e.preventDefault()
    }

    const handleDrop = (ev: DragEvent) => {
        setIsDragedOver(false);
        
        if (onDrop) {
            onDrop(ev);
        }
        
        ev.stopPropagation();
        ev.preventDefault();
    }

    return (
        <div className='file-drop-area'
                        onDrop={handleDrop}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
        >
            {children}
            <div className={classNames({ 'drop-popup': true, 'dragged-over': isDraggedOver })}>
                <i style={{ fontSize: '3rem' }} className="fa-regular fa-file"></i>
                <span style={{ fontSize: '1.5rem' }}>Drop here</span>
            </div>
        </div>
    );
}
