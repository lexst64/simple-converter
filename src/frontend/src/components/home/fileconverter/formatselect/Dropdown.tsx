import { useMemo, useRef, useState } from 'react';
import { FormatData } from './FormatSelect';
import FormatList from './FormatList';
import SearchBar from '../../../common/SearchBar';
import useClickOutside from '../../../../hooks/ClickOutside';
import useEscapeKey from '../../../../hooks/EscapeKey';

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
        <div
            ref={dropdownRef}
            className="format-select-dropdown"
            style={position === 'right' ? { left: 0 } : { right: 0 }}
        >
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
        </div>
    );
}
