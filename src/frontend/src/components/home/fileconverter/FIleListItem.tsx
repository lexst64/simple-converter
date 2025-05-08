import classNames from 'classnames';
import { toHumanReadable, truncateMiddle } from '../../../utils';
import IconButton from '../../common/IconButton';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import { ConversionDetail, FileHolder } from '../../../context/FileConverterStateProvider';
import CircularLoader from '../../common/CircularLoader';
import { createDownloadLink } from '../../../services/filedownload.service';
import FormatSelect from './formatselect/FormatSelect';

interface FileListItemProps {
    fileHolder: FileHolder;
    conversionDetail?: ConversionDetail;

    style?: React.CSSProperties;
}

export default function FileListItem({ fileHolder, style }: FileListItemProps) {
    const { removeFiles, changeFilesFormat, conversionDetails } = useFileConverterState();

    const handleFileRemove = () => {
        removeFiles([fileHolder.id]);
    };

    let fileControls;

    if (fileHolder.status === 'pending' || fileHolder.status === 'failed') {
        if (fileHolder.isValid) {
            fileControls = (
                <div className="selected-file-controls">
                    <FormatSelect
                        currentFormat={fileHolder.outFormat}
                        onChange={newFormat => changeFilesFormat(fileHolder.id, newFormat)}
                        dropdownPosition="left"
                    />
                    <IconButton onClick={handleFileRemove}>delete</IconButton>
                </div>
            );
        } else {
            fileControls = (
                <div className="selected-file-controls">
                    {fileHolder.errorMessage || 'Invalid file'}
                    <IconButton onClick={handleFileRemove}>delete</IconButton>
                </div>
            );
        }
    } else if (fileHolder.status === 'converting' || fileHolder.status === 'uploading') {
        fileControls = (
            <span className="file-status">
                <p>{fileHolder.status}</p>
                <CircularLoader />
            </span>
        );
    } else {
        const conversionDetail = conversionDetails.find(cd => cd.fileHolderId === fileHolder.id);
        if (!conversionDetail) {
            fileControls = <span className="file-status">error</span>;
        } else {
            fileControls = (
                <span className="file-status">
                    <p>{fileHolder.status}</p>
                    <a
                        href={
                            conversionDetail
                                ? createDownloadLink(conversionDetail.fileConversionId)
                                : '#'
                        }
                        download
                        className="icon-button"
                    >
                        <span className="material-symbols-outlined">download</span>
                    </a>
                </span>
            );
        }
    }

    return (
        <li className={classNames('selected-file', { invalid: !fileHolder.isValid })} style={style}>
            <div className="selected-file-meta">
                <span>{truncateMiddle(fileHolder.file.name, 40)}</span>
                <span>{toHumanReadable(fileHolder.file.size)}</span>
            </div>
            {fileControls}
        </li>
    );
}
