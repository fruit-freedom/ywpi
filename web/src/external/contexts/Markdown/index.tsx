import { ForwardedRef, forwardRef, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Box, Button, Divider, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";

import {$applyNodeReplacement, $createRangeSelection, $getNodeByKey, $getRoot, $getSelection, $setSelection, EditorConfig, LexicalEditor, LexicalNode, LineBreakNode, ParagraphNode, SerializedEditor, SerializedEditorState, SerializedTextNode, TextNode} from 'lexical';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS
} from '@lexical/markdown';
import { $createTextNode, $insertNodes, $createParagraphNode, $isRangeSelection, $parseSerializedNode } from 'lexical';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import "./index.css"
import { ContextProps } from "../../../pages/ContextPage/types";
import { AgentStatus, useEvents } from "../../../hooks/useEvents";


interface Selection {
    nodes: any;
    text: string;
}

interface ContentAccessRef {
    getContent: () => string;
    setContent: (value: string) => void;
    getTree: () => SerializedEditorState;
    applyUpdate: (update: any, path: number[]) => void;
    getSelectionText: () => string | undefined;
    getSelection: () => Selection | undefined;
}

const getNode = (node: LexicalNode, path: number[]) => {
    for (let i = 0; i < path.length; ++i) {
        const index = path[i];
        const children: LexicalNode[] = node.getChildren();

        // console.log("|", i, index, children)
        if (index >= children.length)
            throw new Error("No children")

        node = children[index];
    }

    return node;
}

const getNodePath = (node: LexicalNode | null) => {
    let path = [];
    let current = node;

    while (true) {
        if (current === null || current.__parent === null)
            break

        path.push(current.getIndexWithinParent());
        current = $getNodeByKey(current.__parent)
    }

    return "tree.root." + path.reverse().map(e => `children.${e}`).join(".")
}

const ContetnAcessPlugin = forwardRef(function ContentAccessPlugin(props, ref: ForwardedRef<ContentAccessRef>) {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(ref, () => {
        return {
            getContent: () => {
                const content = editor.read(() => {
                    return $convertToMarkdownString(TRANSFORMERS);
                });
                return content;
            },
            getTree: () => {
                return editor.read(() => {
                    // return editor.toJSON();
                    return editor.getEditorState().toJSON();
                });
            },
            setContent: (value: string) => {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    $convertFromMarkdownString(value, TRANSFORMERS);
                });
            },
            applyUpdate: (update: any, path: number[]) => {
                console.log("Apply update ...", update, path)
                editor.update(() => {
                    const root = $getRoot();
                    const targetNode = getNode(root, path);

                    const node = $parseSerializedNode(update);
                    targetNode.insertAfter(node);
                    // root.append(node);
                })
            },
            getSelectionText: () => {
                return editor.read(() => {
                    const selection = $getSelection();
                    if (selection) {
                        console.log(selection.getNodes(), selection.getNodes().map(node => getNodePath(node)))
                        const selectedText = selection.getTextContent();
                        return selectedText;
                    }
                });
            },
            getSelection: () => {
                return editor.read(() => {
                    const selection = $getSelection();
                    if (selection) {
                        console.log(selection.getNodes(), selection.getNodes().map(node => getNodePath(node)))

                        const nodes = selection.getNodes().reduce((acc: any, cur: LexicalNode) => {
                            acc[getNodePath(cur)] = cur.exportJSON();
                            return acc;
                        }, {});
                        const text = selection.getTextContent();

                        console.log({ nodes, text });
                        return {
                            nodes,
                            text
                        };
                    }
                });
            }
        }
    }, [editor]);

    // editor.registerUpdateListener(({ editorState }) => {
    //     console.log(editorState.toJSON());
    // });

    return null;
})




