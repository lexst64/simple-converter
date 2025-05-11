import { useEffect, useRef, useState } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import {
    checkPreparationStatus,
    createPreparedFilesDownloadLink,
    prepareFiles,
} from '../../../services/filedownload.service';
import { STATUS_POLLING_INTERVAL } from '../../../constants';

export default function DownloadAllButton() {
    const state = useFileConverterState();
    const [textContent, setTextContent] = useState<string>('Download all');
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const [downloadLink, setDownloadLink] = useState<string | undefined>(undefined);

    const linkButtonRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (!downloadLink || !linkButtonRef.current) {
            return;
        }
        linkButtonRef.current.click();
    }, [downloadLink]);

    const handleClick = async () => {
        const filePreparationId = await prepareFiles(
            state.fileHolders
                .map(fh => fh.conversionId)
                .filter(conversionId => conversionId !== undefined),
        );

        setIsDisabled(true);
        setTextContent('Preparing files...');

        const intervalId = setInterval(async () => {
            const status = await checkPreparationStatus(filePreparationId);
            switch (status) {
                case 'preparing':
                    break;
                case 'failed':
                    clearInterval(intervalId);
                    setTextContent('Failed! Click to try again');
                    setIsDisabled(false);
                    break;
                case 'ready':
                    clearInterval(intervalId);
                    setTextContent('Download all');
                    setIsDisabled(false);
                    setDownloadLink(createPreparedFilesDownloadLink(filePreparationId));
                    break;
            }
        }, STATUS_POLLING_INTERVAL);
    };

    return (
        <>
            {downloadLink ? (
                <a ref={linkButtonRef} className="primary-button" href={downloadLink} download>
                    <span>{textContent}</span>
                </a>
            ) : (
                <button className="primary-button" disabled={isDisabled} onClick={handleClick}>
                    {textContent}
                </button>
            )}
        </>
    );
}
