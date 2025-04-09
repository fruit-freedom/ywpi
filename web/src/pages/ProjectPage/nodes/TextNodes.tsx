import { useRef, memo, useMemo } from "react";

import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';

import { Box, Stack, Typography } from "@mui/material";
import { WithDragHandle } from "./WithDragHandle";

import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";

export const MarkdownNode = memo(({ data, isConnectable }: NodeProps) => {
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


// export const TextNode = memo(({ type, data, isConnectable }: NodeProps<TextNodeType>) => {
// export const TextNode = memo((props: NodeProps<TextNodeType>) => {
//     return (
//         <WithDragHandle {...props}>
//             <Stack padding={'1em'} border={'1px dashed grey'} alignItems={'center'} color={'grey'} maxWidth={'400px'}>
//                 {
//                     props.data.text ?
//                         <Typography>{props.data.text}</Typography>
//                         : null
//                 }
//             </Stack>
//             <Handle
//                 type='source'
//                 position={Position.Right}
//                 id="a"
//                 isConnectable={props.isConnectable}
//             />
//             <Handle
//                 type='target'
//                 position={Position.Left}
//                 id="b"
//                 isConnectable={props.isConnectable}
//             />
//         </WithDragHandle>
//     );
// });

export const TextNode = (props: NodeProps<TextNodeType>) => {
    return (
        <>
            <Stack padding={'1em'} border={'1px dashed grey'} alignItems={'center'} color={'grey'} maxWidth={'500px'}>
                {
                    props.data.text ?
                        <Typography>{props.data.text}</Typography>
                        : null
                }
            </Stack>
            <Handle
                type='source'
                position={Position.Right}
                id="a"
                isConnectable={props.isConnectable}
            />
            <Handle
                type='target'
                position={Position.Left}
                id="b"
                isConnectable={props.isConnectable}
            />
        </>
    );
};

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