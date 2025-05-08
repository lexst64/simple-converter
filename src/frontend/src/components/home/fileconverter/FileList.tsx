import FileDropArea from '../../common/FileDropArea';
import FileListItem from './FIleListItem';
import { DragEvent, useMemo } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import FormatSelect from './formatselect/FormatSelect';

export default function FileList() {
    const { fileHolders, conversionDetails, changeFilesFormat, addFiles } = useFileConverterState();

    const handleFileDrop = (ev: DragEvent) => {
        addFiles(Array.from(ev.dataTransfer.files));
    };

    const currentSelectFormat = useMemo(() => {
        const uniqueFormats = [...new Set(fileHolders.map(fh => fh.outFormat))];
        return uniqueFormats.length === 1 ? uniqueFormats[0] : undefined;
    }, [fileHolders]);

    const listControls = (
        <div className="file-preparation-area-controls">
            <FormatSelect
                currentFormat={currentSelectFormat}
                onChange={newFormat =>
                    changeFilesFormat(
                        fileHolders.map(fh => fh.id),
                        newFormat,
                    )
                }
            />
        </div>
    );

    return (
        <div className="file-preparation-area">
            {listControls}
            <FileDropArea onDrop={handleFileDrop}>
                <div className="selected-files-container">
                    <div
                        className="no-scrollbar"
                        style={{ height: '300px', width: '100%', overflowY: 'auto' }}
                    >
                        {fileHolders.map(fh => (
                            <FileListItem
                                fileHolder={fh}
                                conversionDetail={conversionDetails.find(
                                    cd => cd.fileHolderId === fh.id,
                                )}
                            />
                        ))}
                    </div>
                </div>
            </FileDropArea>
        </div>
    );
}
