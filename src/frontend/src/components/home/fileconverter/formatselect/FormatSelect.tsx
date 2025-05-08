import { useState } from 'react';
import { AUDIO_FORMATS, VIDEO_FORMATS } from '../../../../constants';
import Dropdown from './Dropdown';

export interface FormatData {
    type: string;
    formats: string[];
}

interface FormatSelectProps {
    onChange: (newFormat: string) => void;
    dropdownPosition?: 'left' | 'right';
}

export default function FormatSelect({ onChange, dropdownPosition = 'right' }: FormatSelectProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [format, setFormat] = useState<string | undefined>(undefined);

    const formatData: FormatData[] = [
        { type: 'audio', formats: AUDIO_FORMATS },
        { type: 'video', formats: VIDEO_FORMATS },
    ];

    const updateFormat = (newFormat: string) => {
        onChange(newFormat);
        setFormat(newFormat);
        setIsOpen(!isOpen);
    };

    return (
        <div className="format-select-container">
            <button
                onClick={() => setIsOpen(isOpen => !isOpen)}
                className="secondary-button-small"
                style={{ justifyContent: 'left', width: '90px' }}
            >
                <span>{format || 'Choose'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                    arrow_drop_down
                </span>
            </button>
            {isOpen && (
                <Dropdown
                    formatData={formatData}
                    onChange={updateFormat}
                    currentFormat={format}
                    position={dropdownPosition}
                />
            )}
        </div>
    );
}
