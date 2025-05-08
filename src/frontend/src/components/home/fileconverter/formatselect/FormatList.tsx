import { useState } from 'react';
import { FormatData } from './FormatSelect';
import classNames from 'classnames';
import { capitalize } from '../../../../utils';

interface BaseFormatListProps {
    currentFormat?: string;
    onChange: (newFormat: string) => void;
}

interface FormatDataListProps extends BaseFormatListProps {
    formatData: FormatData[];
}

interface StringListProps extends BaseFormatListProps {
    formatData: string[];
}

function FormatDataList({ formatData, currentFormat, onChange }: FormatDataListProps) {
    const [currentTab, setCurrentTab] = useState<string | undefined>(() => {
        if (!currentFormat) {
            return formatData[0].type;
        }
        const tab = formatData.find(data => data.formats.includes(currentFormat));
        return tab?.type || formatData[0].type;
    });

    return (
        <div className="format-list-container">
            <div className="format-list-tabs-container">
                {formatData.map(data => (
                    <button
                        // format data type is unique and consistent, we can use it as a key
                        key={data.type}
                        className={classNames('format-list-tab', {
                            active: currentTab === data.type,
                        })}
                        onClick={() => {
                            setCurrentTab(data.type);
                        }}
                    >
                        <span>{capitalize(data.type)}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                            chevron_right
                        </span>
                    </button>
                ))}
            </div>
            <div className="format-list-choices-container no-scrollbar">
                <div className="format-list-choices-grid">
                    {formatData
                        .find(data => data.type === currentTab)
                        ?.formats.map(format => (
                            <button
                                // format is unique and consistent, we can use it as a key
                                key={format}
                                onClick={() => onChange(format)}
                                className={classNames('format-list-choice', {
                                    active: format === currentFormat,
                                })}
                            >
                                {format}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}

function StringList({ formatData, currentFormat, onChange }: StringListProps) {
    return (
        <div className="format-list-container">
            <div className="format-list-choices-container no-scrollbar">
                <div
                    className="format-list-choices-grid"
                    style={{
                        gridTemplateColumns: `repeat(${formatData.length >= 4 ? 4 : formatData.length}, 1fr)`,
                    }}
                >
                    {formatData.map(format => (
                        <button
                            // format is unique and consistent, we can use it as a key
                            key={format}
                            onClick={() => onChange(format)}
                            className={classNames('format-list-choice', {
                                active: format === currentFormat,
                            })}
                        >
                            {format}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function FormatList({
    formatData,
    ...props
}: BaseFormatListProps & { formatData: FormatData[] | string[] }) {
    if (formatData.length === 0) {
        return <div></div>;
    }
    if (typeof formatData[0] === 'string') {
        return <StringList formatData={formatData as string[]} {...props} />;
    } else {
        return <FormatDataList formatData={formatData as FormatData[]} {...props} />;
    }
}
