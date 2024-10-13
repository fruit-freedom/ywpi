import { Paper, Typography, Box, TextField, Button, TextareaAutosize, Divider, Chip } from "@mui/material";
import React, { useState } from "react";
import Header from "./Header";



const runs = [
    {
        id: '1',
        prompt: '',
        summary: ''
    },
    {
        id: '2',
    },
    {
        id: '3',
    },
    {
        id: '4',
    },
]

const fakeFiles = [
    // { name: "file1.txt" },
    // { name: "file1file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1.txt" },
    // { name: "file1.txt" },
] as any

const FilePicker = () => {
    const [files, setFiles] = useState(fakeFiles);

    const onChange = (e) => {
        console.log(e.target.files)
        setFiles([...e.target.files]);
    }

    return (
        <Box>
            <Box>
                <label for={"file-upload"} class="custom-file-upload">
                    <Typography
                        color={'white'}
                        variant='button'
                        sx={{
                            backgroundColor: '#000',
                            borderRadius: '4px',
                            padding: '0.2em',
                            cursor: 'pointer'
                        }}
                    >
                        Choose files
                    </Typography>
                </label>
                <input
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    name="file"
                    onChange={onChange}
                    multiple
                    accept="application/pdf"
                />
            </Box>
            <Box padding={'0.5em 0'}>
                {
                    files.map((f: any) => (
                        <Chip variant="outlined" sx={{ borderRadius: '4px', margin: '0.4em 0.4em 0 0' }} label={f.name} />
                    ))
                }
            </Box>
        </Box>
    );
}

export default () => {
    return (
        <>
        <Box padding={'1em 4em'}>
            <Paper elevation={3} sx={{ padding: '1em' }}>
                <Box>
                    <Typography variant='h5' fontWeight={600} >Summary task</Typography>
                    <Divider sx={{ marginBottom: '2em' }}/>
                    <Box>
                        <Typography variant='h6' fontWeight={600} >prompt</Typography>
                            <Typography variant='body2' color='grey' padding={'0.5em'}>
                                {`Text that llm will recieve as input. Use <text> as placeholder for patent text.`}
                            </Typography>
                        <TextareaAutosize minRows={16} style={{ width: '100%' }} placeholder="Use <text> as placeholder for patent text."/>
                    </Box>
                    <Divider sx={{ margin: '0.5em 0' }}/>
                    <Box>
                        <Typography variant='h6' minWidth={'5em'} fontWeight={600}>pdf_files</Typography>
                        <Typography variant='body2' color='grey' padding={'0.5em'}>
                            Files for processing using prompt. Multiple files will be processed independenlty.
                        </Typography>
                        <FilePicker />
                    </Box>
                    {/* <Divider sx={{ margin: '0.5em 0' }}/> */}
                </Box>
                <Button
                    variant='contained'
                    sx={{
                        color: '#fff',
                        borderColor: '#b4b4b4',
                        fontWeight: '600',
                        marginTop: '2em',
                        backgroundColor: '#000',
                        boxShadow: '-4px 4px 8px 0px rgba(64, 64, 64, 0.73)',
                        '&:hover': {
                            backgroundColor: '#000',
                        }
                    }}
                >
                    Create Run
                </Button>
            </Paper>
            {
                runs.map(e => (
                    <Paper sx={{ marginTop: '1em', padding: '1em' }}>
                        <Typography fontWeight={600} variant='h6'>ID: {e.id}</Typography>
                    </Paper>        
                ))
            }
        </Box>
        </>
    )
}
