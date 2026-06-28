import json
import typing as t
from collections import defaultdict

from server.processing.models import Edge, Wf


data = {
    "nodes": [
        {
            "id": "1",
            "type": "method",
            "data": {
                "name": "builtins/pdf-check"
            }
        },
        {
            "id": "2",
            "type": "method",
            "data": {
                "name": "algorithms/summarization",
                "config": {
                    "prompt_template": "Write summary for this text: {TEXT}"
                }
            }
        },
        {
            "id": "3",
            "type": "method",
            "data": {
                "name": "algorithms/embeddings",
                "config": {
                    
                }
            }
        }
    ],
    "edges": [
        {
            "source": "1",
            "target": "2",
            "type": "depends"
        },
        {
            "source": "2",
            "sourceHandle": "summary",
            "target": "3",
            "targetHandle": "text",
            "type": "inputs-passing"
        }
    ]
}






# Collect all executed step (nodes)
# 


def to_chains_workflow(wf: Wf):
    node_to_edges: dict[str, list[Edge]] = defaultdict(list)


    nodes = { n.id: n for n in wf.nodes }

    for edge in wf.edges:
        node_to_edges[edge.source].append(edge)
        node_to_edges[edge.target].append(edge)


    workflow = defaultdict(dict)
    returns = {}
    payload = {}


    for node in wf.nodes:
        node_id = node.id
        edges = node_to_edges.get(node_id, [])

        if node.type == "data":
            # Fill payload
            for k, v in node.data.payload.items():
                payload[f"{node_id}.{k}"] = v
            continue

        inputs = {}
        for e in edges:
            if e.target != node_id:
                continue

            if e.type == "depends":
                pass
                # print(e.source , "-->", node_id)
            elif e.type == "inputs-passing":

                if nodes[e.source].type == "data":
                    from_ref = f'#/payload/{e.source}.{e.source_handle}'
                else:
                    from_ref = f'#/steps/{e.source}/outputs/{e.source_handle}'

                inputs[e.target_handle] = {
                    "$ref": from_ref
                }

            else:
                print("Unknow edge type:", e.type)

        print(node.data.name)
        outputs = {
            k: None
            for k in BaseStep.STEP_CLASSES_DICT.get(node.data.name).produced_outputs()
        }

        returns.update({
            f"{node.id}.{k}": { "$ref": f'#/steps/{node.id}/outputs/{k}' }
            for k in BaseStep.STEP_CLASSES_DICT.get(node.data.name).produced_outputs()
        })

        step = {
            "method": node.data.name,
            "inputs": inputs,
            "outputs": outputs
        }

        # print(step)
        workflow["steps"][node_id] = step
    
        # print("----", node_id, "----")
        # print("INPUTS", inputs)
        # print("OUTPUTS", outputs)


    workflow["payload"] = payload
    workflow["returns"] = returns

    # print(node_to_edges)

    print(json.dumps(workflow, indent=2))
    return workflow


from .chains import BaseStep, Chain


class SummarizationStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'algorithms/summarization'

    @staticmethod
    def required_inputs() -> dict[str, t.Any]:
        return { }

    @staticmethod
    def produced_outputs() -> dict[str, t.Any]:
        return { 'summary': str }

    async def run(self, inputs: dict[str, t.Any]) -> dict[str, t.Any]:
        return { 'summary': "This is good summary <EOF>" }


class EmbeddingsStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'algorithms/embeddings'

    @staticmethod
    def required_inputs() -> dict[str, t.Any]:
        return { "text": int }

    @staticmethod
    def produced_outputs() -> dict[str, t.Any]:
        return { 'embedding': str }

    async def run(self, inputs: dict[str, t.Any]) -> dict[str, t.Any]:
        print("Run embedding on text:", inputs["text"])
        return { 'embedding': "<generated embedding>" }


class PdfCheckStep(BaseStep):
    @staticmethod
    def method() -> str:
        return 'builtins/pdf-check'

    @staticmethod
    def required_inputs() -> dict[str, t.Any]:
        return { }

    @staticmethod
    def produced_outputs() -> dict[str, t.Any]:
        return { }

    async def run(self, inputs: dict[str, t.Any]) -> dict[str, t.Any]:
        print("Running pdf check")
        return { }


async def main():
    wf = Wf.model_validate(data)
    workflow = to_chains_workflow(wf)
    print(json.dumps(workflow, indent=1))

    # chain, payload = Chain.from_dict(workflow)

    # await chain.run({})


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
