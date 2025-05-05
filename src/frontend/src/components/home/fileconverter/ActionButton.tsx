import { FileHolder } from '../../../context/FileConverterStateProvider';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import DownloadAllButton from './DownloadAllButton';

interface ActionButtonProps {
    onConvert: (fileHolders: FileHolder[]) => void;
}

export default function ActionButton({ onConvert }: ActionButtonProps) {
    const state = useFileConverterState();

    const uniqueStates = new Set(state.fileHolders.map(fh => fh.status));

    if (uniqueStates.has('converting') || uniqueStates.has('uploading')) {
        return (
            <button className="primary-button" disabled>
                Converting...
            </button>
        );
    } else if (uniqueStates.has('failed')) {
        return (
            <button
                className="primary-button"
                onClick={() => onConvert(state.fileHolders.filter(fh => fh.status === 'failed'))}
            >
                Retry failed files
            </button>
        );
    } else if (uniqueStates.size === 1 && uniqueStates.has('pending')) {
        return (
            <button className="primary-button" onClick={() => onConvert(state.fileHolders)}>
                Convert
            </button>
        );
    } else if (uniqueStates.size === 1 && uniqueStates.has('ready')) {
        return <DownloadAllButton />;
    } else {
        return <></>;
    }
}
