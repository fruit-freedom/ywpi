import time

import ywpi

@ywpi.service
class UploadService:
    @ywpi.api
    @staticmethod
    def loaddata(filepath: str):
        for i in range(4):
            time.sleep(1)
            yield { f'image[{i}]': f'image_{i}.jpg' }

    @ywpi.api
    def inference(self):
        pass


ywpi.serve_class(UploadService)

