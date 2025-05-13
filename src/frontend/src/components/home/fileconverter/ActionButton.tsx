import { FileHolder } from '../../../context/FileConverterStateProvider';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import PrimaryButton from '../../common/buttons/PrimaryButton';
import DownloadAllButton from './DownloadAllButton';

interface ActionButtonProps {
    onConvert: (fileHolders: FileHolder[]) => void;
}

export default function ActionButton({ onConvert }: ActionButtonProps) {
    const state = useFileConverterState();

    const uniqueStates = new Set(state.fileHolders.map(fh => fh.status));

    if (uniqueStates.has('converting') || uniqueStates.has('uploading')) {
        return <PrimaryButton disabled>Converting...</PrimaryButton>;
    } else if (uniqueStates.has('failed')) {
        return (
            <PrimaryButton
                onClick={() => onConvert(state.fileHolders.filter(fh => fh.status === 'failed'))}
            >
                Retry failed files
            </PrimaryButton>
        );
    } else if (uniqueStates.size === 1 && uniqueStates.has('pending')) {
        return <PrimaryButton onClick={() => onConvert(state.fileHolders)}>Convert</PrimaryButton>;
    } else if (uniqueStates.size === 1 && uniqueStates.has('ready')) {
        return <DownloadAllButton />;
    } else {
        return <></>;
    }
}
