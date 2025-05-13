import FileListItem from './FIleListItem';
import { useMemo } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import FormatSelect from './formatselect/FormatSelect';
import ConversionStatusBar from './ConversionStatusBar';
import styled from 'styled-components';
import { nonScrollableMixin } from '../../../mixins';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Controls = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: 0px 10px;
`;

const FileContainer = styled.div`
    ${nonScrollableMixin}

    background-color: var(--secondary-bg-color);
    border: 2px solid #bfdaf4;
    border-radius: 8px;
    overflow: hidden;
    height: 300px;
    width: 100%;
    overflow-y: auto;
`;

const FormatSelectWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

export default function FileList() {
    const { fileHolders, changeFilesFormat } = useFileConverterState();

    const currentSelectFormat = useMemo(() => {
        const uniqueFormats = [...new Set(fileHolders.map(fh => fh.outputFormat))];
        return uniqueFormats.length === 1 ? uniqueFormats[0] : undefined;
    }, [fileHolders]);

    const hasPendingFiles: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('pending');
    }, [fileHolders]);

    const hasFailedFiles: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('failed');
    }, [fileHolders]);

    let controls;
    if (hasPendingFiles) {
        controls = (
            <>
                <FormatSelectWrapper>
                    <span>{hasFailedFiles ? 'Change failed:' : 'Change all:'}</span>
                    <FormatSelect
                        currentFormat={currentSelectFormat}
                        onChange={newFormat =>
                            changeFilesFormat(
                                fileHolders
                                    .filter(fh => fh.status === 'pending' || fh.status === 'failed')
                                    .map(fh => fh.id),
                                newFormat,
                            )
                        }
                    />
                </FormatSelectWrapper>
                <ConversionStatusBar />
                <span>
                    Total: <b>{fileHolders.length}</b>
                </span>
            </>
        );
    } else {
        controls = (
            <>
                <ConversionStatusBar />
                <span>
                    Total: <b>{fileHolders.length}</b>
                </span>
            </>
        );
    }

    return (
        <Wrapper>
            <Controls>{controls}</Controls>
            <FileContainer>
                {fileHolders.map(fh => (
                    <FileListItem key={fh.id} fileHolder={fh} />
                ))}
            </FileContainer>
        </Wrapper>
    );
}
