export type StatusMessageLevel = 'info' | 'warning' | 'error';

export interface StatusMessage {
    id: string;
    content: string;
    level: StatusMessageLevel;
}
