import { Modal as MuiModal, ModalProps as MuiModalProps, Stack } from "@mui/material";
import React from "react";


interface ModalProps extends MuiModalProps {
    children: any;
}

const Modal = (props: ModalProps) => {
    return (
        <MuiModal {...{ ...props, children: undefined }}>
            <Stack
                padding={'1em'}
                alignItems={'center'}
                justifyContent={'center'}
                height={'100vh'}
            >
                <Stack bgcolor={'#fff'} borderRadius={'4px'} padding={'3rem'} gap={4}>
                    {props.children}
                </Stack>
            </Stack>
        </MuiModal>
    );
}

export default Modal;
