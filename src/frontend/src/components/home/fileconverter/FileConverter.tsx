import { DragEvent, useMemo } from 'react';
import uploadFile from '../../../services/fileupload.service';
import { MAX_FILE_SIZE, STATUS_POLLING_INTERVAL } from '../../../constants';
import InputFileButton from '../../common/buttons/InputFileButton';
import { useStatus } from '../../../hooks/Status';
import { convertFile, checkConversionStatus } from '../../../services/fileconvert.service';
import { APIException } from '../../../services/exceptions';
import FileDropArea from '../../common/FileDropArea';
import FileList from './FileList';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import ActionButton from './ActionButton';
import { FileHolder } from '../../../context/FileConverterStateProvider';
import { toHumanReadable } from '../../../utils';
import styled from 'styled-components';
import SecondaryLinkButton from '../../common/buttons/SecondaryLinkButton';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 8px;
    overflow: hidden;

    @media (min-width: 700px) {
        width: 700px;
    }

    @media (max-width: 700px) {
        width: 100%;
    }
`;

const FileSelectionArea = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 5px;
    height: 300px;

    background-color: var(--secondary-bg-color);

    border: 2px dashed #bfdaf4;
    border-radius: 8px;
    overflow: hidden;
`;

const Hint = styled.span`
    font-size: 0.75em;
    color: rgba(0, 0, 0, 0.523), 0, 0;
`;

export default function FileConverter() {
    const { addFiles, fileHolders, updateFileStatus, setConversionId } = useFileConverterState();
    const { pushMessage } = useStatus();

    const areAllPending: boolean = useMemo(() => {
        const uniqueStates = Array.from(new Set(fileHolders.map(fh => fh.status)));
        return uniqueStates.length === 1 ? uniqueStates[0] === 'pending' : false;
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

    let content;
    if (fileHolders.length > 0) {
        content = <FileList />;
    } else {
        content = (
            <FileSelectionArea>
                <InputFileButton primary={true} onFileChange={handleFileSelect}>
                    Select files
                </InputFileButton>
                <Hint>or drag-and-drop here (up to {toHumanReadable(MAX_FILE_SIZE)})</Hint>
            </FileSelectionArea>
        );
    }

    return (
        <Wrapper>
            {areAllPending ? (
                <FileDropArea onDrop={handleFilesDrop}>{content}</FileDropArea>
            ) : (
                content
            )}

            <ActionButton onConvert={handleConvert} />
            {areAllPending && (
                <InputFileButton primary={false} onFileChange={handleFileSelect}>
                    Add more files
                </InputFileButton>
            )}
            {areAllReady && (
                <SecondaryLinkButton $small={false} href="/" target="_blank">
                    Convert more files
                </SecondaryLinkButton>
            )}
        </Wrapper>
    );
}
