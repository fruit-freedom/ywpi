import {
    Typography,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack
} from "@mui/material";
import { Markdown } from "../Markdown";
import { Task } from "../../store/store";


interface TaskCardProps {
    task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
    return (
        <Accordion disableGutters elevation={4}>
            <AccordionSummary>
                <Box display={'flex'} alignItems={'center'} gap={'1em'}>
                    <Typography fontWeight={600}>ID {task.id}</Typography>
                    <Typography color='grey' variant='body2'>{task.status}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Inputs</Typography>
                    {
                        Object.entries(task.inputs).map((k) => (
                            <Box ml={'1rem'} key={k[0]} display={'flex'} gap={2}>
                                <Typography fontWeight={600}>{k[0]}</Typography>
                                <Typography>{JSON.stringify(k[1], null, 2)}</Typography>
                            </Box>
                        ))
                    }
                </Box>
                <Box>
                    <Typography variant='subtitle1' fontWeight={800}>Outputs</Typography>
                    {
                        task.outputs ?
                        Object.entries(task.outputs).map(e => {
                            return (
                                <Stack ml={'1rem'} key={e[0]}>
                                    <Typography fontWeight={700}>{e[0]}</Typography>
                                    {
                                        typeof e[1] === 'string'
                                        ?
                                        <Markdown>{e[1]}</Markdown>
                                        :
                                        <Typography whiteSpace={' '}>
                                            {JSON.stringify(e[1], null, 2)}
                                        </Typography>
                                    }
                                </Stack>
                            )
                        })
                        : null
                    }
                </Box>
            </AccordionDetails>
        </Accordion>

    )
}
