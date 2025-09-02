import ywpi

def type_name_to_python_type(name: str):
    if name in ('context', 'object'):
        return f'ywpi.{name.capitalize()}'

    return name


base_model_template = """
class {class_name}(pydantic.BaseModel):
{class_content}
"""


base_agent_template = """
class {class_name}(pydantic.BaseModel):
{class_content}
"""


def get_additional_definition(type_name):
    if type_name == 'CustomMessage':
        return base_model_template.format(
            class_name='CustomMessage',
            class_content='\n'.join([
                '    id: int',
                '    images: list[str]'
            ])
        )


def generate_stub_file_content(methods: list[ywpi.Method]):
    methods = ywpi.get_methods()
    imports = ["import ywpi", "import pydantic"]
    type_definitions = {}
    definitions = []
    for m in methods:
        inputs = []
        for i in m.inputs:
            inputs.append(f"{i.name}: {type_name_to_python_type(i.type)}")
            # if i.type not in type_definitions:
            #     definition = get_additional_definition(i.type)
            #     if definition is not None:
            #         type_definitions[i.type] = definition
        definitions.append(f"def {m.name}({ ', '.join(inputs) }): ...")

    return "\n\n".join(imports + list(type_definitions.values()) + definitions) + '\n'
