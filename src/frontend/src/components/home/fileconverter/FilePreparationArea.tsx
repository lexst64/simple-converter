import { DragEvent } from "react";
import { SUPPORTED_FORMATS } from "../../../constants";
import FileDropArea from "../../common/FileDropArea";
import { FileHolder } from "./FileConverter"
import SelectedFile from "./SelectedFiles";

interface FilePreparationAreaProps {
    fileHolders: FileHolder[];
    isUploading: boolean;

    onFileFormatChange: (fileHolderId: string, newFormat: string) => void;
    onFileRemove: (fileHolderId: string) => void;
    /** File handler on drop and select. */
    onFileSelect: (files: File[]) => void; 
}

export default function FilePreparationArea({ fileHolders, isUploading, onFileFormatChange, onFileRemove, onFileSelect }: FilePreparationAreaProps) {    
    const handleFileDrop = (ev: DragEvent) => {
        onFileSelect(Array.from(ev.dataTransfer.files))
    }
    
    return (
        <div className='file-preparation-area'>
            <FileDropArea onDrop={handleFileDrop}>
                <div className='selected-files-container'>
                    {fileHolders.map(item => {
                        return (
                            <SelectedFile key={item.id}
                                fileName={item.file.name}
                                fileSize={item.file.size}
                                outFormats={SUPPORTED_FORMATS}
                                isValid={item.isValid}
                                errorMessage={item.errorMessage}
                                isUploading={isUploading}
                                
                                onFileRemove={() => onFileRemove(item.id)}
                                onFileFormatChange={(newFormat) => onFileFormatChange(item.id, newFormat)}
                            />
                        )
                    })}
                </div>
            </FileDropArea>
        </div>
    )
}
