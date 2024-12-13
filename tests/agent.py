import ywpi


METHON_NO_ARGS_OUTPUTS = {
    'test_key': 'test_value'
}

@ywpi.method
def method_no_args():
    return METHON_NO_ARGS_OUTPUTS


METHON_NO_ARGS_YIELDS_OUTPUTS = {
    'first_key': 'first_value',
    'second_key': 'second_value'
}

@ywpi.method
def method_no_args_yields():
    for k, v in METHON_NO_ARGS_YIELDS_OUTPUTS.items():
        yield { k: v }


if __name__ == '__main__':
    ywpi.serve(id='test')
