import { Box, Stack, Typography } from "@mui/material";
import { Markdown } from "../Markdown";


// OR string, number, object
interface Object {
    _type: string;
    _val: any;
}

interface TastOutputsProps {
    outputs?: any;
    outputsSchema: any;
}

export const TastOutputs = ({ outputs }: TastOutputsProps) => {
    return (
        <Box>
            <Typography variant='subtitle1' fontWeight={800}>Outputs</Typography>
            {
                outputs ?
                Object.entries(outputs).map(e => {
                    return (
                        <Stack>
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
    )
}