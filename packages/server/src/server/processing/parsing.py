from typing import Any

from .common import Reference

def is_ref_object(obj):
    return type(obj) == dict and '$ref' in obj

def get_ref(obj):
    return obj['$ref'][2:]

def set_value(d, path, item):
    try:
        keys = path.split('/')
        last_key = keys[-1]
        keys = keys[:-1]
        for key in keys:
            if type(d) == list:
                d = d[int(key)]
            else:
                d = d[key]
        d[last_key] = item
    except:
        raise KeyError(f'path does not exists: {path}')
    
def get_value(d, path):
    try:
        keys = path.split('/')
        for key in keys:
            if type(d) == list:
                d = d[int(key)]
            else:
                d = d[key]
        return d
    except:
        raise KeyError(f'path does not exists: {path}')

def referencify(data: dict) -> tuple[dict[str, Reference], dict[str, Any]]:
    references: dict[str, Reference] = {}
    predefined_payload: dict[Reference, Any] = {}

    for step in data['steps'].values():
        args = step['inputs']
        for argname, argvalue in args.items():
            if type(argvalue) == dict and is_ref_object(argvalue):
                ref = get_ref(argvalue)
                ref_value = get_value(data, ref)
                if ref_value is not None and not ref.startswith('payload/'):
                    args[argname] = ref_value
                else:
                    if ref not in references:
                        reference = Reference(ref)
                        references[ref] = reference
                        # Set reference in null posistion
                        set_value(data, ref, reference)

                        if ref_value is not None: # It is payload with predefined values
                            predefined_payload[reference] = ref_value
                    else: # Get existing references
                        reference = references[ref]

                    args[argname] = reference

            elif type(argvalue) == list:
                for idx, subargvalue in enumerate(argvalue):
                    if type(subargvalue) == dict and is_ref_object(subargvalue):
                        ref = get_ref(subargvalue)
                        ref_value = get_value(data, ref)
                        if ref_value is not None and not ref.startswith('payload/'):
                            args[argname][idx] = ref_value
                        else:
                            if ref not in references:
                                reference = Reference(ref)
                                references[ref] = reference
                                # Set promise in null posistion
                                set_value(data, ref, reference)

                                if ref_value is not None: # It is payload with predefined values
                                    predefined_payload[reference] = ref_value
                            else: # Get existing promises
                                reference = references[ref]

                            args[argname][idx] = reference

        if 'conditions' not in step:
            continue
        conditions = step['conditions']
        if type(conditions) != list:
            raise RuntimeError('"conditions" should be list')

        for idx, condition in enumerate(conditions):
            if not is_ref_object(condition):
                raise NotImplementedError('conditions can be only reference')

            ref = get_ref(condition)
            ref_value = get_value(data, ref)
            if ref_value is not None and not ref.startswith('payload/'):
                conditions[idx] = ref_value
            else:
                if ref not in references:
                    reference = Reference(ref)
                    references[ref] = reference
                    # Set reference in null posistion
                    set_value(data, ref, reference)

                    if ref_value is not None: # It is payload with predefined values
                        predefined_payload[reference] = ref_value
                else: # Get existing references
                    reference = references[ref]
                conditions[idx] = reference

    returns = data['returns']
    for name in returns:
        if type(returns[name]) == dict and is_ref_object(returns[name]):
            ref: str = get_ref(returns[name])
            ref_value = get_value(data, ref)
            if (ref_value):
                returns[name] = ref_value
            else:
                if ref not in references:
                    reference = Reference(ref)
                    references[ref] = reference
                    # Set promise in null posistion
                    set_value(data, ref, reference)
                else: # Get existing promises
                    reference = references[ref]
                returns[name] = reference

    if 'yields' in data:
        yields = data['yields']
        for name in yields:
            if type(yields[name]) == dict and is_ref_object(yields[name]):
                ref: str = get_ref(yields[name])
                ref_value = get_value(data, ref)
                if (ref_value):
                    yields[name] = ref_value
                else:
                    if ref not in references:
                        reference = Reference(ref)
                        references[ref] = reference
                        # Set promise in null posistion
                        set_value(data, ref, reference)
                    else: # Get existing promises
                        reference = references[ref]
                    yields[name] = reference

    # Return mapping from `payload` keys to `payload` references.
    payload_promises: dict[str, Reference] = {}
    mapped_predefeined_payload: dict[str, Any] = {}
    payload = data['payload']
    for name, reference in payload.items():
        if type(reference) != Reference:
            raise RuntimeError(f'Payload "{name}" is not reference. That may indicate that payload does not required.')
        payload_promises[name] = reference
        if reference in predefined_payload:
            mapped_predefeined_payload[name] = predefined_payload[reference]

    return payload_promises, mapped_predefeined_payload
