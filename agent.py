import time

import ywpi

@ywpi.service
class Some:
    @ywpi.api
    @staticmethod
    def loaddata(filepath: str):
        for i in range(2):
            time.sleep(1)
            yield { f'image_{i}': i }

    @ywpi.api
    def inference(self):
        pass


ywpi.serve_class(Some)

