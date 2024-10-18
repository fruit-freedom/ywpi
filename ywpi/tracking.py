

def track(track_yields=False):
    def decorator(fn):
        pass



# track_yields=True => all yielded values will be logged

@track()
def some_trackable(number: int, word: str):
    yield number
    yield word

    return f'{word}-{number}'




