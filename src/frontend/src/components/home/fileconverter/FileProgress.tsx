import { createDownloadLink } from '../../../services/fileconvert.service';
import { truncateMiddle } from '../../../utils';
import CircularLoader from '../../common/CircularLoader';
import { ConversionDetail, FileHolder } from './FileConverter';

interface FileProgressProps {
    fileHolder: FileHolder;

    conversionDetail?: ConversionDetail;
    style?: React.CSSProperties;
}

export default function FileProgress({ fileHolder, style, conversionDetail }: FileProgressProps) {
    let fileStatus;

    if (fileHolder.status === 'converting' || fileHolder.status === 'uploading') {
        fileStatus = (
            <span className="file-status">
                <p>{fileHolder.status}</p>
                <CircularLoader />
            </span>
        );
    } else if (fileHolder.status === 'ready') {
        fileStatus = (
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
    } else {
        fileStatus = <span>{fileHolder.status}</span>;
    }

    return (
        <div className="file-progress" style={style}>
            <span>{truncateMiddle(fileHolder.file.name, 40)}</span>
            {fileStatus}
        </div>
    );
}
