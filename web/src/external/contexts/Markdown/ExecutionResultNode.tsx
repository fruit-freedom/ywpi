import { EditorConfig, ParagraphNode } from "lexical";

class ExecutionResultNode extends ParagraphNode {
    __uuid: string;

    constructor(uuid: string, key?: string) {
        super(key);
        this.__uuid = uuid;
        console.log("Creating p", uuid)
    }

    static getType(): string {
        return "execution_result";
    }

    static clone(node: ExecutionResultNode): ExecutionResultNode {
        return new ExecutionResultNode(node.__uuid, node.__key);
    }

    static importDOM(): any {
        return ParagraphNode.importDOM();
    }

    static importJSON(serializedNode: any): ExecutionResultNode {
        return new ExecutionResultNode(serializedNode.uuid);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const d = super.createDOM(config)
        // d.style.backgroundColor = 'lightgrey';
        // d.className = "execution_node"
        // d.style.color = 'grey';
        // d.style.borderRadius = "4px";
        // d.style.padding = "4px";
        // d.style.margin = "8px";
        // d.innerText = this.__uuid;
//         d.innerHTML = `
// <div class="execution_node">
// <div>Create web task for this #142</div>
// <div class="execution_node-loader">Generating</div>
// </div>
//         `
        d.className = "execution_node";
        return d;
    }
    
    exportJSON(): any {
        return {
            ...super.exportJSON(),
            uuid: this.__uuid
        }
    }

    // Override methods like isBackward, etc.
}

export default ExecutionResultNode;
