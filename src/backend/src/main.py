import os
import pathlib
import subprocess
import uuid
import zipfile
from typing import Annotated

import aiofiles
import uvicorn
from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, Path, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session, col, create_engine, select

from db_models import FileConversion, FilePreparation, FileUpload
from requests import FileConversionRequest, FilePrepRequest, FileUploadRequest
from responses import (
    FileConversionRequestData,
    FileConversionStatusData,
    FilePreperationData,
    FilePreperationStatusData,
    FileUploadData,
    FileUploadRequestData,
    Response,
)

MAX_FILE_SIZE = 1_073_741_824  # in bytes

# supported formats and corresponding ffmpeg args
SUPPORTED_FORMATS: dict[str, list[str]] = {
    '3gp': ['-f', '3gp', '-c:v', 'h264', '-c:a', 'aac'],
    'avi': ['-f', 'avi', '-c:v', 'mpeg4', '-c:a', 'mp3'],
    'flv': ['-f', 'flv', '-c:v', 'h264', '-c:a', 'aac'],
    'mkv': ['-f', 'matroska', '-c:v', 'h264', '-c:a', 'aac'],
    'mov': ['-f', 'mov', '-c:v', 'h264', '-c:a', 'aac'],
    'mp4': ['-f', 'mp4', '-c:v', 'h264', '-c:a', 'aac'],
    'ogv': ['-f', 'ogg', '-c:v', 'libtheora', '-c:a', 'libvorbis'],
    'webm': ['-f', 'webm', '-c:v', 'libvpx-vp9', '-c:a', 'libvorbis'],
    'wmv': ['-c:v', 'wmv2', '-c:a', 'wmav2', '-f', 'asf'],
    'mp3': ['-c:a', 'libmp3lame', '-f', 'mp3'],
    'flac': ['-c:a', 'flac', '-f', 'flac'],
    'ogg': ['-c:a', 'libvorbis', '-f', 'ogg'],
    'aac': ['-c:a', 'aac', '-f', 'adts'],
    'alac': ['-c:a', 'alac', '-f', 'm4a'],
    'aiff': ['-c:a', 'pcm_s16be', '-f', 'aiff'],
    'amr': ['-c:a', 'libopencore_amrnb', '-f', 'amr'],
    'm4a': ['-c:a', 'aac', '-f', 'm4a'],
}

SQLITE_FILE_NAME = 'database.db'
SQLITE_URL = f'sqlite:///{SQLITE_FILE_NAME}'

# allows FastAPI to use the same SQLite database in different threads.
# This is necessary as one single request could use more than one thread
# (for example in dependencies).
connect_args = {'check_same_thread': False}
engine = create_engine(SQLITE_URL, connect_args=connect_args)


def get_database_session():
    with Session(engine) as session:
        yield session


DBSessionDep = Annotated[Session, Depends(get_database_session)]

app = FastAPI()


def ffmpeg_convert_media(
    conversion_id: str,
    input_filename: os.PathLike,
    input_format: str,
    output_filename: os.PathLike,
    output_format: str,
) -> None:
    # fmt: off
    process = subprocess.Popen(
        [
            'ffmpeg',
            '-f', input_format,
            '-i', str(input_filename),
            *SUPPORTED_FORMATS[output_format],
            '-loglevel', 'error',
            output_filename
        ],
        stderr=subprocess.PIPE
    )
    # fmt: on
    _, stderr = process.communicate()

    with next(get_database_session()) as db_session:
        file_conversion_model = db_session.get(FileConversion, uuid.UUID(conversion_id))
        if file_conversion_model is None:
            return

        if stderr:
            file_conversion_model.status = 'failed'
            # todo: do some better logging
            print(stderr)
        else:
            file_conversion_model.status = 'ready'

        db_session.add(file_conversion_model)
        db_session.commit()


def create_zip_file(preparation_id: str, filenames: list[str]) -> None:
    with next(get_database_session()) as db_session:
        file_preparation_model = db_session.get(FilePreparation, uuid.UUID(preparation_id))

        if file_preparation_model is None:
            return

        try:
            with zipfile.ZipFile(
                f'zip_files/{preparation_id}', 'w', compresslevel=zipfile.ZIP_STORED
            ) as zip_file:
                for fn in filenames:
                    zip_file.write(fn)
        except Exception:
            file_preparation_model.status = 'failed'
        else:
            file_preparation_model.status = 'ready'

        db_session.add(file_preparation_model)
        db_session.commit()


@app.post('/v1/file-uploads/', status_code=status.HTTP_201_CREATED)
async def request_file_upload(
    file_upload_req: FileUploadRequest, db_session: DBSessionDep
) -> Response[FileUploadRequestData]:
    root, ext = os.path.splitext(file_upload_req.filename)
    if not ext or ext[1:] not in SUPPORTED_FORMATS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'File extension is not supported')

    if file_upload_req.outputFormat not in SUPPORTED_FORMATS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'File output format is not supported')

    if file_upload_req.size > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'File size is over 1 GB')

    file_upload_model = FileUpload(
        filename=file_upload_req.filename,
        output_format=file_upload_req.outputFormat,
        size=file_upload_req.size,
        is_uploaded=False,
    )
    db_session.add(file_upload_model)
    db_session.commit()

    return Response[FileUploadRequestData](
        data=FileUploadRequestData(fileUploadId=str(file_upload_model.id)), message=''
    )


