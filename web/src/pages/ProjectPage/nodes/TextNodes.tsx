import { useRef, memo, useMemo, useState } from "react";

import {
    Handle,
    NodeProps,
    Position,
    Node
} from '@xyflow/react';

import { Box, Chip, Input, Stack, styled, Typography } from "@mui/material";
import { WithDragHandle } from "./WithDragHandle";
import { Markdown } from "../../../components/Markdown";

export const MarkdownNode = memo(({ data, isConnectable }: NodeProps) => {
    const elem = useMemo(() => {
        return (
            <Markdown>{data.text}</Markdown>
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
            <Stack
                padding={'1em'}
                border={'1px dashed grey'}
                alignItems={'center'}
                color={'grey'}
                maxWidth={'500px'}
            >
                {
                    props.data.text ?
                        <Typography>{props.data.text}</Typography>
                        : null
                }
            </Stack>
            <Handle
                type='source'
                position={Position.Left}
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

const Message = styled(Box)({
    display: 'flex',
})

const MessageContent = styled(Box)({
    padding: '0.5rem',
    border: '1px solid grey',
    borderRadius: '4px',
    maxWidth: '80%'
})

const Md = ({ children }) => {
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
            {children}
        </Markdown>
    );
}

const messages = [
    {
        role: 'user',
        text: `Write short summary for this document`
    },
    {
        role: 'assistant',
        text: `Writing a summary for a document involves condensing the main ideas and key points into a concise overview. Here are some steps to help you craft an effective summary:

1. **Read the Document Carefully:**  
   - Skim the document to get a general understanding.  
   - Read it thoroughly to grasp the main ideas, arguments, and supporting details.

2. **Identify the Purpose and Main Ideas:**  
   - Determine the purpose of the document.  
   - Highlight or note the main points, thesis statement, and essential supporting details.

3. **Highlight Key Sections:**  
   - Focus on introductions, conclusions, headings, and topic sentences.  
   - Identify any conclusions or recommendations.

4. **Take Notes:**  
   - Write down important points in your own words.  
   - Avoid copying large sections verbatim unless quoting is necessary.

5. **Organize Your Notes:**  
   - Arrange the main ideas logically, maintaining the flow of the original document.

6. **Write the Summary:**  
   - Start with a clear statement of the document’s main purpose or thesis.  
   - Summarize key points succinctly, avoiding unnecessary details or examples.  
   - Use your own words to ensure originality and clarity.

7. **Keep It Concise:**  
   - Typically, a summary should be about 10-20% of the original document’s length, depending on requirements.

8. **Review and Edit:**  
   - Check for clarity, coherence, and accuracy.  
   - Make sure it accurately reflects the main ideas without personal opinions.

**Tips:**  
- Use clear and straightforward language.  
- Avoid including minor details, examples, or lengthy explanations.  
- Maintain the original tone and intent of the document.

**Example Structure:**  
- **Introduction:** State the main purpose or thesis.  
- **Body:** Summarize key points or arguments.  
- **Conclusion:** Mention any final thoughts or implications.

If you provide a specific document or its content, I can help you craft a tailored summary.
        `
    },
    {
        role: 'user',
        text: `Could you describe document's content`
    },
    {
        role: 'assistant',
        text: `This papaer proveide ability for

        - Create
        - Read
        - Update
        - Delete`
    }
]

export const Context = ({}) => {
    return <Box padding={'1000px'} border={'2 px dashed grey'}></Box>
}

export const Chat = ({ data, isConnectable }: NodeProps) => {
    const [ms, setMs] = useState([]);

    const [text, setText] = useState('');

    const [adornments, setAdornments] = useState([]);

    return (
        <div >
            <Stack width={'50rem'} padding={'1rem'} border={'1px solid #fff'} gap={1}>
                {
                    messages.map(e => (
                        <Message key={e.text.substring(0, 20)} justifyContent={e.role === 'user' ? 'flex-start' : 'flex-end'}>
                            <MessageContent><Md>{e.text}</Md></MessageContent>
                        </Message>    
                    ))
                }
                {
                    ms.map(e => (
                        <Message key={e} justifyContent={'flex-start'}>
                            <MessageContent><Md>{e}</Md></MessageContent>
                        </Message>
                    ))
                }
                <Message>
                    {/* <Input
                        // variant='standard'
                        value={text}
                        onKeyDown={(e) => {
                            console.log('e.code', e.code)

                            if (e.code === 'Tab') {
                                e.preventDefault();
                                setAdornments(
                                    prev => [...prev,
                                            ...[
                                                <span style={{ width: 'max-content' }}>{e.target.value}</span>,
                                                <Chip
                                                    key={Math.random()}
                                                    sx={{ borderRadius: '4px', display: 'inline-block' }}
                                                    size='small'
                                                    label={'<text>{text}</text>'}
                                                    color='success'
                                                />
                                            ]
                                    ]
                                );
                                setText('');
                                return;
                            }

                            if (e.code == 'Backspace' && e.target.value.length === 0) {
                                setAdornments(prev => prev.slice(0, prev.length - 1));
                                return;
                            }

                            if (e.code === 'Enter' && e.target.value.length > 0) {
                                setMs([...ms, e.target.value]);
                                setText('');
                            }
                        }}
                        onChange={(e) => {
                            setText(e.target.value);
                            const value = e.target.value.trim()
                            if (value === 'call' || value === 'method') {
                                setAdornments(
                                    prev => [...prev, <Chip key={Math.random()} sx={{ borderRadius: '4px' }} size='small' label={value}/>]
                                );
                                setText('');
                            }
                        }}
                        fullWidth
                        startAdornment={
                            <>
                                {
                                    adornments.map((e, idx) => (<span key={idx}>{e}</span>))
                                }
                            </>
                        }
                    /> */}
                </Message>
            </Stack>
            {/* <Menu open={true} autoFocus={false}>
                <MenuItem>text</MenuItem>
            </Menu> */}
        </div>
    )
};
