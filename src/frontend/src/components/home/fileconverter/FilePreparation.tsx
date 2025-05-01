import { DragEvent } from 'react';
import FileDropArea from '../../common/FileDropArea';
import { FileHolder } from './FileConverter';
import SelectedFile from './SelectedFile';
import { FixedSizeList } from 'react-window';
import { SUPPORTED_FORMATS } from '../../../constants';
import Select, { Option } from '../../common/Select';
import FileSelectButton from '../../common/UploadButton';

interface FilePreparationProps {
    fileHolders: FileHolder[];

    onFileFormatChange: (fileHolderId: string | string[], newFormat: string) => void;
    onFileRemove: (fileHolderId: string) => void;
    /** File handler on drop and select. */
    onFileSelect: (files: File[]) => void;
}

export default function FilePreparation({
    fileHolders,
    onFileFormatChange,
    onFileRemove,
    onFileSelect,
}: FilePreparationProps) {
    const handleFileDrop = (ev: DragEvent) => {
        onFileSelect(Array.from(ev.dataTransfer.files));
    };

    const handleFileSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files) {
            onFileSelect(Array.from(ev.target.files));
        }
    };

    const selectOptions: Option[] = [
        { label: '---', value: '' },
        ...SUPPORTED_FORMATS.map(item => ({ label: item, value: item })),
    ];

    if (fileHolders.length > 0) {
        return (
            <div className="file-preparation-area">
                <div className="file-preparation-area-controls">
                    <Select
                        className="output-format-select"
                        options={selectOptions}
                        label={`Convert all (${fileHolders.length}) to: `}
                        value={(() => {
                            const uniqueOutFormats = [
                                ...new Set(fileHolders.map(fh => fh.outFormat)),
                            ];
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
    } else {
        return (
            <FileDropArea onDrop={handleFileDrop}>
                <div className="file-selection-area">
                    <FileSelectButton onFileChange={handleFileSelect}>
                        Select files
                    </FileSelectButton>
                    <span className="hint">or drag-and-drop here (up to 1.0 GB)</span>
                </div>
            </FileDropArea>
        );
    }
}
