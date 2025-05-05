import { FixedSizeList } from 'react-window';
import { SUPPORTED_FORMATS } from '../../../constants';
import FileDropArea from '../../common/FileDropArea';
import Select, { Option } from '../../common/Select';
import FileListItem from './FIleListItem';
import { DragEvent } from 'react';
import { useFileConverterState } from '../../../hooks/FileConverterState';

export default function FileList() {
    const { fileHolders, conversionDetails, changeFilesFormat, addFiles } = useFileConverterState();

    const selectOptions: Option[] = [
        { label: '---', value: '' },
        ...SUPPORTED_FORMATS.map(item => ({ label: item, value: item })),
    ];

    const handleFileDrop = (ev: DragEvent) => {
        addFiles(Array.from(ev.dataTransfer.files));
    };

    const listControls = (
        <div className="file-preparation-area-controls">
            <Select
                className="output-format-select"
                options={selectOptions}
                label={`Convert all (${fileHolders.length}) to: `}
                value={(() => {
                    const uniqueOutFormats = [...new Set(fileHolders.map(fh => fh.outFormat))];
                    return uniqueOutFormats.length === 1 ? uniqueOutFormats[0] : '';
                })()}
                onChange={ev =>
                    changeFilesFormat(
                        fileHolders.map(fh => fh.id),
                        ev.currentTarget.value,
                    )
                }
            />
        </div>
    );

    return (
        <div className="file-preparation-area">
            {listControls}
            <FileDropArea onDrop={handleFileDrop}>
                <div className="selected-files-container">
                    <FixedSizeList
                        className="no-scrollbar"
                        height={300}
                        width={'100%'}
                        itemCount={fileHolders.length}
                        itemSize={60}
                        itemKey={index => fileHolders[index].id}
                    >
                        {({ index, style }) => (
                            <FileListItem
                                style={style}
                                fileHolder={fileHolders[index]}
                                conversionDetail={conversionDetails.find(
                                    cd => cd.fileHolderId === fileHolders[index].id,
                                )}
                            />
                        )}
                    </FixedSizeList>
                </div>
            </FileDropArea>
        </div>
    );
}
