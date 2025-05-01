import { FixedSizeList } from 'react-window';
import { FileHolder } from './FileConverter';
import FileProgress from './FileProgress';

interface ConversionProgressProps {
    fileHolders: FileHolder[];
}

export default function ConversionProgress({ fileHolders }: ConversionProgressProps) {
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
                    <FileProgress style={style} fileHolder={fileHolders[index]} />
                )}
            </FixedSizeList>
        </div>
    );
}
