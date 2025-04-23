from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


class FileUploadRequest(BaseModel):
    # filename: str = Field(min_length=3, max_length=100)
    filename: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
    outputFormat: str = Field(min_length=2, max_length=6)
    size: int


class FileConversionRequest(BaseModel):
    fileUploadId: str
