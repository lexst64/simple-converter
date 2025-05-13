import { useState } from 'react';
import { AUDIO_FORMATS, VIDEO_FORMATS } from '../../../../constants';
import Dropdown from './Dropdown';
import { MdArrowDropDown } from 'react-icons/md';
import styled from 'styled-components';
import SecondaryButton from '../../../common/buttons/SecondaryButton';

const Wrapper = styled.div`
    position: relative;
`;

const SelectButton = styled(SecondaryButton)`
    justify-content: left;
    width: 90px;
`;

export interface FormatData {
    type: string;
    formats: string[];
}

interface FormatSelectProps {
    onChange: (newFormat: string) => void;
    dropdownPosition?: 'left' | 'right';
    currentFormat?: string;
}

export default function FormatSelect({
    onChange,
    dropdownPosition = 'right',
    currentFormat,
}: FormatSelectProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const formatData: FormatData[] = [
        { type: 'audio', formats: AUDIO_FORMATS },
        { type: 'video', formats: VIDEO_FORMATS },
    ];

    const updateFormat = (newFormat: string) => {
        onChange(newFormat);
        setIsOpen(false);
    };

    return (
        <Wrapper>
            <SelectButton $small onClick={() => setIsOpen(!isOpen)}>
                {currentFormat || 'Choose'}
                <span>
                    <MdArrowDropDown />
                </span>
            </SelectButton>
            {isOpen && (
                <Dropdown
                    onClose={() => setIsOpen(false)}
                    formatData={formatData}
                    onChange={updateFormat}
                    currentFormat={currentFormat}
                    position={dropdownPosition}
                />
            )}
        </Wrapper>
    );
}
