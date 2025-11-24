import { ForwardedRef, forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Box, Button, Divider, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";

import {$getNodeByKey, $getRoot, $getSelection, EditorConfig, LexicalEditor, LexicalNode, ParagraphNode, SerializedEditorState, TextNode} from 'lexical';
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
import { $createTextNode, $isRangeSelection, $parseSerializedNode } from 'lexical';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import "./index.css"
import { ContextProps } from "../../../pages/ContextPage/types";
import { useEvents } from "../../../hooks/useEvents";
import { v4 as uuidv4 } from 'uuid';
import { useAgents } from "../../../store/store";
import { getIngestedMethods_V2, ingestMethod, MethodWithAgent } from "./methodsFilters";
import { ContextLinkNode, TRANSFORMS } from "./ContextLinkNode";
import AgentTaskInputModal from "./AgentTaskInputModal";
import ExecutionResultNode from "./ExecutionResultNode";
import { AutocompleteNode, AutocompletePlugin, AutocompletePluginRef, CompletitionFnOutputs } from "./AutocompletePlugin";
import UserPresets from "../../../shared/UserPresets";
import { useUserPresets } from "../../../shared/UserPresets/store";
import { AgentTaskPlugin, AgentTaskPluginRef, AgentTaskResult, TaskNode } from "./AgentTaskPlugin";


interface Selection {
    nodes: any;
    text: string;
}

interface ContentAccessRef {
    getContent: () => string;
    setContent: (value: string) => void;
    setTree: (value: any) => void;
    insertNode: (serializedNode: any) => void;
    getTree: () => SerializedEditorState;
    applyUpdate: (update: any, path: number[]) => void;
    getSelectionText: () => string | undefined;
    getSelection: () => Selection | undefined;
}

const getNode = (node: LexicalNode, path: number[]) => {
    for (let i = 0; i < path.length; ++i) {
        const index = path[i];
        const children: LexicalNode[] = node.getChildren();

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
            insertNode: (serializedNode: any) => {
                let returnValue = null;
                const setReturnValue = (v: any) => returnValue = v;

                editor.update(() => {
                    const node = $parseSerializedNode(serializedNode);
                    // Execution result node
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        const anchor = $getNodeByKey(selection.anchor.key);
                        if (anchor?.getType() != "paragraph") {
                            const insertedNode = anchor?.insertAfter(node);
                            setReturnValue(insertedNode)
                        }
                        else {
                            anchor?.append(node);
                        }
                    }

                })
            },
            getContent: () => {
                const content = editor.read(() => {
                    return $convertToMarkdownString(TRANSFORMERS);
                });
                return content;
            },
            getTree: () => {
                return editor.read(() => {
                    // const selection = $getSelection();
                    // console.log("selection", selection);
                    // if (selection) {
                    //     const anchor = $getNodeByKey(selection.anchor.key);
                    //     console.log(anchor?.getParent()?.getTextContent())
                    // }
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
            setTree: (value: any) => {
                editor.update(() => {
                    const state = editor.parseEditorState(value);
                    editor.setEditorState(state);
                });
            },
            applyUpdate: (update: any, path: number[]) => {
                console.log("Apply update ...", update, path)
                editor.update(() => {
                    const root = $getRoot();
                    const node = $parseSerializedNode(update);

                    if (path.length > 0) {
                        const targetNode = getNode(root, path);
                        targetNode.insertAfter(node);
                    }
                    else {
                        root.append(node);
                    }
                })
            },
            getSelectionText: () => {
                return editor.read(() => {
                    const selection = $getSelection();
                    if (selection) {
                        const selectedText = selection.getTextContent();
                        return selectedText;
                    }
                });
            },
            getSelection: () => {
                return editor.read(() => {
                    const selection = $getSelection();
                    if (selection) {
                        // console.log(selection.getNodes(), selection.getNodes().map(node => getNodePath(node)))

                        const anchorNode = $getNodeByKey(selection.anchor.key);

                        const nodes = selection.getNodes().reduce((acc: any, cur: LexicalNode) => {
                            acc[getNodePath(cur)] = cur.exportJSON();
                            return acc;
                        }, {});
                        const text = selection.getTextContent();

                        return {
                            nodes,
                            text,
                            anchor: {
                                ...selection.anchor,
                                key: getNodePath(anchorNode),
                            }
                        };
                    }
                });
            }
        }
    }, [editor]);

    return null;
})

