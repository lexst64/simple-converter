import { toHumanReadable, truncateMiddle } from '../../../utils';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import { FileHolder } from '../../../context/FileConverterStateProvider';
import CircularLoader from '../../common/CircularLoader';
import { createDownloadLink } from '../../../services/filedownload.service';
import FormatSelect from './formatselect/FormatSelect';
import { MdDeleteOutline, MdOutlineDownload } from 'react-icons/md';
import IconButton from '../../common/buttons/IconButton';
import styled, { css } from 'styled-components';
import IconLinkButton from '../../common/buttons/IconLinkButton';

const ControlsWrapper = styled.div`
    display: flex;
    gap: 5px;
    align-items: center;
`;

const FileStatus = styled.span`
    display: flex;
    align-items: center;
    gap: 5px;
`;

const Wrapper = styled.li<{ $valid: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;

    padding: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.088);

    ${props =>
        !props.$valid &&
        css`
            background: rgba(255, 51, 0, 0.2);
        `}
`;

const FileMeta = styled.div`
    display: flex;
    flex-direction: column;
`;

const FileName = styled.span`
    font-size: 1rem;
`;

const FileSize = styled.span`
    color: #777;
    font-size: 0.9rem;
`;

interface FileListItemProps {
    fileHolder: FileHolder;
}

export default function FileListItem({ fileHolder }: FileListItemProps) {
    const { removeFiles, changeFilesFormat } = useFileConverterState();

    const handleFileRemove = () => {
        removeFiles([fileHolder.id]);
    };

    let fileControls;

    if (fileHolder.status === 'pending' || fileHolder.status === 'failed') {
        fileControls = (
            <ControlsWrapper>
                {fileHolder.errorMessage === undefined ? (
                    <FormatSelect
                        currentFormat={fileHolder.outputFormat}
                        onChange={newFormat => changeFilesFormat(fileHolder.id, newFormat)}
                        dropdownPosition="left"
                    />
                ) : (
                    <span>{fileHolder.errorMessage || 'Invalid file'}</span>
                )}
                <IconButton onClick={handleFileRemove}>
                    <MdDeleteOutline />
                </IconButton>
            </ControlsWrapper>
        );
    } else if (fileHolder.status === 'converting' || fileHolder.status === 'uploading') {
        fileControls = (
            <FileStatus>
                <p>{fileHolder.status}</p>
                <CircularLoader />
            </FileStatus>
        );
    } else {
        if (!fileHolder.conversionId) {
            fileControls = <FileStatus>error</FileStatus>;
        } else {
            fileControls = (
                <FileStatus>
                    <p>{fileHolder.status}</p>
                    <IconLinkButton
                        href={
                            fileHolder.conversionId
                                ? createDownloadLink(fileHolder.conversionId)
                                : '#'
                        }
                        download
                        style={{ opacity: 0.7 }}
                    >
                        <MdOutlineDownload />
                    </IconLinkButton>
                </FileStatus>
            );
        }
    }

    return (
        <Wrapper $valid={fileHolder.errorMessage === undefined}>
            <FileMeta>
                <FileName>{truncateMiddle(fileHolder.file.name, 40)}</FileName>
                <FileSize>{toHumanReadable(fileHolder.file.size)}</FileSize>
            </FileMeta>
            {fileControls}
        </Wrapper>
    );
}
