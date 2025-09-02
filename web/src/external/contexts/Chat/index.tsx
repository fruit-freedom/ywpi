import { Box, Stack, styled } from "@mui/material";
import { Markdown } from "../../../components/Markdown";

const Message = styled(Box)({
    display: 'flex',
});

const MessageContent = styled(Box)({
    padding: '0.4rem',
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

export const Chat = ({ data }: { data: State }) => {
    return (
        <Stack gap={1} padding={1}>
            {
                data.messages?.map((e, idx) => (
                    <Message key={idx} justifyContent={e.role === 'user' ? 'flex-start' : 'flex-end'}>
                        <MessageContent><Markdown>{e.content}</Markdown></MessageContent>
                    </Message>
                ))
            }
        </Stack>
    )
};
