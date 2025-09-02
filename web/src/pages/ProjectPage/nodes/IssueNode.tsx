import { Chip, Stack, Typography } from "@mui/material";
import { NodeProps, Node } from "@xyflow/react";


type IssueNodeType = Node<{
    id: number;
    iid: number;
    project_id: number;
    title: string;
    description: string;
    labels: string[];
    web_url: string;
}>;


export const IssueNode = ({ data, isConnectable }: NodeProps<IssueNodeType>) => {
    return (
        <Stack bgcolor={'#fff'} padding={2} width={'50em'} gap={4}>
            <Typography fontWeight={700} variant="h2">{data.title}</Typography>
            <Typography >{data.description}</Typography>
            <Stack direction={'row'} gap={2}>
            {
                data.labels.map(e => <Chip sx={{ width: 'min-content' }} label={e}/>)
            }
            </Stack>
          </Stack>
    );
};