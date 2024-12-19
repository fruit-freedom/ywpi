import ywpi
import time
import typing as t

import requests

@ywpi.method
def load_from_dir(directory: str):
    import os
    for idx, path in enumerate(os.listdir(directory)):
        time.sleep(0.5)
        yield { f'file[{idx}]': path }

@ywpi.method
def all_types(string: str, integer: int, double: float):
    pass

@ywpi.method
def a_lot_of_inputs(
    input_1: str,
    input_2: str,
    input_3: str,
    input_4: str,
    input_5: str,
    input_6: str,
    input_7: str,
    input_8: str,
    input_9: str,
):
    pass

@ywpi.method
def method_with_text(prompt: t.Annotated[str, ywpi.Text], model_name: str) -> list[str]:
    time.sleep()


@ywpi.method
def get_url(url: str):
    response = requests.get(url)
    response.raise_for_status()
    yield {'html': response.text}


import pydantic

class Doc(pydantic.BaseModel):
    id: str
    name: str

@ywpi.method
def retrieve(query_string: str) -> list[Doc]:
    pass

ywpi.serve()