import { useMemo, useRef, useState } from 'react';
import { FormatData } from './FormatSelect';
import FormatList from './FormatList';
import SearchBar from '../../../common/SearchBar';
import useClickOutside from '../../../../hooks/ClickOutside';
import useEscapeKey from '../../../../hooks/EscapeKey';
import styled, { css } from 'styled-components';

const Wrapper = styled.div<{ $position: 'left' | 'right' }>`
    display: flex;
    flex-direction: column;
    padding: 10px;

    position: absolute;
    top: calc(100% + 5px);
    z-index: 100;

    width: 370px;
    min-height: 250px;
    max-height: 300px;
    border-radius: 10px;
    background-color: var(--primary-bg-color);
    overflow: hidden;

    box-shadow: 0 0 15px rgba(84, 84, 84, 0.211);

    ${props =>
        props.$position === 'left'
            ? css`
                  right: 0;
              `
            : css`
                  left: 0;
              `};
`;

interface DropdownProps {
    formatData: FormatData[];
    position: 'left' | 'right';
    currentFormat?: string;

    onChange: (newFormat: string) => void;
    onClose: () => void;
}

export default function Dropdown({
    formatData,
    currentFormat,
    onChange,
    position,
    onClose,
}: DropdownProps) {
    const [searchValue, setSearchValue] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, onClose);
    useEscapeKey(onClose);

    const filteredFormats: string[] = useMemo(
        () =>
            formatData
                .reduce<string[]>((acc, data) => [...acc, ...data.formats], [])
                .filter(format => format.includes(searchValue.trim())),
        [formatData, searchValue],
    );

    const handleKeyUp = (ev: React.KeyboardEvent) => {
        if (ev.key !== 'Enter' || searchValue.trim().length === 0) {
            return;
        }
        if (filteredFormats.length !== 1) {
            return;
        }
        onChange(filteredFormats[0]);
    };

    return (
        <Wrapper $position={position} ref={dropdownRef}>
            <SearchBar
                autoFocus
                placeholder="Search"
                value={searchValue}
                onChange={ev => setSearchValue(ev.target.value)}
                onKeyUp={handleKeyUp}
            />
            <FormatList
                currentFormat={currentFormat}
                formatData={searchValue.trim().length === 0 ? formatData : filteredFormats}
                onChange={onChange}
            />
        </Wrapper>
    );
}
