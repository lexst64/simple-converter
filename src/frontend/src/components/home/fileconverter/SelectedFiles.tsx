import { SUPPORTED_FORMATS } from '../../../constants';
import { toHumanReadable, truncateMiddle } from '../../../utils';
import IconButton from '../../common/IconButton';
import Select, { Option } from '../../common/Select';
import { FileHolder } from './FileConverter';

interface SelectedFileProps {
    fileHolder: FileHolder;

    style?: React.CSSProperties;

    onFileFormatChange: (newFormat: string) => void;
    onFileRemove: () => void;
}

export default function SelectedFile({
    style,
    fileHolder,
    onFileFormatChange,
    onFileRemove,
}: SelectedFileProps) {
    const selectOptions: Option[] = [
        { label: '---', value: '' },
        ...SUPPORTED_FORMATS.map(item => ({ label: item, value: item })),
    ];

    const selectedFilesControls = (
        <div className="selected-file-controls">
            <Select
                className="output-format-select"
                label="Output: "
                options={selectOptions}
                value={fileHolder.outFormat}
                onChange={ev => onFileFormatChange(ev.currentTarget.value)}
            />
            <IconButton onClick={onFileRemove}>delete</IconButton>
        </div>
    );

    if (fileHolder.isValid) {
        return (
            <li className="selected-file" style={style}>
                <div className="selected-file-meta">
                    <span>{truncateMiddle(fileHolder.file.name, 40)}</span>
                    <span>{toHumanReadable(fileHolder.file.size)}</span>
                </div>
                {fileHolder.status === 'pending' ? selectedFilesControls : fileHolder.status}
            </li>
        );
    } else {
        return (
            <li className="selected-file invalid" style={style}>
                <div className="selected-file-meta">
                    <span>{truncateMiddle(fileHolder.file.name, 40)}</span>
                    <span>{toHumanReadable(fileHolder.file.size)}</span>
                </div>
                <div className="selected-file-controls">
                    {fileHolder.errorMessage || 'Invalid file'}
                    <IconButton onClick={onFileRemove}>delete</IconButton>
                </div>
            </li>
        );
    }
}
