import uuid
from typing import Literal

from sqlalchemy import String
from sqlmodel import Field, SQLModel
from uuid_extensions import uuid7

type FileConversionStatus = Literal['converting', 'failed', 'ready']
type FilePreparationStatus = Literal['preparing', 'failed', 'ready']


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str


class FileUpload(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True)
    filename: str
    output_format: str
    size: int
    is_uploaded: bool


class FileConversion(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True)
    status: FileConversionStatus = Field(sa_type=String)
    filename: str
    output_format: str


class FilePreparation(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True)
    status: FilePreparationStatus = Field(sa_type=String)


if __name__ == '__main__':
    from sqlmodel import create_engine

    sqlite_file_name = 'database.db'
    sqlite_url = f'sqlite:///{sqlite_file_name}'

    engine = create_engine(sqlite_url, echo=True)
    SQLModel.metadata.create_all(engine)
