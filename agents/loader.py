import ywpi
import time
import typing as t

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
def method_with_text(prompt: t.Annotated[str, ywpi.Text]):
    pass


ywpi.serve()