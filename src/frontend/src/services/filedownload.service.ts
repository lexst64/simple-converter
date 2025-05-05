import axios from 'axios';
import { APIResponse } from './types';
import { APIException } from './exceptions';

interface FilePreperationData {
    filePreperationId: string;
}

export type FilePreparationStatus = 'preparing' | 'failed' | 'ready';

interface FilePreparationStatusData {
    status: FilePreparationStatus;
}

/**
 * Requests preparation (essentially zipping) of the converted files by providing their ids.
 *
 * @param fileUploadIds the ids of the converted file.
 * @returns file preparation id, which is used to track the preparation status and download the prepared files (zip file).
 * @throws {APIException} if an error occured during file preparation request or getting response from API.
 */
export async function prepareFiles(fileConversionIds: string[]): Promise<string> {
    let res;
    try {
        res = await axios.post<APIResponse<FilePreperationData>>('/v1/file-preps/', {
            fileConversionIds,
        });
    } catch (err) {
        if (axios.isAxiosError<APIResponse<FilePreperationData>>(err)) {
            if (err.response) {
                throw new APIException(err.response.data.message);
            } else if (err.request) {
                throw new APIException(err.request);
            } else {
                throw new APIException(err.message);
            }
        } else {
            throw new APIException((err as Error).message);
        }
    }
    return res.data.data.filePreperationId;
}

/**
 * Checks the preparation status using file preparation unique identifier.
 *
 * @param filePreparationId the id of the preparation.
 */
export async function checkPreparationStatus(
    filePreparationId: string,
): Promise<FilePreparationStatus> {
    let res;
    try {
        res = await axios.get<APIResponse<FilePreparationStatusData>>(
            `/v1/file-preps/status/${filePreparationId}`,
        );
    } catch (err) {
        if (axios.isAxiosError<APIResponse<FilePreparationStatusData>>(err)) {
            if (err.response) {
                throw new APIException(err.response.data.message);
            } else if (err.request) {
                throw new APIException(err.request);
            } else {
                throw new APIException(err.message);
            }
        } else {
            throw new APIException((err as Error).message);
        }
    }
    return res.data.data.status;
}

/**
 * Generates a relative download link for the prepared files based on the provided file preparation ID.
 *
 * @param filePreparationId the unique identifier for the file preparation id.
 * @returns the URL string for downloading the converted file.
 */
export function createPreparedFilesDownloadLink(filePreparationId: string): string {
    return `/v1/file-preps/${filePreparationId}`;
}

/**
 * Generates a relative download link for a file conversion based on the provided file conversion ID.
 *
 * @param fileConversionId the unique identifier for the file conversion.
 * @returns the URL string for downloading the converted file.
 */
export function createDownloadLink(fileConversionId: string): string {
    return `/v1/conversions/${fileConversionId}`;
}
