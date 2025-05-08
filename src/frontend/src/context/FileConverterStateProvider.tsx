import { createContext, useCallback, useMemo, useState } from 'react';
import { AUDIO_FORMATS, MAX_FILE_SIZE, VIDEO_FORMATS } from '../constants';
import { toHumanReadable } from '../utils';

/**
 * Represents the status of the user selected files.
 * - 'pending': File is ready to be uploaded.
 * - 'uploading': File is being uploaded to the server.
 * - 'converting': File is being converted on the server.
 * - 'ready': File has been converted and ready to be downloaded from the server.
 * - 'failed': An error occured.
 */
export type FileStatus = 'pending' | 'uploading' | 'converting' | 'ready' | 'failed';

export interface FileHolder {
    id: string;
    file: File;
    inFormat: string;
    outFormat: string;
    isValid: boolean;
    status: FileStatus;

    errorMessage?: string;
}

export interface ConversionDetail {
    fileHolderId: string;
    fileConversionId: string;
}

export interface FileConverterStateContextType {
    fileHolders: FileHolder[];
    conversionDetails: ConversionDetail[];

    addFiles: (file: File[]) => void;
    changeFilesFormat: (fileHolderId: string | string[], newFormat: string) => void;
    removeFiles: (fileHolderIds: string[]) => void;
    updateFileStatus: (id: string, status: FileStatus) => void;
    addConversionDetail: (fileHolderId: string, fileConversionId: string) => void;
}

export const FileConverterStateContext = createContext<FileConverterStateContextType | undefined>(
    undefined,
);

export default function FileConverterStateProvider({ children }: React.PropsWithChildren) {
    const [fileHolders, setFileHolders] = useState<FileHolder[]>([]);
    const [conversionDetails, setConversionDetails] = useState<ConversionDetail[]>([]);

    const addFiles = useCallback(
        (files: File[]) => {
            const newSelectedFiles: FileHolder[] = files.map(file => {
                const inFormat = file.name.split('.').pop() || '';

                let isValid = true;
                let errorMessage = undefined;

                if (!VIDEO_FORMATS.includes(inFormat) && !AUDIO_FORMATS.includes(inFormat)) {
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
        },
        [fileHolders],
    );

    const changeFilesFormat = useCallback(
        (fileHolderId: string | string[], newFormat: string): void => {
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
        },
        [],
    );

    const removeFiles = useCallback(
        (fileHolderIds: string[]) => {
            setFileHolders(fileHolders.filter(fh => !fileHolderIds.find(id => id === fh.id)));
        },
        [fileHolders],
    );

    const updateFileStatus = useCallback((id: string, status: FileStatus) => {
        setFileHolders(fileHolders =>
            fileHolders.map(fh => (fh.id === id ? { ...fh, status } : fh)),
        );
    }, []);

    const addConversionDetail = useCallback((fileHolderId: string, fileConversionId: string) => {
        setConversionDetails(conversionDetails => [
            ...conversionDetails,
            { fileHolderId, fileConversionId },
        ]);
    }, []);

    const contextValue = useMemo(
        () => ({
            fileHolders,
            conversionDetails,
            addFiles,
            changeFilesFormat,
            removeFiles,
            updateFileStatus,
            addConversionDetail,
        }),
        [
            fileHolders,
            conversionDetails,
            addFiles,
            changeFilesFormat,
            removeFiles,
            updateFileStatus,
            addConversionDetail,
        ],
    );
    return (
        <FileConverterStateContext.Provider value={contextValue}>
            {children}
        </FileConverterStateContext.Provider>
    );
}
