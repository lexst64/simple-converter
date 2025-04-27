import axios from 'axios';
import { APIResponse } from './types';
import { APIException } from './exceptions';
import { FileUploadRequestData } from './fileupload.service';

interface FileConversionRequestData {
    fileConversionId: string;
}

export type FileConversionStatus = 'converting' | 'failed' | 'ready';

interface FileConversionStatusData {
    status: FileConversionStatus;
}

/**
 * Requests a file conversion with the file upload id and returns the id associated with the conversion request (file conversion id).
 *
 * @param fileUploadId the id of the earlier uploaded file.
 * @throws {APIException} if an error occured during file conversion or getting response from API.
 */
export async function convertFile(fileUploadId: string): Promise<string> {
    let res;
    try {
        res = await axios.post<APIResponse<FileConversionRequestData>>('/v1/conversions/', {
            fileUploadId: fileUploadId,
        });
    } catch (err) {
        if (axios.isAxiosError<APIResponse<FileUploadRequestData>>(err)) {
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
    return res.data.data.fileConversionId;
}

/**
 * Checks the conversion status of a file using its unique identifier.
 *
 * @param fileConversionId - The unique identifier of the file conversion process.
 * @throws {APIException} - Throws an exception if an error occurs during the API request.
 */
export async function checkConversionStatus(
    fileConversionId: string,
): Promise<FileConversionStatus> {
    let res;
    try {
        res = await axios.get<APIResponse<FileConversionStatusData>>(
            `/v1/conversion/status/${fileConversionId}`,
        );
    } catch (err) {
        if (axios.isAxiosError<APIResponse<FileUploadRequestData>>(err)) {
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
