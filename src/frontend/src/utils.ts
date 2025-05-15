export const toHumanReadable = (size: number): string => {
    const fractionDigits = 1;

    if (size < 1024) {
        return `${size.toFixed(fractionDigits)} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(fractionDigits)} KB`;
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(fractionDigits)} MB`;
    }
    return `${(size / 1024 / 1024 / 1024).toFixed(fractionDigits)} GB`;
};

export const truncateMiddle = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) {
        return str;
    }

    const startLength = Math.ceil(maxLength / 2);
    const endLength = Math.floor(maxLength / 2);

    const start = str.slice(0, startLength);
    const end = str.slice(-endLength);

    return `${start} ... ${end}`;
};

export const capitalize = (str: string): string => {
    if (str.length === 0) {
        return str;
    }
    return str.charAt(0).toUpperCase() + str.substring(1);
};

export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop() || '';
};

export const toRelativeTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();

    const diffInSeconds = Math.floor((now.valueOf() - date.valueOf()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} days ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} months ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} years ago`;
};
