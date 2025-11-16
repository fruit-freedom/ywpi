import { Box, Button, Divider, Stack, styled, TextField } from "@mui/material";
import { Markdown } from "../../../components/Markdown";
import "./index.css"
import { useEffect, useRef, useState } from "react";
import { ContextProps } from "../../../pages/ContextPage/types";

const Message = styled(Box)({
    display: 'flex',
    padding: "0 2rem",
});

const MessageContent = styled(Box)({
    padding: '0 0.5rem',
    border: '1px solid lightgrey',
    borderRadius: '4px',
    maxWidth: '85%'
});

interface State {
    messages: {
        role: string;
        content: string;
    }[];
}

const CodeMirrorEditor = ({ onChange, defaultValue }: { onChange?: (value: string) => void; defaultValue?: string }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let editor = null;

        if (ref.current) {
            editor = new EditorView({
                parent: ref.current,
                doc: defaultValue,
                extensions: [
                    basicSetup,
                    keymap.of([indentWithTab]),
                    EditorView.updateListener.of((update: ViewUpdate) => {
                        if (update.docChanged) {
                            onChange?.(update.state.doc.toString());
                        }
                    }),
                ]
            })
        }

        return () => editor ? editor.destroy() : undefined;
    }, [ref]);

    return <div ref={ref}/>
}

const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, meta) => true,
  priority: 0,
  Editor: (props) => {
    const cb = useCodeBlockEditorContext()
    // stops the propagation so that the parent lexical editor does not handle certain events.
    return (
      <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <CodeMirrorEditor
            onChange={(value) => cb.setCode(value)}
            defaultValue={props.code}
        />
      </div>
    )
  }
}

const EditableMessageContent = ({ onChange, content }: { content: string, onChange?: (value: string) => void }) => {
    const [updated, setUpdated] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const ref = useRef<MDXEditorMethods>(null);

    if (!editMode) {
        return (
            <MessageContent onDoubleClick={() => setEditMode(true)}>
                <Markdown>
                    {content}
                </Markdown>
            </MessageContent>
        )
    }

    return (
        <MessageContent>
            <MDXEditor
                ref={ref}
                contentEditableClassName={"message-editor"}
                markdown={content}
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] }),
                    markdownShortcutPlugin(),
                ]}
                onChange={(markdown: string) => {
                    if (!updated)
                        setUpdated(true);
                }}
                onError={console.log}
            />
            <Divider />
            <Stack direction={"row"} justifyContent={"space-between"}>
                {
                    updated ?
                    <Button
                        sx={{ fontWeight: 700 }}
                        size="small"
                        variant="contained"
                        onClick={() => {
                            onChange?.(ref.current?.getMarkdown() || "");
                            setUpdated(false);
                            setEditMode(false);
                        }}
                    >
                        Save
                    </Button>
                    : <div/>
                }
                <Button
                    sx={{ fontWeight: 700 }}
                    size="small"
                    onClick={() => {
                        ref.current?.setMarkdown(content);
                        setUpdated(false);
                        setEditMode(false);
                    }}
                    color="secondary"
                    variant="contained"
                >
                    Cancel
                </Button>
            </Stack>
        </MessageContent>
    )
}

export const Chat = ({ data, contextId, applyContextUpdate }: ContextProps<State>) => {
    return (
        <Stack gap={1} padding={1}>
            {
                data.messages?.map((e, idx) => (
                    <Message key={idx} justifyContent={e.role !== 'user' ? 'flex-start' : 'flex-end'}>
                        {/* <EditableMessageContent
                            content={e.content}
                            onChange={(value) => applyContextUpdate({
                                $set: {
                                    [`messages.${idx}`]: {
                                        role: e.role,
                                        content: value
                                    }
                                }
                            })}
                        /> */}
                        <Markdown>{e.content}</Markdown>
                    </Message>
                ))
            }
            <TextField
                onKeyDown={e => {
                    if (e.key == "Enter" && e.target.value.length > 0) {
                        applyContextUpdate({
                            $push: {
                                messages: {
                                    role: "user",
                                    content: e.target.value
                                }
                            }
                        })
                        e.target.value = ""
                    }
                }}
                size="small"
                placeholder="Put message here"
            />
        </Stack>
    )
};
