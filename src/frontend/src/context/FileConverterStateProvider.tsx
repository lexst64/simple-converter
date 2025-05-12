import { createContext, useCallback, useMemo, useState } from 'react';
import { AUDIO_FORMATS, MAX_FILE_SIZE, VIDEO_FORMATS } from '../constants';
import { getFileExtension, toHumanReadable } from '../utils';

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
    inputFormat: string;
    outputFormat: string;
    status: FileStatus;

    conversionId?: string;
    errorMessage?: string;
}

export interface FileConverterStateContextType {
    fileHolders: FileHolder[];

    addFiles: (file: File[]) => void;
    changeFilesFormat: (fileHolderId: string | string[], newFormat: string) => void;
    removeFiles: (fileHolderIds: string[]) => void;
    updateFileStatus: (id: string, status: FileStatus) => void;
    setConversionId: (fileHolderId: string, fileConversionId: string) => void;
}

export const FileConverterStateContext = createContext<FileConverterStateContextType | undefined>(
    undefined,
);

export default function FileConverterStateProvider({ children }: React.PropsWithChildren) {
    const [fileHolders, setFileHolders] = useState<FileHolder[]>([]);

    const addFiles = useCallback(
        (files: File[]) => {
            const newSelectedFiles: FileHolder[] = files.map(file => {
                const inFormat = getFileExtension(file.name);

                let errorMessage = undefined;

                if (!VIDEO_FORMATS.includes(inFormat) && !AUDIO_FORMATS.includes(inFormat)) {
                    errorMessage = `"${inFormat}" files are not supported`;
                } else if (file.size > MAX_FILE_SIZE) {
                    errorMessage = `File size is over ${toHumanReadable(MAX_FILE_SIZE)}`;
                } else if (file.size === 0) {
                    errorMessage = `File cannot be empty`;
                }

                return {
                    id: crypto.randomUUID(),
                    file: file,
                    inputFormat: inFormat,
                    outputFormat: '',
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
                            return { ...fh, outputFormat: newFormat };
                        } else {
                            return fh;
                        }
                    });
                } else {
                    return fileHolders.map(fh => {
                        if (fh.id == fileHolderId) {
                            return { ...fh, outputFormat: newFormat };
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

    const setConversionId = useCallback((fileHolderId: string, conversionId: string) => {
        setFileHolders(fileHolders =>
            fileHolders.map(fh => {
                if (fh.id === fileHolderId) {
                    return { ...fh, conversionId };
                }
                return fh;
            }),
        );
    }, []);

    const contextValue = useMemo(
        () => ({
            fileHolders,
            addFiles,
            changeFilesFormat,
            removeFiles,
            updateFileStatus,
            setConversionId,
        }),
        [fileHolders, addFiles, changeFilesFormat, removeFiles, updateFileStatus, setConversionId],
    );
    return (
        <FileConverterStateContext.Provider value={contextValue}>
            {children}
        </FileConverterStateContext.Provider>
    );
}
