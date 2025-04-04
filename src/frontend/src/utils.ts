export const toHumanReadable = (size: number): string => {
    const fractionDigits = 1
    
    if (size < 1024) {
        return `${size.toFixed(fractionDigits)} B`;
    }
    if (size < (1024 * 1024)) {
        return `${(size / 1024).toFixed(fractionDigits)} KB`
    }
    if (size < (1024 * 1024 * 1024)) {
        return `${(size / 1024 / 1024).toFixed(fractionDigits)} MB`
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(fractionDigits)} GB`
}

export const truncateMiddle = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) {
        return str;
    }

    const startLength = Math.ceil(maxLength / 2);
    const endLength = Math.floor(maxLength / 2);

    const start = str.slice(0, startLength);
    const end = str.slice(-endLength);

    return `${start} ... ${end}`;
}
