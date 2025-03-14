import classNames from "classnames";
import { ChangeEvent, DragEvent, useState } from "react";
import { toHumanReadable, truncateMiddle } from "../common/utils";

const oneGbInBytes = 1073741824;

interface FileHolder {
    key: string;
    file: File;
}

interface SelectedFileProps {
    name: string;
    size: number;
    onFormatChange: React.ChangeEventHandler<HTMLSelectElement>;
}

function SelectedFile({ name, size, onFormatChange }: SelectedFileProps) {
    const supportedFormats = ['mp3', 'flac', 'ogg', 'aac', 'alac']
    // const [selectedFormat, setSelectedFormat] = useState<string>('')

    return (
        <div className='selected-file'>
            <div className='selected-file-meta'>
                <span>{truncateMiddle(name, 40)}</span>
                <span>{toHumanReadable(size)}</span>
            </div>
            <label>
                <span>Output: </span>
                <select
                    className='selected-file-extension-select'
                    // value={selectedFormat}
                    onChange={onFormatChange}
                >
                    <option value=''>---</option>
                    {
                        supportedFormats
                            .map((item, i) => {
                                return <option key={i} value={item}>{item}</option>
                            })
                    }
                </select>
            </label>
        </div>
    )
}

export default function FileSelectionArea() {
    const [isDraggedOver, setIsDragedOver] = useState<boolean>(false)
    const [fileHolders, setFileHolders] = useState<FileHolder[]>([])

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: DragEvent) => {
        if  (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
        
        const newSelectedFiles = ([...ev.dataTransfer.files])
            .map(file => ({
                key: crypto.randomUUID(),
                file: file,
            }))
        setFileHolders([...fileHolders, ...newSelectedFiles])

        ev.stopPropagation()
        ev.preventDefault()
    }

    const handleFileFormatChange = (fileHolder: FileHolder) => (ev: ChangeEvent<HTMLSelectElement>) => {
        console.log(ev.target.value);
    }

    if (fileHolders.length > 0) {
        return (
            <div className={classNames({ 'file-preparation-area': true })}
                    onDrop={handleDrop}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
            >
                <div className='selected-files'>
                    {fileHolders.map(item => {
                        return (
                            <SelectedFile onFormatChange={handleFileFormatChange(item)}
                                key={item.key}
                                name={item.file.name}
                                size={item.file.size}
                            />
                        )
                    })}
                </div>
                <button>Convert</button>
            </div>
        )
    }
    return (
        <div className={classNames({ 'file-selection-area': true, 'dragged-over': isDraggedOver })}
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
        >
            <button>Select files</button>
            <span className='hint'>or drag-and-drop here (up to 1.0 GB)</span>
        </div>
    )
}
