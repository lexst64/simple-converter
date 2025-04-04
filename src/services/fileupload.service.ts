const BASE_URL = 'https://api.simpleconverter.lexst64.com/fileupload'

class APIException extends Error {
}

interface FileUploadResponse {
    ok: boolean;
}

export default async function uploadFile(file: File, uploadSessionKey: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${BASE_URL}/${uploadSessionKey}`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        return { ok: data.ok } satisfies FileUploadResponse;
    } catch (err) {
        throw new APIException((err as Error).message);
    }
}
