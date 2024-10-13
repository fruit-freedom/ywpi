import time

import ywpi

@ywpi.service
class YoloService:
    @ywpi.api
    @staticmethod
    def predict(image_path: str, iou: int):
        for i in range(2):
            time.sleep(1)
            yield { f'annotated_image_{i}': i }


ywpi.serve_class(YoloService)

