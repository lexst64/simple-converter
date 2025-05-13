import { useState } from 'react';
import { FormatData } from './FormatSelect';
import { capitalize } from '../../../../utils';
import { MdOutlineChevronRight } from 'react-icons/md';
import styled, { css } from 'styled-components';
import { nonScrollableMixin } from '../../../../mixins';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 10px;
    gap: 10px;
`;

const TabsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100px;
`;

const Tab = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;

    font-size: 1rem;
    padding: 5px 10px;
    cursor: pointer;
    width: 50px;
    border: none;
    width: 100%;
    background: none;
    font-weight: 400;

    ${props =>
        props.$active
            ? css`
                  color: var(--primary-color);
              `
            : css`
                  color: var(--text-color);
              `}
`;

const ChoicesWrapper = styled.div`
    overflow-y: auto;
    max-height: 250px;

    ${nonScrollableMixin}
`;

const ChoicesGrid = styled.div<{ $nColumns: number }>`
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(${props => props.$nColumns}, 1fr);
`;

const Choice = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 3px;
    cursor: pointer;
    width: 50px;
    border-radius: 5px;
    border: none;

    ${props =>
        props.$active
            ? css`
                  background-color: var(--primary-color);
              `
            : css`
                  background-color: #999;
              `}

    &:hover {
        background-color: #777;
    }
`;

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
        <Wrapper>
            <TabsWrapper>
                {formatData.map(data => (
                    <Tab
                        // format data type is unique and consistent, we can use it as a key
                        key={data.type}
                        $active={currentTab === data.type}
                        onClick={() => setCurrentTab(data.type)}
                    >
                        {capitalize(data.type)}
                        <span>
                            <MdOutlineChevronRight />
                        </span>
                    </Tab>
                ))}
            </TabsWrapper>
            <ChoicesWrapper>
                <ChoicesGrid $nColumns={4}>
                    {formatData
                        .find(data => data.type === currentTab)
                        ?.formats.map(format => (
                            <Choice
                                // format is unique and consistent, we can use it as a key
                                key={format}
                                onClick={() => onChange(format)}
                                $active={format === currentFormat}
                            >
                                {format}
                            </Choice>
                        ))}
                </ChoicesGrid>
            </ChoicesWrapper>
        </Wrapper>
    );
}

function StringList({ formatData, currentFormat, onChange }: StringListProps) {
    return (
        <Wrapper>
            <ChoicesWrapper>
                <ChoicesGrid $nColumns={formatData.length >= 4 ? 4 : formatData.length}>
                    {formatData.map(format => (
                        <Choice
                            // format is unique and consistent, we can use it as a key
                            key={format}
                            onClick={() => onChange(format)}
                            $active={format === currentFormat}
                        >
                            {format}
                        </Choice>
                    ))}
                </ChoicesGrid>
            </ChoicesWrapper>
        </Wrapper>
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
