import { DragEvent, useMemo } from 'react';
import uploadFile from '../../../services/fileupload.service';
import { STATUS_POLLING_INTERVAL } from '../../../constants';
import FileSelectButton from '../../common/UploadButton';
import { useStatus } from '../../../hooks/Status';
import { convertFile, checkConversionStatus } from '../../../services/fileconvert.service';
import { APIException } from '../../../services/exceptions';
import FileDropArea from '../../common/FileDropArea';
import FileList from './FileList';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import ActionButton from './ActionButton';
import { FileHolder } from '../../../context/FileConverterStateProvider';

export default function FileConverter() {
    const { addFiles, fileHolders, updateFileStatus, setConversionId } = useFileConverterState();
    const { pushMessage } = useStatus();

    const isPending: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('pending');
    }, [fileHolders]);

    const areAllReady: boolean = useMemo(() => {
        const uniqueStates = Array.from(new Set(fileHolders.map(fh => fh.status)));
        return uniqueStates.length === 1 ? uniqueStates[0] === 'ready' : false;
    }, [fileHolders]);

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            addFiles(Array.from(ev.target.files));
        }
    };

    const handleConvert = (fileHolders: FileHolder[]) => {
        if (fileHolders.find(fh => fh.errorMessage !== undefined)) {
            pushMessage('There are invalid files. Review them first before converting.', 'error');
            return;
        }
        if (fileHolders.find(fh => fh.outputFormat === '')) {
            pushMessage(
                'Please select an output format for all the files to proceed with conversion.',
                'error',
            );
            return;
        }

        fileHolders.forEach(async fh => {
            let fileConversionId;
            try {
                updateFileStatus(fh.id, 'uploading');
                const fileUploadId = await uploadFile(fh.file, fh.outputFormat);
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
                    console.log(status, err);

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
                        setConversionId(fh.id, fileConversionId);
                        clearInterval(intervalId);
                        break;
                }
            }, STATUS_POLLING_INTERVAL);
        });
    };

    const handleFilesDrop = (ev: DragEvent) => {
        const possibleDirs = Array.from(ev.dataTransfer.items)
            .map(item => item.webkitGetAsEntry())
            .filter(entry => entry && entry.isDirectory);
        const possibleDirsNames = possibleDirs.map(entry => entry && entry.name);

        // add only files, possible empty array
        addFiles(
            Array.from(ev.dataTransfer.files).filter(
                file => !possibleDirsNames.includes(file.name),
            ),
        );

        if (possibleDirs.length > 0) {
            pushMessage(
                `Directories are not supported: ${possibleDirsNames.map(dirName => `"${dirName}"`).join(', ')} ${possibleDirsNames.length > 1 ? 'were' : 'was'} not added`,
                'error',
            );
        }
    };

    return (
        <div className="file-converter">
            <FileDropArea onDrop={handleFilesDrop}>
                {fileHolders.length > 0 ? (
                    <FileList />
                ) : (
                    <div className="file-selection-area">
                        <FileSelectButton onFileChange={handleFileSelect}>
                            Select files
                        </FileSelectButton>
                        <span className="hint">or drag-and-drop here (up to 1.0 GB)</span>
                    </div>
                )}
            </FileDropArea>
            <ActionButton onConvert={handleConvert} />
            {isPending && (
                <FileSelectButton className="secondary-button" onFileChange={handleFileSelect}>
                    Add more files
                </FileSelectButton>
            )}
            {areAllReady && (
                <a className="secondary-button" href="/" target="_blank">
                    Convert more files
                </a>
            )}
        </div>
    );
}
