import { Box, Stack, styled, Typography } from "@mui/material";
import { Markdown } from "../../../../components/Markdown";

const Message = styled(Box)({
    display: 'flex',
});

const MessageContent = styled(Box)({
    padding: '0.4rem',
    border: '1px solid lightgrey',
    borderRadius: '4px',
    maxWidth: '85%'
});

export const Chat = ({ data }: any) => {
    return (
        <Stack
            gap={1}
            height={'40em'}
            overflow={'hidden'}
        >
            {
                data.messages?.map((e, idx) => (
                    <Message key={idx} justifyContent={e.role === 'user' ? 'flex-start' : 'flex-end'}>
                        <MessageContent><Markdown>{e.text ? e.text : e.content}</Markdown></MessageContent>
                    </Message>
                ))
            }
        </Stack>
    )
};

const PDFView = ({ data }: any) => {
    return (
        <Typography>{data?.name}</Typography>
    )
}

const TextView = ({ data }: any) => {
    return (
        <Typography>{data?.text.slice(0, 150)}{ data?.text.length > 150 ? '...' : null }</Typography>
    )
}

export const components = new Map([
    ['pdf', PDFView],
    ['text', TextView],
    ['chat', Chat]
]);
