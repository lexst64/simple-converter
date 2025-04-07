import { APIException } from './exceptions';
import { APIResponse } from './types';

const BASE_URL = 'https://api.simpleconverter.lexst64.com/v1/fileupload';

export interface FileUploadData {
    fileId: string;
}

/**
 * Uploads a file to the server.
 *
 * @throws {APIException} if an error occured during file uploading or getting response from API.
 */
// TODO: implement API services
export default async function uploadFile(
    file: File,
    uploadSessionKey: string,
): Promise<APIResponse<FileUploadData>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${BASE_URL}/${uploadSessionKey}`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        return data as APIResponse<FileUploadData>;
    } catch (err) {
        throw new APIException((err as Error).message);
    }
}
