import axios from 'axios';
import { APIException } from './exceptions';
import { APIResponse } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FileUploadData {}

export interface FileUploadRequestData {
    fileUploadId: string;
}

/**
 * Uploads the file and returns the id associated with the uploaded file (file upload id).
 *
 * @param file a file to be uploaded.
 * @param outputFormat a format to which the file should be converted to.
 * @throws {APIException} if an error occured during file uploading or getting response from API.
 */
export default async function uploadFile(file: File, outputFormat: string): Promise<string> {
    let res;
    try {
        res = await axios.post<APIResponse<FileUploadRequestData>>('/v1/file-uploads/', {
            filename: file.name,
            outputFormat: outputFormat,
            size: file.size,
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

    const fileUploadId = res.data.data.fileUploadId;
    const formData = new FormData();
    formData.append('file', file);

    try {
        res = await axios.put<APIResponse<FileUploadData>>(
            `/v1/file-uploads/${fileUploadId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
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

    return fileUploadId;
}
