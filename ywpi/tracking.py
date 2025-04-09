def _track(fn):
    def wrapper():
        fn()

    return wrapper


def track(fn=None, track_yields=True):
    if fn is None:
        return _track(fn)

    def decorator(fn):
        return _track(fn)
    
    return decorator



@track()
def some_trackable(number: int, word: str):
    yield number
    yield word

    return f'{word}-{number}'




