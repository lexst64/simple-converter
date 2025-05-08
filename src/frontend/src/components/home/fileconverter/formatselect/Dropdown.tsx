import { useMemo, useState } from 'react';
import { FormatData } from './FormatSelect';
import FormatList from './FormatList';
import SearchBar from '../../../common/SearchBar';

interface DropdownProps {
    formatData: FormatData[];
    position: 'left' | 'right';
    currentFormat?: string;

    onChange: (newFormat: string) => void;
}

export default function Dropdown({ formatData, currentFormat, onChange, position }: DropdownProps) {
    const [searchValue, setSearchValue] = useState<string>('');

    const allFormats: string[] = useMemo(
        () => formatData.reduce<string[]>((acc, data) => [...acc, ...data.formats], []),
        [formatData],
    );

    return (
        <div
            className="format-select-dropdown"
            style={position === 'right' ? { left: 0 } : { right: 0 }}
        >
            <SearchBar
                autoFocus
                placeholder="Search"
                value={searchValue}
                onChange={ev => {
                    console.log(ev.target.value);
                    setSearchValue(ev.target.value);
                }}
            />
            <FormatList
                currentFormat={currentFormat}
                formatData={
                    searchValue.trim().length === 0
                        ? formatData
                        : allFormats.filter(format => format.includes(searchValue.trim()))
                }
                onChange={onChange}
            />
        </div>
    );
}
