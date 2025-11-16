import { $applyNodeReplacement, $createTextNode, DecoratorNode, EditorConfig, SerializedLexicalNode, SerializedTextNode, TextNode } from "lexical";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { navigateRef } from "../../../navigate";
import { Box } from "@mui/material";
import { Context, getContext } from "../../../api/context";

// interface SerializedContextLinkNode extends SerializedTextNode {
//     contextId: string;
// }

// export class ContextLinkNode extends TextNode {
//     __contextId: string;

//     constructor(text: string, contextId: string, key?: string) {
//         super(text, key);
//         this.__contextId = contextId;
//         console.log("Creating context link node", contextId)
//     }

//     static getType(): string {
//         return "context_link";
//     }

//     static clone(node: ContextLinkNode): ContextLinkNode {
//         return new ContextLinkNode(node.__text, node.__contextId, node.__key);
//     }

//     createDOM(config: EditorConfig): HTMLElement {
//         const box = document.createElement("div");
//         box.style.color = 'green';
//         box.style.fontWeight = "700";
//         box.style.height = "70px";
//         box.style.display = "inline-block";
//         box.style.border = "1px solid lightgrey";
//         box.style.borderRadius = "4px";
//         box.style.cursor = "pointer";
//         box.style.padding = "8px";
//         box.innerText = "Поиск в найденном";

//         box.onclick = () => {
//             navigateRef(`/projects/68f66b3f92d299ea6d543a8e/contexts/${this.__contextId}`);
//         }

//         return box;
//     }

//     static importDOM(): any | null {
//         return TextNode.importDOM();
//     }

//     static importJSON(serializedNode: SerializedContextLinkNode): ContextLinkNode {
//         return new ContextLinkNode(serializedNode.text, serializedNode.contextId);
//     }

//     exportJSON(): SerializedContextLinkNode {
//         return {
//             ...super.exportJSON(),
//             contextId: this.__contextId
//         }
//     }
// }




interface SerializedContextLinkNode extends SerializedLexicalNode {
    contextId: string;
}

const View = ({ contextId }: { contextId: string }) => {
    const navigate = useNavigate();
    const [context, setContext] = useState<Context>();
    const { projectId } = useParams();


    useEffect(() => {
        getContext(projectId, contextId)
        .then(e => setContext(e))        
    }, []);

    return (
        <Box
            onClick={() => {
                navigate(`/projects/68f66b3f92d299ea6d543a8e/contexts/${contextId}`);
            }}
            sx={{
                color: "000",
                fontWeight: 700,
                padding: "8px",
                cursor: "pointer",
                display: "inline-block",
                border: "1px solid lightgrey",
                "&:hover": {
                    backgroundColor: "lightgray"
                }
            }}
        >
            {context ? context.name : contextId}
        </Box>
    );
}

export class ContextLinkNode extends DecoratorNode<ReactNode> {
    __contextId: string;

    constructor(contextId: string, key?: string) {
        super(key);
        this.__contextId = contextId;
        console.log("Creating context link node", contextId)
    }

    static getType(): string {
        return "context_link";
    }

    static clone(node: ContextLinkNode): ContextLinkNode {
        return new ContextLinkNode(node.__contextId, node.__key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const box = document.createElement("div");
        return box;
    }

    // static importDOM(): any | null {
    //     return TextNode.importDOM();
    // }

    static importJSON(serializedNode: SerializedContextLinkNode): ContextLinkNode {
        return new ContextLinkNode(serializedNode.contextId);
    }

    decorate(): ReactNode {
        return <View contextId={this.__contextId} />;
        
    }

    updateDOM(): false {
        return false;
    }

    exportJSON(): SerializedContextLinkNode {
        return {
            type: "context_link",
            version: 1,
            contextId: this.__contextId
        }
    }
}

export const TRANSFORMS = [
    {
        type: TextNode,
        fn: (textNode: TextNode) => {
            const content = textNode.getTextContent();

            const regex = /#\w+\s/;
            const match = content.match(regex);
            if (match?.index !== undefined) {
                const before = content.substring(0, match.index);
                const after = content.substring(match.index);

                // const executionNode = new ContextLinkNode(after, after.substring(1));
                const executionNode = $applyNodeReplacement(new ContextLinkNode(after.substring(1)));

                textNode.setTextContent(before);
                textNode.insertAfter(executionNode);
                const next = $createTextNode(" ");
                executionNode.insertAfter(next);
                next.selectNext();
            }
        }
    }
]