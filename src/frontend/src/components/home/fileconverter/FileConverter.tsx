import { useState } from "react";
import { toHumanReadable } from "../../../utils";
import uploadFile from "../../../services/fileupload.service";
import FilePreparationArea from "./FilePreparationArea";
import FileSelectionArea from "./FileSelectionArea";
import { MAX_FILE_SIZE, SUPPORTED_FORMATS } from "../../../constants";
import FileSelectButton from "../../common/UploadButton";
import { useStatus } from "../../../hooks/Status";

export interface FileHolder {
    id: string;
    file: File;
    inFormat: string;
    outFormat: string;
    isValid: boolean;

    errorMessage?: string;
}

export default function FileConverter() {
    const [fileHolders, setFileHolders] = useState<FileHolder[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    
    const { pushMessage } = useStatus();

    const setFiles = (files: File[]) => {
        const newSelectedFiles: FileHolder[] = files
            .map(file => {
                const inFormat = file.name.split('.').pop() || '';
                
                let isValid = true;
                let errorMessage = undefined;
                
                if (!SUPPORTED_FORMATS.includes(inFormat)) {
                    isValid = false;
                    errorMessage = `"${inFormat}" files are not supported`
                }
                if (file.size > MAX_FILE_SIZE) {
                    isValid = false;
                    errorMessage = `File size is over ${toHumanReadable(MAX_FILE_SIZE)}`
                }

                return {
                    id: crypto.randomUUID(),
                    file: file,
                    inFormat: inFormat,
                    isValid: isValid,
                    outFormat: '',
                    errorMessage: errorMessage,
                } satisfies FileHolder
            })
        setFileHolders([...fileHolders, ...newSelectedFiles])
    }

    const handleFileFormatChange = (fileHolderId: string, newFormat: string) => {
        setFileHolders(fileHolders.map(fh => {
            if (fh.id == fileHolderId) {
                return {...fh, outFormat: newFormat}
            } else {
                return fh
            }
        }))
    }

    const handleFileRemove = (fileHolderId: string) => {
        setFileHolders(fileHolders.filter(item => item.id !== fileHolderId))
    }

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            setFiles(Array.from(ev.target.files))
        }
    }

    const handleConvert = () => {
        if (fileHolders.filter(fh => !fh.isValid).length > 0) {
            pushMessage({
                id: crypto.randomUUID(),
                content: 'There are invalid files. Remove them first before converting.',
                level: 'error',
            });
        } else {
            setIsUploading(true);
            fileHolders.forEach(fh => {
                uploadFile(fh.file, '')
            })
        }
    }

    if (fileHolders.length > 0) {
        return (
            <div className='file-converter'>
                <FilePreparationArea
                    isUploading={isUploading}
                    fileHolders={fileHolders}
                    onFileFormatChange={handleFileFormatChange}
                    onFileRemove={handleFileRemove}
                    onFileSelect={setFiles}
                />
                <button disabled={isUploading} className="primary-button" style={{width: '100%'}} onClick={handleConvert}>
                    {isUploading ? 'Uploading...' : 'Convert'}
                </button>
                <FileSelectButton className='secondary-button' onFileChange={handleFileSelect}>Select more</FileSelectButton>
            </div>
        )
    } else if (fileHolders.length === 0) {
        return (
            <div className='file-converter'>
                <FileSelectionArea
                    onFileSelect={setFiles}
                />
            </div>
        )
    } else {
        return <div></div>
    }
}
