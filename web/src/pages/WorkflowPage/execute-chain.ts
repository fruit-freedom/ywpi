import { Edge, Node } from "@xyflow/react"
import { Workflow } from "../../entities/workflow/api"
import { MethodWithAgentId } from "../../pages/ProjectPage/store/methods";

interface NodesEdges {
    nodes: Node[];
    edges: Edge[];
}

export function toChain(wf: NodesEdges, methods: MethodWithAgentId[]) {
    const nodeToEdges: Map<string, Edge[]> = new Map();

    const nodes = new Map(wf.nodes.map(e => [e.id, e]));

    const registeredMethod = new Map(methods.map(e => [`${e.agentId}/${e.name}`, e]));

    wf.edges.forEach(e => {
        const sourceEdges = nodeToEdges.get(e.source);
        sourceEdges ? sourceEdges.push(e) : nodeToEdges.set(e.source, [e]);

        const targetEdges = nodeToEdges.get(e.target);
        targetEdges ? targetEdges.push(e) : nodeToEdges.set(e.target, [e]);
    })

    const returns = {}
    const payload: { [key: string]: any } = {}
    const steps: any = {}


    for (let node of wf.nodes) {
        const nodeId = node.id;
        const edges = nodeToEdges.get(nodeId) || [];

        if (node.type === "data") {
            // Fill payload
            payload[`${nodeId}.content`] = node.data.content;
            continue;
        }

        const inputs: { [key: string]: any; } = {};
        for (let e of edges) {
            if (e.target != nodeId) continue;
            if (!e.targetHandle) continue;

            let from_ref: string;
            if (nodes.get(e.source)?.type == "data")
                from_ref = `#/payload/${e.source}.${e.sourceHandle}`;
            else
                from_ref = `#/steps/${e.source}/outputs/${e.sourceHandle}`;

            inputs[e.targetHandle] = {
                "$ref": from_ref
            };
        }

        if (node.type === "agentTask") {
            // Fill payload
            payload[`${nodeId}.content`] = node.data.content;
            inputs["task"] = {
                "$ref": `#/payload/${nodeId}.content`
            };
        }

        const method = registeredMethod.get(node.data.name);
        if (!method)
            throw new Error("method does not exists")

        const outputs = Object.fromEntries(method.outputs.map(e => [e.name, null]));
        Object.assign(
            returns,
            Object.fromEntries(method.outputs.map(e => [
                `${nodeId}.${e.name}`,
                {
                    $ref: `#/steps/${nodeId}/outputs/${e.name}`
                }
            ]))
        )

        const step = {
            "method": node.data.name,
            "inputs": inputs,
            "outputs": outputs
        }

        steps[nodeId] = step
    }

    console.log({steps, payload, returns});
    return {
        steps,
        payload,
        returns
    };
}
