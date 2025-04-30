import { DragEvent } from 'react';
import FileDropArea from '../../common/FileDropArea';
import { FileHolder } from './FileConverter';
import SelectedFile from './SelectedFiles';
import { FixedSizeList } from 'react-window';
import { SUPPORTED_FORMATS } from '../../../constants';
import Select, { Option } from '../../common/Select';

interface FilePreparationAreaProps {
    fileHolders: FileHolder[];

    onFileFormatChange: (fileHolderId: string | string[], newFormat: string) => void;
    onFileRemove: (fileHolderId: string) => void;
    /** File handler on drop and select. */
    onFileSelect: (files: File[]) => void;
}

export default function FilePreparationArea({
    fileHolders,
    onFileFormatChange,
    onFileRemove,
    onFileSelect,
}: FilePreparationAreaProps) {
    const handleFileDrop = (ev: DragEvent) => {
        onFileSelect(Array.from(ev.dataTransfer.files));
    };

    const selectOptions: Option[] = [
        { label: '---', value: '' },
        ...SUPPORTED_FORMATS.map(item => ({ label: item, value: item })),
    ];

    return (
        <div className="file-preparation-area">
            <div className="file-preparation-area-controls">
                <Select
                    className="output-format-select"
                    options={selectOptions}
                    label={`Convert all (${fileHolders.length}) to: `}
                    value={(() => {
                        const uniqueOutFormats = [...new Set(fileHolders.map(fh => fh.outFormat))];
                        return uniqueOutFormats.length === 1 ? uniqueOutFormats[0] : '';
                    })()}
                    onChange={ev =>
                        onFileFormatChange(
                            fileHolders.map(fh => fh.id),
                            ev.currentTarget.value,
                        )
                    }
                />
            </div>
            <FileDropArea onDrop={handleFileDrop}>
                <div className="selected-files-container">
                    <FixedSizeList
                        className="no-scrollbar"
                        height={300}
                        width={'100%'}
                        itemCount={fileHolders.length}
                        itemSize={60}
                        itemKey={index => fileHolders[index].id}
                    >
                        {({ index, style }) => (
                            <SelectedFile
                                style={style}
                                fileHolder={fileHolders[index]}
                                onFileRemove={() => onFileRemove(fileHolders[index].id)}
                                onFileFormatChange={newFormat =>
                                    onFileFormatChange(fileHolders[index].id, newFormat)
                                }
                            />
                        )}
                    </FixedSizeList>
                </div>
            </FileDropArea>
        </div>
    );
}