@app.put('/v1/file-uploads/{file_upload_id}', status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: Annotated[UploadFile, File(description='A file uploaded for convertion')],
    file_upload_id: Annotated[str, Path()],
    db_session: DBSessionDep,
) -> Response[FileUploadData]:
    file_upload_model = db_session.get(FileUpload, uuid.UUID(file_upload_id))

    if file_upload_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_upload_id not found')
    if file_upload_model.is_uploaded:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_upload_id has already been uploaded')

    async with aiofiles.open(f'input_files/{file_upload_id}', 'wb') as target_file:
        actual_file_size = 0
        while content := await file.read(1024):
            actual_file_size += len(content)
            if actual_file_size > MAX_FILE_SIZE:
                # TODO: remove file
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f'File cannot be larger than {MAX_FILE_SIZE}',
                )
            await target_file.write(content)

    file_upload_model.is_uploaded = True

    db_session.add(file_upload_model)
    db_session.commit()

    return Response[FileUploadData](data=FileUploadData(), message='')


@app.post('/v1/conversions/', status_code=status.HTTP_201_CREATED)
async def request_conversion(
    file_conversion_req: FileConversionRequest,
    db_session: DBSessionDep,
    background_tasks: BackgroundTasks,
) -> Response[FileConversionRequestData]:
    file_upload_model = db_session.get(FileUpload, uuid.UUID(file_conversion_req.fileUploadId))

    if file_upload_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_upload_id not found')
    if not file_upload_model.is_uploaded:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file has not been uploaded yet')

    file_conversion_model = FileConversion(status='converting')
    db_session.add(file_conversion_model)
    db_session.commit()

    background_tasks.add_task(
        ffmpeg_convert_media,
        conversion_id=str(file_conversion_model.id),
        input_filename=pathlib.Path(f'input_files/{file_upload_model.id}'),
        input_format=os.path.splitext(file_upload_model.filename)[1][1:],
        output_filename=pathlib.Path(f'output_files/{file_conversion_model.id}'),
        output_format=file_upload_model.output_format,
    )

    return Response[FileConversionRequestData](
        data=FileConversionRequestData(fileConversionId=str(file_conversion_model.id)),
        message='',
    )


@app.get('/v1/conversions/status/{file_conversion_id}', status_code=status.HTTP_200_OK)
async def check_conversion_status(
    file_conversion_id: Annotated[str, Path()], db_session: DBSessionDep
) -> Response[FileConversionStatusData]:
    file_conversion_model = db_session.get(FileConversion, uuid.UUID(file_conversion_id))
    if file_conversion_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_conversion_id not found')

    return Response[FileConversionStatusData](
        data=FileConversionStatusData(status=file_conversion_model.status),
        message='',
    )


@app.get('/v1/conversions/{file_conversion_id}', status_code=status.HTTP_200_OK)
async def download_converted_file(
    file_conversion_id: Annotated[str, Path()], db_session: DBSessionDep
) -> FileResponse:
    file_conversion_model = db_session.get(FileConversion, uuid.UUID(file_conversion_id))
    if file_conversion_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_conversion_id not found')

    if file_conversion_model.status == 'converting':
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file conversion is not ready yet')
    if file_conversion_model.status == 'failed':
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file conversion has failed')

    return FileResponse(f'output_files/{str(file_conversion_model.id)}', filename='')


@app.post('/v1/file-preps/', status_code=status.HTTP_201_CREATED)
async def request_file_preparation(
    file_preparation_req: FilePrepRequest,
    db_session: DBSessionDep,
    background_tasks: BackgroundTasks,
) -> Response[FilePreperationData]:
    file_conversion_UUIDs = [uuid.UUID(id) for id in file_preparation_req.fileConversionIds]
    file_conversion_models = db_session.exec(
        select(FileConversion).where(col(FileConversion.id).in_(file_conversion_UUIDs))
    ).all()

    for fcm in file_conversion_models:
        if fcm.status == 'converting':
            raise HTTPException(status.HTTP_400_BAD_REQUEST, 'some of files is still converting')
        if fcm.status == 'failed':
            raise HTTPException(status.HTTP_400_BAD_REQUEST, 'some of files has failed')

    if len(file_conversion_models) != len(file_conversion_UUIDs):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'some of files not found')

    file_preparation_model = FilePreparation(status='preparing')
    db_session.add(file_preparation_model)
    db_session.commit()

    background_tasks.add_task(
        create_zip_file,
        filenames=[f'output_files/{id}' for id in file_preparation_req.fileConversionIds],
        preparation_id=str(file_preparation_model.id),
    )

    return Response[FilePreperationData](
        data=FilePreperationData(filePreperationId=str(file_preparation_model.id)), message=''
    )


@app.get('/v1/file-preps/status/{file_preparation_id}', status_code=status.HTTP_200_OK)
async def check_file_preparation_status(
    file_preparation_id: Annotated[str, Path()],
    db_session: DBSessionDep,
) -> Response[FilePreperationStatusData]:
    file_preparation_model = db_session.get(FilePreparation, uuid.UUID(file_preparation_id))
    if file_preparation_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_preparation_id not found')

    return Response[FilePreperationStatusData](
        data=FilePreperationStatusData(status=file_preparation_model.status),
        message='',
    )


@app.get('/v1/file-preps/{file_preparation_id}', status_code=status.HTTP_200_OK)
async def download_file_preparation(
    file_preparation_id: Annotated[str, Path()],
    db_session: DBSessionDep,
) -> FileResponse:
    file_preparation_model = db_session.get(FilePreparation, uuid.UUID(file_preparation_id))
    if file_preparation_model is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file_preparation_id not found')

    if file_preparation_model.status == 'preparing':
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file preparation is not ready yet')
    if file_preparation_model.status == 'failed':
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'file preparation has failed')

    return FileResponse(f'zip_files/{str(file_preparation_model.id)}')


# for debugging
if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
