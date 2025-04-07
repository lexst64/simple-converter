export interface APIResponse<T> {
    status: string;
    data: T;
    message: string;
    meta: {
        timestamp: string;
        version: string;
    };
}
