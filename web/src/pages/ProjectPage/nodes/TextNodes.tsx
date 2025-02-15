import { useRef, memo, useMemo } from "react";

import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';


import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Box, Stack, Typography } from "@mui/material";
import { WithDragHandle } from "./WithDragHandle";


export const MarkdownNode = memo(({ data, isConnectable }: NodeProps) => {
    const textRef = useRef(null);

    // const handleTextSelection = () => {
    //     const range = document.createRange();
    //     range.selectNodeContents(textRef.current);
    //     const selection = window.getSelection();
    //     selection.removeAllRanges();
    //     selection.addRange(range);
    // };

    const elem = useMemo(() => {
        return (
            <Markdown
                components={{
                    code(props) {
                        const { children, className, node, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        return (match ?
                            // @ts-ignore
                            <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match[1]}
                            />
                            :
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {data.text}
            </Markdown>
        )
    }, [data])

    return (
        <>
            <Stack
                bgcolor={'#fff'}
                maxWidth={'800px'}
                padding={'1em'}
                borderRadius={'4px'}
                onClick={(e) => e.stopPropagation()}
                sx={{ pointerEvents: 'auto', userSelect: 'text' }}
            >
                <textarea
                    value={"Some text Some textSome textSome textSome textSome text"}
                    onMouseMove={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onMouseUp={e => e.stopPropagation()}
                    onPointerMove={e => e.stopPropagation()}
                    onPointerOver={e => e.stopPropagation()}
                    onGotPointerCapture={e => e.stopPropagation()}    
                >
                </textarea>
                <div
                    style={{ userSelect: 'text' }}
                >
                    Some text Some textSome textSome textSome textSome text
                </div>
                {elem}
            </Stack>
            <Typography color="grey">markdown</Typography>
        </>
    );
});

type TextNodeType = Node<{ text?: string; }>;

export const TextNode = memo(({ data, isConnectable }: NodeProps<TextNodeType>) => {
    return (
        <WithDragHandle>
            <Stack padding={'1em'} border={'1px dashed grey'} alignItems={'center'} color={'grey'} maxWidth={'400px'}>
                {
                    data.text ?
                        <Typography>{data.text}</Typography>
                        : null
                }
            </Stack>
            <Handle
                type='source'
                position={Position.Right}
                id="a"
                isConnectable={isConnectable}
            />
            <Handle
                type='target'
                position={Position.Left}
                id="b"
                isConnectable={isConnectable}
            />
        </WithDragHandle>
    );
});

export const StringListNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <WithDragHandle>
            <Stack padding={'1em'} border={'1px dashed grey'} alignItems={'center'} color={'grey'} width={'400px'}>
                <Typography>keywords</Typography>
                <Stack direction={'row'} flexWrap={'wrap'} gap={0.4}>
                    {
                        [
                            'query optiization',
                            'databases',
                            'lookup tables',
                            'protocol optimization',
                            'large language model'
                        ].map((e, idx) => <Typography key={idx} padding={'0.1rem'} bgcolor={'#d9d9d9'} borderRadius={'2px'}>{e}</Typography>)
                    }
                </Stack>
            </Stack>
            <Handle
                type='target'
                position={Position.Left}
                id="b"
                isConnectable={isConnectable}
            />
        </WithDragHandle>
    );
});

export const JSONNode = memo(({ data, isConnectable }: NodeProps) => {
    return (
        <WithDragHandle>
            <Stack padding={'1em'} border={'1px dashed grey'} alignItems={'center'} color={'grey'} maxWidth={'400px'}>
                <pre>{JSON.stringify(data, null, 4)}</pre>
            </Stack>
            <Handle
                type='target'
                position={Position.Left}
                id="b"
                isConnectable={isConnectable}
            />
        </WithDragHandle>
    );
});