const InsertPlugin = () => {
    const [editor] = useLexicalComposerContext();

    const ref = useRef(null);

    useEffect(() => {
        const onKeyDown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
                e.preventDefault();

                editor.update(() => {
                    // const root = $getRoot();
                    // const nodes = root.getChildren();

                    // const childs = nodes[0].getChildren() as LexicalNode[];
                    // // root.insertAfter()

                    // // console.log("Node", getNode(root, [2, 0]));
                    // // const node = getNode(root, [2, 0]);
                    // // node.insertAfter($createTextNode("Hi"));

                    // const n = $parseSerializedNode({
                    //     "children": [
                    //         {
                    //             "detail": 0,
                    //             "format": 0,
                    //             "mode": "normal",
                    //             "style": "",
                    //             "text": "Необходимо дополнить сайд бар новой вкладкой - Поиск",
                    //             "type": "text",
                    //             "version": 1
                    //         }
                    //     ],
                    //     "direction": null,
                    //     "format": "",
                    //     "indent": 0,
                    //     "type": "paragraph",
                    //     "version": 1,
                    //     "textFormat": 0,
                    //     "textStyle": ""
                    // });
                    // root.append(n);


                    // const paragraph = $createParagraphNode();
                    // paragraph.append($createTextNode("Ctrl+S"));
                    // root.append(paragraph);
                });
                // editor.update(() => {
                //     const p = $createParagraphNode();
                //     p.append($createTextNode("**Agent** response"))
                //     $insertNodes([p]);
                // });

            }
        }
        document.addEventListener("keydown", onKeyDown);

        const onKeyUp = (e: any) => { }
        document.addEventListener("keyup", onKeyUp);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        }
    }, []);

    useEffect(() => {
        // return editor.registerUpdateListener(({editorState}) => {
        //     console.log("STATE", editorState)
        //     editor.read(() => {
        //         const selection = $getSelection();
        //         const nodes = selection?.getCachedNodes();

        //         if ($isRangeSelection(selection) && nodes) {
        //             // Get the node at the anchor of the selection (or any other desired node)
        //             const existingNode = selection.anchor.getNode(); 
        //             console.log("existingNode", existingNode)
        //             // // Create the new node to insert
        //             // const newNode = $createParagraphNode().append($createTextNode('This is a new paragraph.'));

        //             // // Insert the new node after the existing node
        //             // existingNode.insertAfter(newNode);
        //         }
        //     });
        // });


        editor.registerNodeTransform(TextNode, textNode => {
            const content = textNode.getTextContent();

            const regex = /@\w+\s/;
            const match = content.match(regex);
            if (match?.index !== undefined) {
                const before = content.substring(0, match.index);
                const after = content.substring(match.index);

                const executionNode = new ExecutionNode(after, uuidv4());

                textNode.setTextContent(before);
                textNode.insertAfter(executionNode);
                const next = $createTextNode(" ");
                executionNode.insertAfter(next);
                next.selectNext()
                // executionNode.selectNext()

                // textNode.remove();


                // textNode.replace(executionNode);


                // const next = $createTextNode("")
                // executionNode.insertAfter(next);
                
                // $setSelection(next.selectEnd());



                // const selection = $getSelection();
                // console.log($getNodeByKey(selection.anchor.key))

                // textNode.insertBefore(executionNode);
                // textNode.setTextContent("");
                // textNode.replace(executionNode);

                // executionNode.insertAfter(new LineBreakNode());
                // textNode.setTextContent("ab");
            }
        })

        return editor.registerMutationListener(ParagraphNode, (nodes, payload) => {
            console.log(nodes, payload)
        }, { skipInitialization: true })
    }, [editor, ref]);

    return null;
}

interface EditorProps {
    defaultValue?: string;
    defaultTree?: any;
    ref?: RefObject<ContentAccessRef>;
}

import { v4 as uuidv4 } from 'uuid';
import { Markdown } from "../../../components/Markdown";
import { useAgents } from "../../../store/store";
import { executeMethodAsync } from "../../../api";
import { getIngestedMethods_V2 } from "./methodsFilters";

