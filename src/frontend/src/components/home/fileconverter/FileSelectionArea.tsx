import FileSelectButton from "../../common/UploadButton";
import { DragEvent} from "react";
import FileDropArea from "../../common/FileDropArea";

interface FileSelectionAreaProps {
    /** File handler on drop and select. */
    onFileSelect: (files: File[]) => void;
}

export default function FileSelectionArea({ onFileSelect }: FileSelectionAreaProps) {
    const handleDrop = (ev: DragEvent) => {
        onFileSelect(Array.from(ev.dataTransfer.files));
    }

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            onFileSelect(Array.from(ev.target.files))
        }
    }

    return (
        <FileDropArea onDrop={handleDrop}>
            <div className='file-selection-area'>
                <FileSelectButton onFileChange={handleFileSelect}>Select files</FileSelectButton>
                <span className='hint'>or drag-and-drop here (up to 1.0 GB)</span>
            </div>
        </FileDropArea>
    )
}
