import { Button, Modal, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";



const AgentTaskInputModal = ({ open, onClose }: { open: boolean, onClose: (text?: string) => void; }) => {
    const [text, setText] = useState<string>();

    const inputRef = useCallback((ref?: HTMLInputElement) => {
        if (ref) {
            ref.focus();
        }
    }, []);

    return (
        <Modal open={open} onClose={() => onClose()}>
            <Stack justifyContent={'center'} alignItems={'center'} height={'100vh'}>
                <Stack gap={2} bgcolor={"#fff"} padding={"2rem 4rem"} width={'30rem'}>
                    <TextField
                        multiline
                        rows={3}
                        inputRef={inputRef}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <Button
                        onClick={() => {
                            setText(undefined);
                            onClose(text);}
                        }
                    >
                        Ok
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    )
}

export default AgentTaskInputModal;