class ExtendedTextNode extends TextNode {
    __uuid: string;

    constructor(text: string, uuid: string, key?: string) {
        super(text, key);
        this.__uuid = uuid;
        console.log("Creating", uuid)
    }

    static getType(): string {
        return "text_uuid";
    }

    static clone(node: ExtendedTextNode): TextNode {
        return new ExtendedTextNode(node.__text, node.__uuid, node.__key);
    }

    static importDOM(): DOMConversionMap | null {
        return TextNode.importDOM();
    }

    static importJSON(serializedNode: SerializedTextNode): TextNode {
        return new ExtendedTextNode(serializedNode.text, serializedNode.uuid);
    }

    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            uuid: this.__uuid
        }
    }

    // Override methods like isBackward, etc.
}

class ExecutionNode extends TextNode {
    __uuid: string;

    constructor(text: string, uuid: string, key?: string) {
        super(text, key);
        this.__uuid = uuid;
        console.log("Creating execution node", uuid)
    }

    static getType(): string {
        return "execution";
    }

    static clone(node: ExecutionNode): ExecutionNode {
        return new ExecutionNode(node.__text, node.__uuid, node.__key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const d = super.createDOM(config)

        const label = document.createElement("span");
        label.innerText = this.__uuid;
        label.style.fontSize = '12px';
        label.style.fontWeight = "400";
        label.style.position = "absolute";
        label.style.width = "max-content";
        label.style.left = "0";
        label.style.bottom = "100%";
        label.style.color = "grey";
        label.style.userSelect = "none";

        // d.appendChild(label);
        d.style.color = 'red';
        d.style.fontWeight = "700";
        d.style.position = "relative";
        return d;
    }

    static importDOM(): any | null {
        return TextNode.importDOM();
    }

    static importJSON(serializedNode: any): ExecutionNode {
        return new ExecutionNode(serializedNode.text, serializedNode.uuid);
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            uuid: this.__uuid
        }
    }

    // Override methods like isBackward, etc.
}

/*
Implement document page @task

*/

class ExtendedParagraphNode extends ParagraphNode {
    __uuid: string;

    constructor(uuid: string, key?: string) {
        super(key);
        this.__uuid = uuid;
        console.log("Creating p", uuid)
    }

    static getType(): string {
        return "paragraph-uuid";
    }

    static clone(node: ExtendedParagraphNode): ExtendedParagraphNode {
        return new ExtendedParagraphNode(node.__uuid, node.__key);
    }

    static importDOM(): any {
        return ParagraphNode.importDOM();
    }

    static importJSON(serializedNode: any): ExtendedParagraphNode {
        return new ExtendedParagraphNode(serializedNode.uuid);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const d = super.createDOM(config)
        d.style.backgroundColor = '#fafafa';
        d.style.borderRadius = "4px";
        d.style.padding = "4px";
        d.style.margin = "8px";
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

const Editor = forwardRef(function Editor(props: EditorProps, ref: ForwardedRef<ContentAccessRef>) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: {
            paragraph: 'editor-paragraph',
            code: 'editor-code',
        },
        onError: console.error,
        nodes: [
            ExtendedTextNode,
            // {
            //     replace: TextNode, // The default node to replace
            //     with: (node: TextNode) => new ExtendedTextNode(node.__text, uuidv4()), // How to create your custom node instance
            //     withKlass: ExtendedTextNode, // The custom class to use
            // },
            // ExtendedParagraphNode,
            // {
            //     replace: ParagraphNode, // The default node to replace
            //     with: (node: ParagraphNode) => new ExtendedParagraphNode(uuidv4()), // How to create your custom node instance
            //     withKlass: ExtendedParagraphNode, // The custom class to use
            // },
            LinkNode,
            AutoLinkNode,
            ListNode,
            ListItemNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            HorizontalRuleNode,
            CodeNode,
            HeadingNode,
            QuoteNode,
            ExecutionNode
        ],
        editorState: (editor: LexicalEditor) => {
            if (props.defaultTree) {
                const state = editor.parseEditorState(props.defaultTree);
                editor.setEditorState(state);
                return state;
            }
            else {
                $convertFromMarkdownString(props.defaultValue || "", TRANSFORMERS);
            }
        },
    };

    const contentRef = useRef<ContentAccessRef>(null);
    useImperativeHandle(ref, () => contentRef.current, [contentRef]);



    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
                contentEditable={
                    <ContentEditable
                        className="md-context-content-editable"
                    />
                }
                ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ContetnAcessPlugin ref={contentRef}/>
            <InsertPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <TabIndentationPlugin />
        </LexicalComposer>
    );
})

