import { useContext } from 'react';
import {
    FileConverterStateContext,
    FileConverterStateContextType,
} from '../context/FileConverterStateProvider';

export const useFileConverterState = (): FileConverterStateContextType => {
    const context = useContext(FileConverterStateContext);
    if (!context) {
        throw new Error('useFileConverterState must be used within a FileConverterStateProvider');
    }
    return context;
};
