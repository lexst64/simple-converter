import FileDropArea from '../../common/FileDropArea';
import FileListItem from './FIleListItem';
import { DragEvent, useMemo } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import FormatSelect from './formatselect/FormatSelect';
import ConversionStatusBar from './ConversionStatusBar';

export default function FileList() {
    const { fileHolders, conversionDetails, changeFilesFormat, addFiles } = useFileConverterState();

    const isPending: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('pending');
    }, [fileHolders]);

    const currentSelectFormat = useMemo(() => {
        const uniqueFormats = [...new Set(fileHolders.map(fh => fh.outFormat))];
        return uniqueFormats.length === 1 ? uniqueFormats[0] : undefined;
    }, [fileHolders]);

    const handleFileDrop = (ev: DragEvent) => {
        addFiles(Array.from(ev.dataTransfer.files));
    };

    const listControls = (
        <div className="file-preparation-area-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Change all:</span>
                <FormatSelect
                    currentFormat={currentSelectFormat}
                    onChange={newFormat =>
                        changeFilesFormat(
                            // filter out those that are "ready"
                            fileHolders.filter(fh => fh.status !== 'ready').map(fh => fh.id),
                            newFormat,
                        )
                    }
                />
            </div>
            <ConversionStatusBar />
            <span>
                Total: <b>{fileHolders.length}</b>
            </span>
        </div>
    );

    const selectedFilesContainer = (
        <div className="selected-files-container">
            <div
                className="no-scrollbar"
                style={{ height: '300px', width: '100%', overflowY: 'auto' }}
            >
                {fileHolders.map(fh => (
                    <FileListItem
                        key={fh.id}
                        fileHolder={fh}
                        conversionDetail={conversionDetails.find(cd => cd.fileHolderId === fh.id)}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="file-preparation-area">
            {listControls}
            {isPending ? (
                <FileDropArea onDrop={handleFileDrop}>{selectedFilesContainer}</FileDropArea>
            ) : (
                selectedFilesContainer
            )}
        </div>
    );
}