const InsertPlugin = () => {
    const [editor] = useLexicalComposerContext();

    const ref = useRef(null);

    useEffect(() => {
        const onKeyDown = (e: any) => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
                e.preventDefault();
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
                executionNode.insertAfter(new ExecutionResultNode("uuufufufu"))
                executionNode.insertAfter(next);
                next.selectNext()
            }
        })

        const removeTransform = editor.registerNodeTransform(TRANSFORMS[0].type, TRANSFORMS[0].fn);


        /* If user input more than N symbols or paste 1 sec than remove old autocomplete and fetch new */

        const removeMutationListener = editor.registerMutationListener(ParagraphNode, (nodes, payload) => {

        }, { skipInitialization: true })

        return () => {
            removeMutationListener();
            removeTransform();
        }
    }, [editor, ref]);

    return null;
}

interface EditorProps {
    defaultValue?: string;
    defaultTree?: any;
    ref?: RefObject<ContentAccessRef>;
    completitionFn?: () => Promise<CompletitionFnOutputs>;
}


class ExecutionNode extends TextNode {
    __uuid: string;

    constructor(text: string, uuid: string, key?: string) {
        super(text, key);
        this.__uuid = uuid;
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

type EditorRef = ContentAccessRef & AutocompletePluginRef & AgentTaskPluginRef;

const Editor = forwardRef(function Editor(props: EditorProps, ref: ForwardedRef<EditorRef>) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: {
            paragraph: 'editor-paragraph',
            code: 'editor-code',
        },
        onError: console.error,
        nodes: [
            LinkNode,
            AutoLinkNode,
            ListNode,
            ListItemNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            CodeNode,
            HeadingNode,
            QuoteNode,
            ExecutionNode,
            ContextLinkNode,
            ExecutionResultNode,
            AutocompleteNode,
            TaskNode,
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
    const autocompletePluginRef = useRef<AutocompletePluginRef>(null);
    const agentTaskPluginRef = useRef<AgentTaskPluginRef>(null);
    useImperativeHandle(
        ref,
        () => ({...contentRef.current, ...autocompletePluginRef.current, ...agentTaskPluginRef.current}),
        [contentRef, autocompletePluginRef, agentTaskPluginRef]
    );

    useEffect(() => {
        if (contentRef && props.defaultTree)
            contentRef.current?.setTree(props.defaultTree);
    }, [props.defaultTree]);

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
            {
                props.completitionFn ?
                <AutocompletePlugin
                    ref={autocompletePluginRef}
                    completitionFn={props.completitionFn}
                />
                : null
            }
            <AgentTaskPlugin ref={agentTaskPluginRef}/>
        </LexicalComposer>
    );
})

export const EditableMarkdown = forwardRef(function Editor(props: EditorProps, ref: ForwardedRef<ContentAccessRef>) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: {
            paragraph: 'editor-paragraph',
            code: 'editor-code',
        },
        onError: console.error,
        nodes: [
            LinkNode,
            AutoLinkNode,
            ListNode,
            ListItemNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            CodeNode,
            HeadingNode,
            QuoteNode,
            ExecutionNode,
            ExecutionResultNode
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

    // const divRef = useRef<HTMLDivElement>(null);

    // useEffect(() => {
    //     const onKeydown = (e: any) => {
    //         if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // Ctrl + S
    //             e.preventDefault();
    //             e.stopPropagation();
    //         }
    //     }

    //     if (divRef.current)
    //         divRef.current.addEventListener("keydown", onKeydown);

    //     return () => divRef.current ? divRef.current.removeEventListener("keydown", onKeydown) : undefined;
    // }, [divRef]);

    return (
        <div>
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
                <ContetnAcessPlugin ref={contentRef}/>
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

export const MarkdownContext = ({ data, applyContextUpdate, contextId, forceContextRefetch }: ContextProps<State>) => {
    const editorRef = useRef<EditorRef>(null);

    const { } = useEvents({
        onEvent: (e) => {
            if (e.type === "task.updated") {
                if (e.data.outputs) {
                    const outputs = e.data.outputs;
                    if (outputs.type === "ContextUpdate") {
                        const $push = outputs.data.update.$push;
                        console.log("$push", $push);
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
                                else {
                                    console.log("Not impl")
                                    update = value;

                                    // throw new Error("not implemented");
                                }

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

    const [env, setEnv] = useState<Map<string, any>>(() => new Map());

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

        setEnv(new Map<string, any>([
            ["Selection", editorRef.current?.getSelection()],
            ["ContextId", {
                id: contextId
            }],
            ["Context", {
                id: contextId,
                tp: "Markdown",
                data: {
                    tree: editorRef.current?.getTree(),
                    content: editorRef.current?.getContent()
                },
                subscribtions: []
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

    const { completitionMethod, agentTaskMethod } = useUserPresets();

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
            else if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) { // Ctrl + F
                e.preventDefault();
                setAgentTaskModelOpen(prev => !prev);
            }
        }
        document.addEventListener("keydown", onKeydown);

        return () => document.removeEventListener("keydown", onKeydown);
    }, [actionsRef, editorRef]);

    const completitionFn = useCallback<() => Promise<CompletitionFnOutputs>>(() => {
        const localEnv = new Map<string, any>([
            ["Selection", editorRef.current?.getSelection()],
            ["ContextId", {
                id: contextId
            }],
            ["Context", {
                id: contextId,
                tp: "Markdown",
                data: {
                    tree: editorRef.current?.getTree(),
                    content: editorRef.current?.getContent()
                },
                subscribtions: []
            }]
        ]);
        
        return new Promise((resolve, reject) => {
            if (!completitionMethod) {
                reject("autocomplete method not specified");
                return;
            }

            const ingestedMethod = ingestMethod(completitionMethod, localEnv);
            if (ingestedMethod) {
                ingestedMethod.method()
                .then((outputs: CompletitionFnOutputs) => {
                    if (Object.keys(outputs).length > 0)
                        if (typeof outputs.completition == "string")
                            resolve(outputs);

                    reject("outputs has not got text node");
                })
            } else {
                reject("ingested method can not be created");
            }
        });

    }, [completitionMethod]);

    const agentTaskFn = useCallback<(task: string) => Promise<any>>((task: string) => {
        const localEnv = new Map<string, any>([
            ["Selection", editorRef.current?.getSelection()],
            ["ContextId", {
                id: contextId
            }],
            ["Context", {
                id: contextId,
                tp: "Markdown",
                data: {
                    tree: editorRef.current?.getTree(),
                    content: editorRef.current?.getContent()
                },
                subscribtions: []
            }],
            ["AgentTask", { description: task }]
        ]);
        
        return new Promise((resolve, reject) => {
            if (!agentTaskMethod) {
                reject("agentTaskMethod method not specified");
                return;
            }

            const ingestedMethod = ingestMethod(agentTaskMethod, localEnv);
            if (ingestedMethod) {
                ingestedMethod.method()
                .then((outputs) => {
                    if (Object.keys(outputs).length > 0)
                        if (typeof outputs.result == "string")
                            resolve(outputs);
                    console.log(outputs);

                    reject("outputs has not got text node");
                })
            } else {
                reject("ingested method can not be created");
            }
        });

    }, [completitionMethod]);

    const [agentTaskModelOpen, setAgentTaskModelOpen] = useState(false);

    return (
        <Stack gap={1} padding={1} direction={'row'} justifyContent={'space-between'}>
            <div onContextMenu={handleContextMenu} style={{ width: "100%" }}>
                <Box flexGrow={1}>
                    <Editor
                        ref={editorRef}
                        defaultValue={data.content}
                        defaultTree={data.tree}
                        completitionFn={completitionMethod ? completitionFn : undefined}
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
                        getIngestedMethods_V2(agents, env).map(e => (
                            <MenuItem
                                key={e.name}
                                onClick={() => {
                                    e.method();
                                    setContextMenu(null);
                                }}
                            >
                                {e.name}
                            </MenuItem>
                        ))
                    }
                </Menu>
            </div>
            {/* <Stack width={'500px'} gap={4} borderLeft={'1px solid lightgrey'} padding={1}>
                <Stack gap={4}>
                    <Typography fontWeight={700}>Actions</Typography>
                    {
                        data.actions?.map((e, idx) => (
                            <Paper key={e.id} sx={{ padding: 1 }} elevation={4}>
                                <Stack gap={1}>
                                    <EditableMarkdown defaultValue={e.content}/>
                                </Stack>
                            </Paper>
                        ))
                    }
                </Stack>
                <Divider />
                <Stack>
                    <Typography fontWeight={700}>Hotkeys</Typography>
                    <Stack gap={2} direction={"row"}>
                        <Typography>Autocomplete (require method)</Typography>
                        <Typography fontWeight={700} sx={{ color: "lightgrey" }}>Ctrl + Space</Typography>
                    </Stack>
                    <Stack gap={2} direction={"row"}>
                        <Typography>Save</Typography>
                        <Typography fontWeight={700} sx={{ color: "lightgrey" }}>Ctrl + S</Typography>
                    </Stack>
                </Stack>
            </Stack> */}
            <AgentTaskInputModal
                open={agentTaskModelOpen}
                onClose={(value) => {
                    setAgentTaskModelOpen(false);
                    if (value) {
                        if (agentTaskMethod) {
                            editorRef.current?.insertAgentTask(value, agentTaskFn(value));
                        }
                    }
                }}
            />
            <UserPresets />
        </Stack>
    )
};
