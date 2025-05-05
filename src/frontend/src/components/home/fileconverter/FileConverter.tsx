import { DragEvent } from 'react';
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
    const { addFiles, fileHolders, updateFileStatus, addConversionDetail } =
        useFileConverterState();
    const { pushMessage } = useStatus();

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            addFiles(Array.from(ev.target.files));
        }
    };

    const handleConvert = (fileHolders: FileHolder[]) => {
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
                        addConversionDetail(fh.id, fileConversionId);
                        clearInterval(intervalId);
                        break;
                }
            }, STATUS_POLLING_INTERVAL);
        });
    };

    const handleFileDrop = (ev: DragEvent) => {
        if (ev.dataTransfer) {
            addFiles(Array.from(ev.dataTransfer.files));
        }
    };

    return (
        <div className="file-converter">
            {fileHolders.length > 0 ? (
                <FileList />
            ) : (
                <FileDropArea onDrop={handleFileDrop}>
                    <div className="file-selection-area">
                        <FileSelectButton onFileChange={handleFileSelect}>
                            Select files
                        </FileSelectButton>
                        <span className="hint">or drag-and-drop here (up to 1.0 GB)</span>
                    </div>
                </FileDropArea>
            )}
            <ActionButton onConvert={handleConvert} />
        </div>
    );
}
