import { Typography, Box, Chip, Stack, Divider } from "@mui/material";
import { Markdown } from "../../components/Markdown";

const ChatModelStart = ({ event }) => {
    return (
        <Stack>
            <Markdown>{event.data.input.messages[0][0].content}</Markdown>
        </Stack>
    )
}

const ChatModelEnd = ({ event }) => {
    return (
        <Stack>
            <Typography variant="h6">Model Input</Typography>
            <Divider />
            <Markdown>{event.data.input.messages[0][0].content}</Markdown>
            <Typography variant="h6">Model Output</Typography>
            <Divider />
            <Markdown>{event.data.output.content}</Markdown>
        </Stack>
    )
}

const ChainStart = ({ event }) => {
    return (
        <Stack>
            {/* <Typography variant="h6">Node Input</Typography>
            <Divider />
            {JSON.stringify(event.data.input)} */}
        </Stack>
    )
}

const ChainEnd = ({ event }) => {
    return (
        <Stack>
            {/* {JSON.stringify(event.data.input)} */}
        </Stack>
    )
}

export const eventRenderersComponents = new Map([
    ['on_chat_model_start', ChatModelStart],
    ['on_chat_model_end', ChatModelEnd],
    ['on_chain_start', ChainStart],
    ['on_chain_end', ChainEnd],
]);

