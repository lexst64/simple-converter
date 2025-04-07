import { DragEvent } from 'react';
import FileDropArea from '../../common/FileDropArea';
import { FileHolder } from './FileConverter';
import SelectedFile from './SelectedFiles';

interface FilePreparationAreaProps {
    fileHolders: FileHolder[];

    onFileFormatChange: (fileHolderId: string, newFormat: string) => void;
    onFileRemove: (fileHolderId: string) => void;
    /** File handler on drop and select. */
    onFileSelect: (files: File[]) => void;
}

export default function FilePreparationArea({
    fileHolders,
    onFileFormatChange,
    onFileRemove,
    onFileSelect,
}: FilePreparationAreaProps) {
    const handleFileDrop = (ev: DragEvent) => {
        onFileSelect(Array.from(ev.dataTransfer.files));
    };

    return (
        <div className="file-preparation-area">
            <FileDropArea onDrop={handleFileDrop}>
                <div className="selected-files-container">
                    {fileHolders.map(fh => {
                        return (
                            <SelectedFile
                                key={fh.id}
                                fileHolder={fh}
                                onFileRemove={() => onFileRemove(fh.id)}
                                onFileFormatChange={newFormat =>
                                    onFileFormatChange(fh.id, newFormat)
                                }
                            />
                        );
                    })}
                </div>
            </FileDropArea>
        </div>
    );
}
