import { Paper, Stack, Typography } from "@mui/material"
import { useQuery } from "react-query"


interface Relation {
    name: string;
    object_id: string;
    source_task_id?: string;
}

interface Object {
    id: string;
    project_id?: string;
    tp: string;
    relations: Relation[];
    data: any;
}

interface ObjectsListProps {
    projectId?: string;
}

const PDFView = ({ data }: any) => {
    return (
        <Typography>{data.name}</Typography>
    )
}

const TextView = ({ data }: any) => {
    return (
        <Typography>{data.text.slice(0, 150)}{ data.text.length > 150 ? '...' : null }</Typography>
    )
}


const components = new Map([
    ['pdf', PDFView],
    ['text', TextView]
]);

export const ObjectsList = ({ projectId }: ObjectsListProps) => {
    const { data } = useQuery<Object[]>({
        queryKey: ['projects', 'objects'],
        queryFn: () => fetch(`/api/projects/${projectId}/objects`).then(r => r.json()),
        enabled: !!projectId
    });

    return (
        <Stack width={'20rem'} padding={'0.5rem'} bgcolor={'#fff'} gap={1} maxHeight={'50em'} sx={{ overflowY: 'scroll' }}>
            {
                data?.map(e => (
                    <div key={e.id} draggable={false}>
                        <Paper>
                            <Stack padding={'0.1rem'}>
                                <Stack direction={'row'} gap={1}>
                                    <Typography sx={{ color: 'lightgray' }} variant="body2">{e.id}</Typography>
                                    <Typography
                                        sx={{ borderRadius: '4px', backgroundColor: '#f3f3f3', padding: '0 0.1rem' }}
                                        variant="body2"
                                    >
                                        {e.tp}
                                    </Typography>
                                </Stack>
                                { components.has(e.tp) ? components.get(e.tp)?.({data: e.data}) : null}
                            </Stack>
                        </Paper>
                    </div>
                ))
            }
        </Stack>
    )
}