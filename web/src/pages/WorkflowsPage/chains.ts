// import { Edge, Node } from "@xyflow/react";



interface Node<T = any> {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: T;
}


interface Edge {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
}

const NODES: Node[] = [
    {
        id: "1",
        type: "data",
        position: {
            x: 0,
            y: 0
        },
        data: {
            content: "Hello"
        }
    },
    {
        id: "2",
        type: "method",
        position: {
            x: 0,
            y: 0
        },
        data: {
            name: "generate",
            outputs: [
                {
                  name: "content"
                }
            ]
        }
    },
    {
        id: "3",
        type: "method",
        position: {
            x: 0,
            y: 0
        },
        data: {
          name: "summary",
          inputs: [
              {
                name: "text"
              }
          ],
          outputs: [
              {
                name: "content"
              }
          ],
        }
    }
]

const EDGES: Edge[] = [
  {
      id: "1",
      source: "1",
      sourceHandle: "content",
      target: "2",
      targetHandle: "task",
  },
  {
      id: "2",
      source: "2",
      sourceHandle: "content",
      target: "3",
      targetHandle: "text",
  },
]


export interface HandleContext {
    chain: Chain,
    edges: Edge[],
    resolvedInputs: {
      [key: string]: string;
    }
}


interface Chain {
    steps: {
      [key: string]: {
        method: string;
        inputs: {
          [key: string]: {
            $ref: string;
          }
        },
        outputs: {
          [key: string]: null;
        }
      }
    },
    payload: {
      [key: string]: any;
    },
    returns: {
      [key: string]: string;
    }
}

type MethodData = {
  name: string;
  inputs: {
    name: string
  }[];
  outputs: {
    name: string
  }[];
}

type HandlerFn<T> = (n: Node<T>, ctx: HandleContext) => {
  [key: string]: string;
}

const HANDLERS: { [key: string]: HandlerFn<any> } = {
  data: (n: Node, ctx: HandleContext) => {
    const k = `${n.id}.content`;
    ctx.chain.payload[k] = n.data.content;
    return {
      [k]: `#/payload/${k}`
    }
  },
  method: (n: Node<MethodData>, ctx: HandleContext) => {
    const {edges, chain, resolvedInputs} = ctx;
    // Assume that all
    const inputs: { [key: string]: any } = {}

    for (let e of edges) {
      if (e.target == n.id) {
        const k = `${e.source}.${e.sourceHandle}`;
        if (e.targetHandle)
            inputs[e.targetHandle] = {
              $ref: resolvedInputs[k]
            }
        else
            throw new Error("Edge targetHandle === null")
      }
    }
    
    const outputs = n.data.outputs.reduce((acc, o) => {
      acc[o.name] = null;
      return acc
    }, {});

    chain.steps[n.id] = {
      method: n.data.name,
      inputs,
      outputs,
    }

    const resolvedOutputs = n.data.outputs.reduce((acc, o) => {
      acc[`${n.id}.${o.name}`] = `#/steps/${n.id}/${o.name}`
      return acc
    }, {} as { [key: string]: string });

    return resolvedOutputs;
  }
}

export const registerHandler = (type: string, fn: HandlerFn<any>) => {
  HANDLERS[type] = fn;
}

type ContextData = {
  id: string;
};

registerHandler("context", (n: Node<ContextData>, ctx: HandleContext) => {
  const k = `${n.id}.content`;
  ctx.chain.payload[k] = "# Hello, world!";
  return {
    [k]: `#/payload/${k}`
  }
});





// Add node related configuration
// to chain

// Provide outputs references

function findAllowedNode(
  nodesToEdges: Map<string, Edge[]>,
  resolvedInputs: { [key: string]: string },
  resolvedNodes: Set<string>,
  nodeById: Map<string, Node>
) {
  console.log(resolvedInputs)
  for (let [nId, edges] of nodesToEdges) {
    if (resolvedNodes.has(nId))
      continue
    for (let e of edges) {
      if (e.target === nId) {
        if (!resolvedInputs[`${e.source}.${e.sourceName}`]) {
          continue
        }
      }
    }
    return nodeById.get(nId);
 }
}

Map.prototype.getOrCreate = function(k, d) {
  if (!this.has(k)) {
    this.set(k, d);
  }
  return this.get(k);
}

export function buildChain(nodes: Node[], edges: Edge[]) {
  const resolvedInputs = {};
  const resolvedNodes = new Set<string>();
  const nodeById = new Map<string, Node>(
    nodes.map(n => [n.id, n])
  );
  const chain = {
    steps: {},
    payload: {},
  }
  const nodesToEdges = new Map();
  for (let e of edges) {
    nodesToEdges
    .getOrCreate(e.source, [])
    .push(e);
    
    nodesToEdges
    .getOrCreate(e.target, [])
    .push(e);
  }
  
  while (1) {
    const node = findAllowedNode(
      nodesToEdges,
      resolvedInputs,
      resolvedNodes,
      nodeById
    );
    if (!node || !node.type)
      break;
    const h = HANDLERS[node.type]
    if (!h) {
      console.log("no h")
    }
    const ctx = {
      chain,
      edges: nodesToEdges.get(node.id),
      resolvedInputs
    }
    const outputs = h(node, ctx);
    // console.log("<---- ---- ---- ----")
    console.log(JSON.stringify(chain, null, 2))
    // console.log(node, outputs, chain)
    // console.log("---- ---- ---- ---->")
    Object.assign(resolvedInputs, outputs)
    resolvedNodes.add(node.id);
  }


  const returns = {};
  for (let [stepId, step] of Object.entries(chain.steps)) {
    for (let [output, _] of Object.entries(step.outputs)) {
      returns[`${stepId}.output`] = {
        $ref: `#/steps/${stepId}/outputs/${output}`
      };
    }
  }

  chain.returns = returns;

  return chain;
}


// buildChain(NODES, EDGES)

