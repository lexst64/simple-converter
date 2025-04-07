import uuid
from typing import Annotated

import aiofiles
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlmodel import Session, create_engine

from db_models import InputFile

sqlite_file_name = 'database.db'
sqlite_url = f'sqlite:///{sqlite_file_name}'

# allows FastAPI to use the same SQLite database in different threads.
# This is necessary as one single request could use more than one thread
# (for example in dependencies).
connect_args = {'check_same_thread': False}

engine = create_engine(sqlite_url, connect_args=connect_args)


def get_database_session():
    with Session(engine) as session:
        yield session


DBSessionDep = Annotated[Session, Depends(get_database_session)]


class FileUpload(BaseModel):
    in_format: str
    out_format: str


MAX_FILE_LENGTH = 1_073_741_824  # in bytes

app = FastAPI()


@app.post('/v1/fileupload/')
async def file_upload(
    file: Annotated[UploadFile, File(description='A file uploaded for convertion')],
    db_session: DBSessionDep,
):
    actual_file_size = 0
    file_uuid = str(uuid.uuid4())

    try:
        async with aiofiles.open(f'input_files/{file_uuid}', 'wb') as target_file:
            while content := await file.read(1024):
                actual_file_size += len(content)
                if actual_file_size > MAX_FILE_LENGTH:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f'file cannot be larger than {MAX_FILE_LENGTH}',
                    )
                await target_file.write(content)
    except OSError:
        return {'message': 'failed saving file on the server'}

    db_session.add(InputFile(uuid=file_uuid, user_id=1))
    db_session.commit()

    return {'message': file_uuid}
