import typing as t
import io

import pydantic
try:
    import requests
except:
    pass

from ywpi.handle_args import TYPE_CONVERTERS, DESERIALIZERS, TYPE_NAMES


try:
    import pymupdf

    def to_pymupdf_document(pdf: 'PDF') -> pymupdf.Document:
        return pymupdf.Document(stream=pdf._download_file())

    TYPE_CONVERTERS[('PDF', pymupdf.Document)] = to_pymupdf_document
except:
    pass


class PDF(pydantic.BaseModel):
    name: str
    src: str

    @staticmethod
    def from_data(data: dict, *args) -> 'PDF':
        return PDF.model_validate(data)

    def _download_file(self) -> bytes:
        print(f'Downloading from {self.src}')
        res = requests.get(self.src)
        res.raise_for_status()
        print(f'Downloading complete {self.src}')
        return res.content

    @staticmethod
    def to_bytes(pdf: 'PDF'):
        return b'File-Content'

    @staticmethod
    def to_str(pdf: 'PDF'):
        file_content = pdf._download_file()
        print('Extracting text')
        with io.BytesIO(file_content) as file:
            doc = pymupdf.open(stream=file)
            return ' '.join(map(lambda e: e.get_text(), doc))


TYPE_NAMES[PDF] = 'pdf'
DESERIALIZERS[PDF] = PDF.from_data
TYPE_CONVERTERS[(PDF, bytes)] = PDF.to_bytes
TYPE_CONVERTERS[(PDF, str)] = PDF.to_str


class DocumentText(pydantic.BaseModel):
    page_number: int
    text: str
    x1: float
    y1: float
    x2: float
    y2: float

    @staticmethod
    def from_pymupdf_tuple(w, page_number: int):
        return DocumentText(
            page_number=page_number,
            text=w[4],
            x1=w[0],
            y1=w[1],
            x2=w[2],
            y2=w[3]
        )

TYPE_NAMES[DocumentText] = 'document_text'
DESERIALIZERS[PDF] = PDF.from_data


class Message(pydantic.BaseModel):
    id: t.Optional[str] = None
    role: str
    content: str
TYPE_NAMES[Message] = 'message'


class Chat(pydantic.BaseModel):
    messages: list[Message]
TYPE_NAMES[Chat] = 'chat'


__all__ = (
    'PDF',
    'DocumentText',
    'Message',
    'Chat'
)
