import pydantic
import io
from pypdf import PdfReader

from ywpi.handle_args import TYPE_CONVERTERS, DESERIALIZERS, TYPE_NAMES

import requests

class PDF(pydantic.BaseModel):
    name: str
    src: str

    @staticmethod
    def from_data(data: dict) -> 'PDF':
        return PDF.model_validate(data)

    def _download_file(self) -> bytes:
        print(f'Downloading from {self.src}')
        res = requests.get(self.src)
        res.raise_for_status()
        return res.content

    @staticmethod
    def to_bytes(pdf: 'PDF'):
        return b'File-Content'

    @staticmethod
    def to_str(pdf: 'PDF'):
        file_content = pdf._download_file()
        print('Extracting text')
        with io.BytesIO(file_content) as file:
            reader = PdfReader(file)
            return ' '.join(map(lambda e: e.extract_text(), reader.pages))

TYPE_NAMES[PDF] = 'pdf'
DESERIALIZERS[PDF] = PDF.from_data
TYPE_CONVERTERS[(PDF, bytes)] = PDF.to_bytes
TYPE_CONVERTERS[(PDF, str)] = PDF.to_str


__all__ = (
    'PDF',
)
