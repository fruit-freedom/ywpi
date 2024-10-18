import time

import ywpi

# @ywpi.service
# class UploadService:
#     @ywpi.api
#     @staticmethod
#     def loaddata(filepath: str):
#         for i in range(4):
#             time.sleep(1)
#             yield { f'image[{i}]': f'image_{i}.jpg' }

#     # @ywpi.api
#     # def inference(self):
#     #     pass

#     @ywpi.api
#     @staticmethod
#     def load_from_dir(directory: str):
#         import os
#         for idx, path in enumerate(os.listdir(directory)):
#             time.sleep(0.5)
#             yield { f'file[{idx}]': path }


#     @ywpi.api
#     @staticmethod
#     def method_with_all_args(string: str, integer: int, floating: float):
#         pass

# ywpi.serve_class(UploadService)




@ywpi.method
def load_from_dir(directory: str):
    import os
    for idx, path in enumerate(os.listdir(directory)):
        time.sleep(0.5)
        yield { f'file[{idx}]': path }

@ywpi.method
def all_types(string: str, integer: int, double: float):
    pass

ywpi.serve()

