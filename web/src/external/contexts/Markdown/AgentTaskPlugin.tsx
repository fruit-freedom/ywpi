import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createLineBreakNode, $createTextNode, $getRoot, $getSelection, EditorConfig, ParagraphNode } from "lexical";
import { ForwardedRef, forwardRef, useImperativeHandle } from "react";

export class TaskNode extends ParagraphNode {
    __description: string;

    constructor(description: string, key?: string) {
        super(key);
        this.__description = description;
    }

    static getType(): string {
        return "task";
    }

    static clone(node: TaskNode): TaskNode {
        return new TaskNode(node.__description, node.__key);
    }

    static importDOM(): any {
        return ParagraphNode.importDOM();
    }

    static importJSON(serializedNode: any): any {
        return new TaskNode(serializedNode.description);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const d = super.createDOM(config)
        d.className = "execution_node";
        return d;
    }
    
    exportJSON(): any {
        return {
            ...super.exportJSON(),
            uuid: this.__description
        }
    }

    // Override methods like isBackward, etc.
}

function $createTaskNode(description: string): TaskNode {
    return new TaskNode(description);
}

export interface AgentTaskResult {
    result?: string;
}

export interface AgentTaskPluginRef {
    insertAgentTask: (text: string, result: Promise<AgentTaskResult>) => void;
}

export const AgentTaskPlugin =
forwardRef(function ContentAccessPlugin(props: any, ref: ForwardedRef<AgentTaskPluginRef>) {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(ref, () => {
        return {
            insertAgentTask: (description: string, result: Promise<AgentTaskResult>) => {
                editor.update(() => {
                    const selection = $getSelection();
                    const taskNode = $createTaskNode(description)

                    $getRoot().append(taskNode);
                    taskNode.append($createTextNode(description));
                    taskNode.append($createLineBreakNode());
                    taskNode.append($createTextNode("Generating ..."));
                    taskNode.append($createLineBreakNode());

                    result.then(e => {
                        editor.update(() => {
                            taskNode.getLatest().append($createTextNode(e.result))
                        })
                    })
                    .catch(e => {
                        editor.update(() => {
                            taskNode.getLatest().append($createTextNode(`Error: ${e}`))
                        })
                    })
                })
            },
        }
    }, [editor]);

    return null;
})

