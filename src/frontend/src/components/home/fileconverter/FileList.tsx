import FileListItem from './FIleListItem';
import { useMemo } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import FormatSelect from './formatselect/FormatSelect';
import ConversionStatusBar from './ConversionStatusBar';

export default function FileList() {
    const { fileHolders, changeFilesFormat } = useFileConverterState();

    const currentSelectFormat = useMemo(() => {
        const uniqueFormats = [...new Set(fileHolders.map(fh => fh.outputFormat))];
        return uniqueFormats.length === 1 ? uniqueFormats[0] : undefined;
    }, [fileHolders]);

    const hasPendingFiles: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('pending');
    }, [fileHolders]);

    const hasFailedFiles: boolean = useMemo(() => {
        return fileHolders.map(fh => fh.status).includes('failed');
    }, [fileHolders]);

    let controls;
    if (hasPendingFiles) {
        controls = (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{hasFailedFiles ? 'Change failed:' : 'Change all:'}</span>
                    <FormatSelect
                        currentFormat={currentSelectFormat}
                        onChange={newFormat =>
                            changeFilesFormat(
                                fileHolders
                                    .filter(fh => fh.status === 'pending' || fh.status === 'failed')
                                    .map(fh => fh.id),
                                newFormat,
                            )
                        }
                    />
                </div>
                <ConversionStatusBar />
                <span>
                    Total: <b>{fileHolders.length}</b>
                </span>
            </>
        );
    } else {
        controls = (
            <>
                <ConversionStatusBar />
                <span>
                    Total: <b>{fileHolders.length}</b>
                </span>
            </>
        );
    }

    return (
        <div className="file-preparation-area">
            <div className="file-preparation-area-controls">{controls}</div>
            <div className="selected-files-container">
                <div
                    className="no-scrollbar"
                    style={{ height: '300px', width: '100%', overflowY: 'auto' }}
                >
                    {fileHolders.map(fh => (
                        <FileListItem key={fh.id} fileHolder={fh} />
                    ))}
                </div>
            </div>
        </div>
    );
}
