import { FixedSizeList } from 'react-window';
import { ConversionDetail, FileHolder } from './FileConverter';
import FileProgress from './FileProgress';

interface ConversionProgressProps {
    fileHolders: FileHolder[];
    conversionDetails: ConversionDetail[];
}

export default function ConversionProgress({
    fileHolders,
    conversionDetails,
}: ConversionProgressProps) {
    return (
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
                    <FileProgress
                        style={style}
                        fileHolder={fileHolders[index]}
                        conversionDetail={conversionDetails.find(
                            cd => cd.fileHolderId === fileHolders[index].id,
                        )}
                    />
                )}
            </FixedSizeList>
        </div>
    );
}