const EditableMarkdown = forwardRef(function Editor(props: EditorProps, ref: ForwardedRef<ContentAccessRef>) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: {
            paragraph: 'editor-paragraph',
            code: 'editor-code',
        },
        onError: console.error,
        nodes: [
            ExtendedTextNode,
            LinkNode,
            AutoLinkNode,
            ListNode,
            ListItemNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            HorizontalRuleNode,
            CodeNode,
            HeadingNode,
            QuoteNode,
            ExecutionNode
        ],
        editorState: (editor: LexicalEditor) => {
            if (props.defaultTree) {
                const state = editor.parseEditorState(props.defaultTree);
                editor.setEditorState(state);
                return state;
            }
            else {
                $convertFromMarkdownString(props.defaultValue || "", TRANSFORMERS);
            }
        },
    };

    const contentRef = useRef<ContentAccessRef>(null);
    useImperativeHandle(ref, () => contentRef.current, [contentRef]);

    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
                e.preventDefault();
                e.stopPropagation();

                // applyContextUpdate({
                //     $set: {
                //         content: editorRef.current?.getContent(),
                //         tree: editorRef.current?.getTree()
                //     }
                // })

                // console.log(editorRef.current?.getTree())
                console.log("Save related")
            }
        }

        if (divRef.current)
            divRef.current.addEventListener("keydown", onKeydown);

        return () => divRef.current ? divRef.current.removeEventListener("keydown", onKeydown) : undefined;
    }, [divRef]);

    return (
        <div ref={divRef}>
            <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="md-context-content-editable"
                        />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <TabIndentationPlugin />
            </LexicalComposer>
        </div>
    );
})

interface State {
    content?: string;
    tree?: any;
    actions?: {
        id: string;
        content: string;
    }[];
}

const mockEvent = {
    "children": [
        {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Agent response",
            "type": "text",
            "version": 1
        }
    ],
    "direction": null,
    "format": "",
    "indent": 0,
    "type": "paragraph",
    "version": 1,
    "textFormat": 0,
    "textStyle": ""
}


