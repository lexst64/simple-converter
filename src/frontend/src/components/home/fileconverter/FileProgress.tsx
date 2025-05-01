import { truncateMiddle } from '../../../utils';
import { FileHolder } from './FileConverter';

interface FileProgressProps {
    fileHolder: FileHolder;

    style?: React.CSSProperties;
}

export default function FileProgress({ fileHolder, style }: FileProgressProps) {
    return (
        <div className="file-progress" style={style}>
            <span>{truncateMiddle(fileHolder.file.name, 40)}</span>
            <span>{fileHolder.status}</span>
        </div>
    );
}
