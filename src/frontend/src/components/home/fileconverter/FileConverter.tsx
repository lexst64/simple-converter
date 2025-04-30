import { useState } from 'react';
import { toHumanReadable } from '../../../utils';
import uploadFile from '../../../services/fileupload.service';
import FilePreparationArea from './FilePreparationArea';
import FileSelectionArea from './FileSelectionArea';
import { MAX_FILE_SIZE, STATUS_POLLING_INTERVAL, SUPPORTED_FORMATS } from '../../../constants';
import FileSelectButton from '../../common/UploadButton';
import { useStatus } from '../../../hooks/Status';
import { convertFile, checkConversionStatus } from '../../../services/fileconvert.service';
import { APIException } from '../../../services/exceptions';

/**
 * Represents the status of the user selected files.
 * - 'pending': File is ready to be uploaded.
 * - 'uploading': File is being uploaded to the server.
 * - 'converting': File is being converted on the server.
 * - 'ready': File has been converted and ready to be downloaded from the server.
 * - 'failed': An error occured.
 */
type FileStatus = 'pending' | 'uploading' | 'converting' | 'ready' | 'failed';

export interface FileHolder {
    id: string;
    file: File;
    inFormat: string;
    outFormat: string;
    isValid: boolean;
    status: FileStatus;

    errorMessage?: string;
}

export default function FileConverter() {
    const [fileHolders, setFileHolders] = useState<FileHolder[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const { pushMessage } = useStatus();

    const updateFileStatus = (id: string, status: FileStatus) => {
        const fh = fileHolders.find(item => item.id === id);

        if (!fh) {
            throw new Error(`file holder with id ${id} not found`);
        }

        setFileHolders(fileHolders => [
            ...fileHolders.filter(item => item.id !== id),
            { ...fh, status },
        ]);
    };

    const setFiles = (files: File[]) => {
        const newSelectedFiles: FileHolder[] = files.map(file => {
            const inFormat = file.name.split('.').pop() || '';

            let isValid = true;
            let errorMessage = undefined;

            if (!SUPPORTED_FORMATS.includes(inFormat)) {
                isValid = false;
                errorMessage = `"${inFormat}" files are not supported`;
            }
            if (file.size > MAX_FILE_SIZE) {
                isValid = false;
                errorMessage = `File size is over ${toHumanReadable(MAX_FILE_SIZE)}`;
            }

            return {
                id: crypto.randomUUID(),
                file: file,
                inFormat: inFormat,
                isValid: isValid,
                outFormat: '',
                status: 'pending',
                errorMessage: errorMessage,
            } satisfies FileHolder;
        });
        setFileHolders([...fileHolders, ...newSelectedFiles]);
    };

    const handleFileFormatChange = (fileHolderId: string | string[], newFormat: string): void => {
        setFileHolders(fileHolders => {
            if (fileHolderId instanceof Array) {
                return fileHolders.map(fh => {
                    if (fileHolderId.includes(fh.id)) {
                        return { ...fh, outFormat: newFormat };
                    } else {
                        return fh;
                    }
                });
            } else {
                return fileHolders.map(fh => {
                    if (fh.id == fileHolderId) {
                        return { ...fh, outFormat: newFormat };
                    } else {
                        return fh;
                    }
                });
            }
        });
    };

    const handleFileRemove = (fileHolderId: string) => {
        setFileHolders(fileHolders.filter(item => item.id !== fileHolderId));
    };

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            setFiles(Array.from(ev.target.files));
        }
    };

    const handleConvert = () => {
        if (fileHolders.find(fh => !fh.isValid)) {
            pushMessage('There are invalid files. Remove them first before converting.', 'error');
            return;
        }
        if (fileHolders.find(fh => fh.outFormat === '')) {
            pushMessage(
                'Please select an output format for all the files to proceed with conversion.',
                'error',
            );
            return;
        }

        setIsUploading(true);
        fileHolders.forEach(async fh => {
            let fileConversionId;
            try {
                updateFileStatus(fh.id, 'uploading');
                const fileUploadId = await uploadFile(fh.file, fh.outFormat);
                updateFileStatus(fh.id, 'converting');
                fileConversionId = await convertFile(fileUploadId);
            } catch (err) {
                pushMessage(
                    `Failed uploading ${fh.file.name}. Reason: ${(err as APIException).message}`,
                    'error',
                );
                updateFileStatus(fh.id, 'failed');
                return;
            }

            const intervalId = setInterval(async () => {
                let status;
                try {
                    status = await checkConversionStatus(fileConversionId);
                } catch (err) {
                    pushMessage(
                        `Failed uploading ${fh.file.name}. Reason: ${(err as APIException).message}`,
                        'error',
                    );
                    updateFileStatus(fh.id, 'failed');
                    clearInterval(intervalId);
                    return;
                }

                switch (status) {
                    case 'converting':
                        break;
                    case 'failed':
                        pushMessage(`Failed converting ${fh.file.name}.`, 'error');
                        updateFileStatus(fh.id, 'failed');
                        clearInterval(intervalId);
                        break;
                    case 'ready':
                        updateFileStatus(fh.id, 'ready');
                        clearInterval(intervalId);
                        break;
                }
            }, STATUS_POLLING_INTERVAL);
        });
    };

    if (fileHolders.length > 0) {
        return (
            <div className="file-converter">
                <FilePreparationArea
                    fileHolders={fileHolders}
                    onFileFormatChange={handleFileFormatChange}
                    onFileRemove={handleFileRemove}
                    onFileSelect={setFiles}
                />
                <button
                    disabled={isUploading}
                    className="primary-button"
                    style={{ width: '100%' }}
                    onClick={handleConvert}
                >
                    {isUploading ? 'Converting...' : 'Convert'}
                </button>
                {!isUploading && (
                    <FileSelectButton className="secondary-button" onFileChange={handleFileSelect}>
                        Select more
                    </FileSelectButton>
                )}
            </div>
        );
    } else {
        return (
            <div className="file-converter">
                <FileSelectionArea onFileSelect={setFiles} />
            </div>
        );
    }
}
