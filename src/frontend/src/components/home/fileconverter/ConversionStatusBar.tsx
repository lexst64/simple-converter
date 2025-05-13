import { useMemo } from 'react';
import { FileStatus } from '../../../context/FileConverterStateProvider';
import { useFileConverterState } from '../../../hooks/FileConverterState';
import styled, { css } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

const countWrapperMixins = {
    pending: css`
        background-color: #85bef3;
    `,
    uploading: css`
        background-color: #ffce65;
    `,
    converting: css`
        background-color: #b64cd9;
    `,
    ready: css`
        background-color: #4fa936;
    `,
    failed: css`
        background-color: #cb5252;
    `,
};

const CountWrapper = styled.div<{ $status: FileStatus }>`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: default;
    color: #fff;
    border-radius: 5px;
    width: 25px;
    height: 25px;
    line-height: 1;
    font-weight: 500;

    ${props => props.$status in countWrapperMixins && countWrapperMixins[props.$status]}
`;

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
        <Wrapper>
            {Array.from(counts).map(([status, count]) => (
                // status is unique and consistent, we can use it as a key
                <CountWrapper $status={status} key={status}>
                    <span>
                        {status.charAt(0).toUpperCase()}
                        {count}
                    </span>
                </CountWrapper>
            ))}
        </Wrapper>
    );
}
