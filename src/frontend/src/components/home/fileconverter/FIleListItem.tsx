import classNames from 'classnames';
import { toHumanReadable, truncateMiddle } from '../../../utils';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import { FileHolder } from '../../../context/FileConverterStateProvider';
import CircularLoader from '../../common/CircularLoader';
import { createDownloadLink } from '../../../services/filedownload.service';
import FormatSelect from './formatselect/FormatSelect';
import { MdDeleteOutline, MdOutlineDownload } from 'react-icons/md';
import IconButton from '../../common/IconButton';

interface FileListItemProps {
    fileHolder: FileHolder;
    style?: React.CSSProperties;
}

export default function FileListItem({ fileHolder, style }: FileListItemProps) {
    const { removeFiles, changeFilesFormat } = useFileConverterState();

    const handleFileRemove = () => {
        removeFiles([fileHolder.id]);
    };

    let fileControls;

    if (fileHolder.status === 'pending' || fileHolder.status === 'failed') {
        fileControls = (
            <div className="selected-file-controls">
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
            </div>
        );
    } else if (fileHolder.status === 'converting' || fileHolder.status === 'uploading') {
        fileControls = (
            <span className="file-status">
                <p>{fileHolder.status}</p>
                <CircularLoader />
            </span>
        );
    } else {
        if (!fileHolder.conversionId) {
            fileControls = <span className="file-status">error</span>;
        } else {
            fileControls = (
                <span className="file-status">
                    <p>{fileHolder.status}</p>
                    <a
                        href={
                            fileHolder.conversionId
                                ? createDownloadLink(fileHolder.conversionId)
                                : '#'
                        }
                        download
                        className="icon-button"
                        style={{ opacity: 0.7 }}
                    >
                        <MdOutlineDownload />
                    </a>
                </span>
            );
        }
    }

    return (
        <li
            className={classNames('selected-file', {
                invalid: fileHolder.errorMessage !== undefined,
            })}
            style={style}
        >
            <div className="selected-file-meta">
                <span className="selected-file-name">
                    {truncateMiddle(fileHolder.file.name, 40)}
                </span>
                <span className="selected-file-size">{toHumanReadable(fileHolder.file.size)}</span>
            </div>
            {fileControls}
        </li>
    );
}
