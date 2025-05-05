from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from db_models import FileConversionStatus, FilePreparationStatus


class ReponseMeta(BaseModel):
    timestamp: str
    version: str


def create_response_meta() -> ReponseMeta:
    return ReponseMeta(timestamp=datetime.isoformat(datetime.now()), version='v1')


class Response[T](BaseModel):
    status: Literal['success', 'error'] = 'success'
    data: T
    message: str
    meta: ReponseMeta = Field(default_factory=create_response_meta)


class FileUploadData(BaseModel):
    pass


class FileUploadRequestData(BaseModel):
    fileUploadId: str


class FileConversionRequestData(BaseModel):
    fileConversionId: str


class FileConversionStatusData(BaseModel):
    status: FileConversionStatus


class FilePreperationData(BaseModel):
    filePreperationId: str


class FilePreperationStatusData(BaseModel):
    status: FilePreparationStatus
