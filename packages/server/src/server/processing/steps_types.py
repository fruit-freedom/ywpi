from typing import Optional
from dataclasses import dataclass
from enum import Enum

# import numpy as np

@dataclass
class ImageFilePath:
    path: str

@dataclass
class ImageFile:
    data: bytes

class PixelFormat(Enum):
    Undefined = 0
    RGB = 1
    BGR = 2
    RGBA = 3
    BGRA = 4

class PixelLayout(Enum):
    Undefined = 0
    PixelOrder = 1
    Planar = 2

@dataclass
class RawImage:
    # data: np.ndarray
    width: int
    height: int
    pixel_format: PixelFormat = PixelFormat.Undefined
    layout: PixelLayout = PixelLayout.PixelOrder

@dataclass
class Index:
    row: int
    column: int

@dataclass
class GeoTiffCrop:
    index: Index
    image: RawImage

@dataclass
class GeoJSONFilePath:
    path: str

@dataclass
class OrthomosaicFilePath:
    path: str

@dataclass
class ImageFileJPEG:
    data: bytes

@dataclass
class ImageFilePNG:
    data: bytes

@dataclass
class OrthomosaicFile:
    data: bytes

@dataclass
class Verdict:
    violation: bool
    code: int

@dataclass
class ImageFilePNGMask:
    data: bytes

@dataclass
class JSON:
    data: str

@dataclass
class ViolationCrops:
    indexes: list[Index]
