import { Box, Chip, Input, Paper, Popper, Stack, Switch, Typography, styled } from '@mui/material';
import { useEffect, useRef, useState } from 'react'
import { Outlet, Router, RouterProvider, createBrowserRouter, useNavigate, useParams } from 'react-router-dom';

const Message = styled(Box)({
    display: 'flex',
})

const MessageContent = styled(Box)({
    padding: '0.2rem',
    border: '1px solid grey',
    borderRadius: '4px',
    maxWidth: '50%'
})


interface ItemProps {
    active?: boolean;
    value: string;
}

const Item = ({ active, value }: ItemProps) => {
    return (
        <Box
            bgcolor={active ? 'lightgrey' : 'white'}
            padding={'0.2rem'}
            width={'150px'}
            borderBottom={'1px solid black'}
            sx={{
                '&:hover': {
                    bgcolor: 'lightgrey'
                }
            }}
        >
            <Typography>{value}</Typography>
        </Box>
    )
}

const DICTIONARY = [
    'call', 'pipeline=', 'chat', 'pdf', 'broken', 'quick-start', 'quick-start-ex=', 'merge_request=', '/load',
    // 'pipeline=756', 'pipeline=757', 'pipeline=758', 'pipeline=759', 
    '/deploy', 'web:122', 'web:435', 'web:172',
    '/tasks', '/home', '/last_pipeline'
];
const LOAD_RECOMMENDATIONS = [
    'image.jpeg', 'index.html', 'main.py'
]
const searchByPrefix = (prefix: string, words: string[]) => {
    if (words.length > 1 && words[words.length - 2] === '/load') {
        return LOAD_RECOMMENDATIONS.filter(e => e.startsWith(prefix) && e !== prefix);
    }

    if (prefix.length === 0)
        return [];

    return DICTIONARY.filter(e => e.startsWith(prefix) && e !== prefix);
}

interface RecommenationState {
    values: string[];
    activeValueIdx: number;
}



