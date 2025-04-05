import { toHumanReadable, truncateMiddle } from '../../../utils';
import IconButton from '../../common/IconButton';

interface SelectedFileProps {
    fileName: string;
    fileSize: number;
    /** List of supported output formats for the file. */
    outFormats: string[];
    isValid: boolean;
    isUploading: boolean;

    errorMessage?: string;

    onFileFormatChange: (newFormat: string) => void;
    onFileRemove: () => void;
}

export default function SelectedFile({
    fileName,
    fileSize,
    onFileFormatChange,
    outFormats,
    isValid,
    isUploading,
    errorMessage,
    onFileRemove: onRemove,
}: SelectedFileProps) {
    const selectedFilesControls = (
        <div className="selected-file-controls">
            <label>
                <span>Output: </span>
                <select
                    className="selected-file-extension-select"
                    // value={selectedFormat}
                    onChange={ev => onFileFormatChange(ev.target.value)}
                >
                    {/* default empty option */}
                    <option value="">---</option>
                    {/* supported formats */}
                    {outFormats.map((item, i) => (
                        <option key={i} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </label>
            <IconButton onClick={onRemove}>delete</IconButton>
        </div>
    );

    if (isValid) {
        return (
            <div className="selected-file">
                <div className="selected-file-meta">
                    <span>{truncateMiddle(fileName, 40)}</span>
                    <span>{toHumanReadable(fileSize)}</span>
                </div>
                {!isUploading && selectedFilesControls}
            </div>
        );
    } else {
        return (
            <div className="selected-file invalid">
                <div className="selected-file-meta">
                    <span>{truncateMiddle(fileName, 40)}</span>
                    <span>{toHumanReadable(fileSize)}</span>
                </div>
                <div className="selected-file-controls">
                    {errorMessage || 'Invalid file'}
                    <IconButton onClick={onRemove}>delete</IconButton>
                </div>
            </div>
        );
    }
}