export const MarkdownContext = ({ data, applyContextUpdate, contextId, forceContextRefetch }: ContextProps<State>) => {
    const editorRef = useRef<ContentAccessRef>(null);

    const { } = useEvents({
        onEvent: (e) => {
            if (e.type === "task.updated") {
                if (e.data.outputs) {
                    const outputs = e.data.outputs;
                    if (outputs.type === "ContextUpdate") {
                        const $push = outputs.data.update.$push;
                        Object.entries($push).forEach((entry) => {
                            const [key, value] = entry;
                            if (key.startsWith("tree.root")) {
                                const path = key
                                    .split(".")
                                    .slice(2)
                                    .filter(e => e !== "children")
                                    .map(e => Number(e));

                                let update = null;
                                if (value.$each !== undefined && value.$position !== undefined) {
                                    path.push(value.$position - 1);
                                    update = value.$each[0];
                                }
                                else
                                    throw new Error("not implemented");

                                editorRef.current?.applyUpdate(update, path);
                            }
                            else if (key == "actions") {
                                forceContextRefetch()
                            }
                        });
                    }
                }
            }
        }
    });

    const { agents } = useAgents();

    const [env, setEnv] = useState(() => new Map());

    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; } | null>(null);
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();

        setContextMenu(
            contextMenu === null
                ? {
                    mouseX: event.clientX + 2,
                    mouseY: event.clientY - 6,
                }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                // Other native context menus might behave different.
                // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                null,
        );
        setEnv(new Map([
            ["Selection", editorRef.current?.getSelection()],
            ["ContextId", {
                id: contextId
            }]
        ]));

        const selection = document.getSelection();
            if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            setTimeout(() => {
                selection.addRange(range);
            });
        }
    };

    const handleClose = () => {
        setContextMenu(null);
    };

    const actionsRef = useRef(null);

    useEffect(() => {
        const onKeydown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
                e.preventDefault();

                applyContextUpdate({
                    $set: {
                        content: editorRef.current?.getContent(),
                        tree: editorRef.current?.getTree()
                    }
                })

                console.log(editorRef.current?.getTree())
            }
            else if ((e.ctrlKey || e.metaKey) && e.keyCode === 77) { // Ctrl + M
                handleContextMenu(e)
            }
            else if ((e.ctrlKey || e.metaKey) && e.keyCode === 79) { // Ctrl + O
                e.preventDefault();
            }
        }
        document.addEventListener("keydown", onKeydown);

        return () => document.removeEventListener("keydown", onKeydown);
    }, [actionsRef]);


    return (
        <Stack gap={1} padding={1} direction={'row'} justifyContent={'space-between'}>
            <div onContextMenu={handleContextMenu} style={{ width: "100%" }}>
                <Box flexGrow={1}>
                    <Editor
                        ref={editorRef}
                        defaultValue={data.content}
                        defaultTree={data.tree}
                    />
                </Box>
                <Menu
                    open={contextMenu !== null}
                    onClose={handleClose}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                            : undefined
                    }
                >
                    {
                        // agents
                        // .filter(e => e.status === AgentStatus.Connected)
                        // .reduce((acc: any[], cur) => {
                        //     const methods = cur.methods.filter(e => e.inputs.length === 2 && e.inputs[1]?.type.name === "str")
                        //     acc.push(...methods.map(e => ({
                        //         agentId: cur.id,
                        //         methodName: e.name,
                        //         inputName: e.inputs.find(e => e.type.name === "str" && e.name !== "context_id")?.name
                        //     })));
                        //     return acc;
                        // }, [])
                        getIngestedMethods_V2(agents, env).map(e => (
                            <MenuItem
                                key={e.name}
                                onClick={() => {
                                    e.method();
                                    // getIngestedMethods_V2(agents, new Map<string, any>([
                                    //     ["ContextId", contextId],
                                    //     ["Selection", {}]
                                    // ]));

                                    // const text = editorRef.current?.getSelectionText();
                                    // if (text) {
                                    //     executeMethodAsync(e.agentId, e.methodName, {
                                    //         [e.inputName]: text,
                                    //         context_id: contextId
                                    //     })
                                    // }
                                    setContextMenu(null);
                                }}
                            >
                                {e.name}
                            </MenuItem>
                        ))
                    }
                </Menu>
            </div>
            <Stack width={'500px'} gap={4} borderLeft={'1px solid lightgrey'} padding={1}>
                {
                    data.actions?.map((e, idx) => (
                        <Paper key={e.id} sx={{ padding: 1 }} elevation={4}>
                            <Stack gap={1}>
                                {/* <Markdown>{e.content}</Markdown> */}
                                <EditableMarkdown defaultValue={e.content}/>
                                {/* <Divider />
                                <Typography variant="caption">{e.id}</Typography>
                                <Button
                                    size="small"
                                    variant="contained"
                                >
                                    Apply
                                </Button> */}
                            </Stack>
                        </Paper>
                    ))
                }
            </Stack>
        </Stack>
    )
};