def traverse(obj, tree_types=(list, tuple)):
    if isinstance(obj, tree_types):
        for value in obj:
            for subvalue in traverse(value, tree_types):
                yield subvalue
    else:
        yield obj
