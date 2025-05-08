import { useMemo } from 'react';
import { FileStatus } from '../../../context/FileConverterStateProvider';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import classNames from 'classnames';

export default function ConversionStatusBar() {
    const { fileHolders } = useFileConverterState();

    const counts: Map<FileStatus, number> = useMemo(() => {
        const counts = new Map();
        fileHolders.forEach(fh => {
            const value = counts.get(fh.status);
            counts.set(fh.status, value ? value + 1 : 1);
        });
        return counts;
    }, [fileHolders]);

    return (
        <div className="file-preparation-status">
            {Array.from(counts).map(([status, count]) => (
                // status is unique and consistent, we can use it as a key
                <div key={status} className={classNames('file-preparation-count', status)}>
                    <span>
                        {status.charAt(0).toUpperCase()}
                        {count}
                    </span>
                </div>
            ))}
        </div>
    );
}
