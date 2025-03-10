import React, { useState } from "react";
import { Paper, TextField, Box, Typography, TextareaAutosize, Chip, Divider, Button } from "@mui/material";
import styled from "@mui/material/styles/styled";
import { Control, Controller, useForm } from "react-hook-form";

import { Agent, Method } from "../../store/store";

interface InputProps {
    name: string;
    register: any;
    control?: Control;
}

const StringInput = ({ register, name }: InputProps) => {
    return (
        <Box>
            <TextField size='small' fullWidth variant='standard' {...register(name)} />
        </Box>
    )
}

const NumberInput = ({ register, name }: InputProps) => {
    return (
        <Box>
            <TextField size='small' fullWidth variant='standard' {...register(name)} type='number' />
        </Box>
    )
}

const TextInput = ({ register, name }: InputProps) => {
    return (
        <Box>
            <TextareaAutosize
                {...register(name)}
                minRows={8}
                style={{ width: '100%', borderColor: 'lightgray' }}
                placeholder="Use <text> as placeholder for patent text."
            />
        </Box>
    )
}

const FilePicker = () => {
    const [files, setFiles] = useState<any[]>([]);

    const onChange = (e: any) => {
        console.log(e.target.files)
        setFiles([...e.target.files]);
    }

    return (
        <Box>
            <Box>
                <label htmlFor={"file-upload"} className="custom-file-upload">
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
                        <Chip variant="outlined" key={f.name} sx={{ borderRadius: '4px', margin: '0.4em 0.4em 0 0' }} label={f.name} />
                    ))
                }
            </Box>
        </Box>
    );
}

const FileInput = ({ register, name }: InputProps) => {
    return (
        <Box>
            <FilePicker />
        </Box>
    )
}

const PDFInput = ({ register, name, control }: InputProps) => {
    return (
        <Box>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <TextareaAutosize
                        value={JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                            field.onChange(JSON.parse(e.target.value))
                        }}
                        minRows={8}
                        style={{ width: '100%', borderColor: 'lightgray' }}
                        placeholder="Use <text> as placeholder for patent text."
                    />
                )}
            />
        </Box>
    )
}


const COMPONENTS = new Map([
    [ 'int', NumberInput ],
    [ 'float', NumberInput ],
    [ 'str', StringInput ],
    [ 'text', TextInput ],
    [ 'file', FileInput ],
    [ 'pdf', PDFInput ]
]);

interface Input {
    name: string;
    type: string;
}

const inputs: Input[] = [
    {
        name: 'threshold',
        type: 'int'
    },
    {
        name: 'prompt',
        type: 'text'
    },
    {
        name: 'comment',
        type: 'str'
    },
    {
        name: 'documents',
        type: 'file'
    },
    {
        name: 'filepath',
        type: 'str'
    }
]

const StartButton = styled(Button)({
    color: '#fff',
    borderColor: '#b4b4b4',
    fontWeight: '600',
    backgroundColor: '#000',
    width: '100%',
    '&:hover': {
        backgroundColor: '#000',
    }
})

export interface BorrowedField {
    path: string;
    objectId: string;
}

export interface BorrowedFields {
    [key: string]: BorrowedField;
}

interface MethodCardProps {
    agent: Agent;
    method: Method;
    onStart?: () => void;
    defaultValues?: any;
    borrowedFields?: BorrowedFields;
}


export default function MethodCard({ agent, method, onStart, defaultValues, borrowedFields }: MethodCardProps) {
    const { register, handleSubmit, setValue, control } = useForm({ defaultValues });
    const [data, setData] = useState("");

    console.log(defaultValues, 'defaultValues')
    
    const handleStartTask = (data: any) => {
        console.log(data);
        setData(JSON.stringify(data));

        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent_id: agent.id,
                method: method.name,
                inputs: data,
                borrowed_fields: borrowedFields
            }, (key, value) => { if (value !== null) return value })
        })
        .then(e => e.json())
        .then(e => console.log(e))
        .catch(e => console.log(e));

        onStart?.();
    };

    return (
        <Paper sx={{ padding: '1em', display: 'flex', flexDirection: 'column', gap: '1.5em' }} elevation={4}>
            <Box display={'flex'} flexDirection={'column'}>
                <Typography fontWeight={600} variant="h3">{method.name}</Typography>
                <Typography color="grey" variant='body2'>{method.description}</Typography>
                <Divider/>
            </Box>
            <Box>
                <form onSubmit={handleSubmit(handleStartTask)}>
                    <Box display={'flex'} flexDirection={'column'} gap={3}>
                    {
                        method.inputs.map(e => (
                            <Box key={e.name}>
                                <Box>
                                    <Box display={'flex'} alignItems={'center'}  gap={'0.5em'}>
                                        <Typography fontWeight={800} variant='subtitle1' >{e.name}:</Typography>
                                        <Typography variant='subtitle1' fontStyle={'italic'}>{e.type}</Typography>
                                        <Typography variant='body2' color='grey' padding={'0 0.5em'} maxWidth={'30em'}>
                                            {/* Files for processing using prompt. Multiple files will be processed independenlty. */}
                                            Annotation will be there later.
                                        </Typography>
                                    </Box>
                                </Box>
                                {COMPONENTS.get(e.type)?.({ register, name: e.name, control })}
                            </Box>
                        ))
                    }
                    <StartButton type='submit'>Start</StartButton>
                    </Box>
                </form>
            </Box>
        </Paper>
    );
}