const Element = ({  }) => {
    const [ms, setMs] = useState([]);

    const [text, setText] = useState('');

    const [adornments, setAdornments] = useState([]);

    const inputRef = useRef(null);

    const [recommendation, setRecommendation] = useState<RecommenationState>({ values: [], activeValueIdx: 0 });

    const navigate = useNavigate();

    useEffect(() => {
        if (ms.length > 0) {
            const lastMessage = ms[ms.length - 1];
            if (lastMessage === '/tasks' || lastMessage === '/home')
                navigate(lastMessage);
            else if (lastMessage === '/last_pipeline')
                navigate('/executions/24512');
        }
    }, [ms]);

    useEffect(() => {
        const words = text.split(' ');
        if (text.length > 0 && words.length > 0) {
            setRecommendation(prev => ({ ...prev, values: searchByPrefix(words[words.length - 1], words), activeValueIdx: 0 }));
        }
        else {
            setRecommendation(prev => ({ ...prev, values: [] }));
        }
    }, [text]);

    useEffect(() => {
        const value = text.trim()
        if (value === 'call' || value === 'method') {
            setAdornments(
                prev => [...prev, <Chip key={Math.random()} sx={{ borderRadius: '4px' }} size='small' label={value}/>]
            );
            setText('');
        }
    }, [text]);

    return (
        <div >
            <Stack width={'40rem'} padding={'1rem'} border={'1px solid grey'} gap={1}>
                <Message justifyContent={'flex-start'}>
                    <MessageContent>Hi! What are you doing now? Do you want to play hockey</MessageContent>
                </Message>
                <Message justifyContent={'flex-end'}>
                    <MessageContent>Hello!</MessageContent>
                </Message>
                <Message justifyContent={'flex-end'}>
                    <MessageContent>I am working now</MessageContent>
                </Message>
                <Message justifyContent={'flex-start'}>
                    <MessageContent>Okey</MessageContent>
                </Message>
                <Message justifyContent={'flex-start'}>
                    <MessageContent>See you soon</MessageContent>
                    <input
                        // value={'hello'}
                        defaultValue={'hello'}
                        style={{
                            border: 'none',
                            outline: 'none'
                        }}
                    />
                </Message>
                {
                    ms.map((e, idx) => (
                        <Message key={e + idx} justifyContent={'flex-start'}>
                            <MessageContent>{e}</MessageContent>
                        </Message>    
                    ))
                }
                <Message>
                    <Input
                        // variant='standard'
                        value={text}
                        ref={inputRef}
                        onKeyDown={(e) => {
                            console.log('e.code', e.code)

                            // if (e.code === 'Tab') {
                            //     e.preventDefault();
                            //     setAdornments(
                            //         prev => [...prev,
                            //                 ...[
                            //                     // <span style={{ width: 'max-content' }}>{e.target.value}</span>,
                            //                     <input style={{ border: 'none', outline: 'none', width: 'min-content' }} defaultValue={e.target.value}/>,
                            //                     <Chip
                            //                         key={Math.random()}
                            //                         sx={{ borderRadius: '4px', display: 'inline-block' }}
                            //                         size='small'
                            //                         label={'<text>{text}</text>'}
                            //                         color='success'
                            //                     />
                            //                 ]
                            //         ]
                            //     );
                            //     setText('');
                            //     return;
                            // }

                            if (e.code === 'Tab') {
                                if (recommendation.values.length > 0) {
                                    const words = text.split(' ');
                                    if (words.length > 0) {
                                        words[words.length - 1] = recommendation.values[recommendation.activeValueIdx];
                                        setText(words.join(' '));
                                    }
                                    e.preventDefault();
                                }
                            }

                            if (e.code == 'Backspace' && e.target.value.length === 0) {
                                setAdornments(prev => prev.slice(0, prev.length - 1));
                                return;
                            }

                            if (e.code === 'Enter' && e.target.value.length > 0) {
                                setMs([...ms, e.target.value]);
                                setText('');
                            }

                            if (recommendation.values.length > 0) {
                                if (e.code === 'ArrowDown') {
                                    setRecommendation(prev => ({ ...prev, activeValueIdx: (prev.activeValueIdx + 1) % prev.values.length  }));
                                    e.preventDefault();
                                }
                                else if (e.code === 'ArrowUp') {
                                    setRecommendation(prev => ({
                                        ...prev,
                                        activeValueIdx: (prev.activeValueIdx + (prev.values.length - 1)) % prev.values.length
                                    }));
                                    e.preventDefault();
                                }    
                            }
                        }}
                        onChange={(e) => {
                            setText(e.target.value);
                        }}
                        fullWidth
                        startAdornment={
                            <>
                                {
                                    adornments.map((e, idx) => (<span key={idx}>{e}</span>))
                                }
                            </>
                        }
                    />
                    <Popper open={true} anchorEl={inputRef.current} placement='bottom-start'>
                        {
                            recommendation.values.map((e, idx) => (
                                <Item key={e} value={e} active={idx === recommendation.activeValueIdx}/>
                            ))
                        }
                    </Popper>
                </Message>
            </Stack>
            {/* <Menu open={true} autoFocus={false}>
                <MenuItem>text</MenuItem>
            </Menu> */}
        </div>
    )
}


const Home = () => {
    return <Typography>Home</Typography>
}

const Tasks = () => {
    return <Typography>Tasks</Typography>
}

const ExecutionPage = () => {
    const { executionId } = useParams();
    return (
        <Stack>
            <Typography>Execution {executionId} page</Typography>
            <Paper>
                <Typography padding={1}>Object 1</Typography>
            </Paper>
            <Paper sx={{ pl: '1rem' }}>
                <Typography padding={1}>Object 421</Typography>
            </Paper>
            <Paper>
                <Typography padding={1}>Object 2</Typography>
            </Paper>
            <Paper>
                <Typography padding={1}>Object 3</Typography>
            </Paper>
        </Stack>
    )
}


const Layout = () => {
    return (
        <Stack direction={'row'}>
            <Box>
                <Element />
            </Box>
            <Box ml={'50rem'}>
                <Outlet />
            </Box>
        </Stack>
    )
}

const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            {
                path: '/*',
                Component: Home
            },
            {
                path: '/tasks',
                Component: Tasks
            },
            {
                path: '/executions/:executionId',
                Component: ExecutionPage
            }
        ]
    },
]);
  


function App() {
    return (
        <Box height={'95vh'} display={'flex'} alignItems={'center'}>
            <Box>
                {/* <Element /> */}
                <RouterProvider router={router}>
                </RouterProvider>
                {/* <Paper>
                    <Stack padding={1}>
                        <Typography>Content</Typography>
                    </Stack>
                </Paper> */}
            </Box>
        </Box>
    )
}

export default App