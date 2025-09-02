import { Stack, IconButton, Typography, Paper, Box } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import PDFHighlightViewer from "../PDFHighlightViewer";
import { NodeMenu } from "../../pages/ProjectPage/components/NodeMenu";
import { useQuery } from "react-query";
import { getObject, getRelatedObjects } from "../../api/object";

export interface DocumentText {
    page_number: number;
    text: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface PDFProps {
    objectId: string;
    onClose?: () => void;
    documentTexts?: DocumentText[];
}

export default ({ objectId, onClose, documentTexts }: PDFProps) => {
    const { data } = useQuery({
        queryFn: () => getObject(objectId),
        queryKey: ['object', objectId],
    });

    const { data: relatedObjects } = useQuery({
        queryFn: () => getRelatedObjects(objectId),
        queryKey: ['object', 'related', objectId],
        refetchInterval: 10000,
    });

    if (!data || !relatedObjects)
        return;

    return (
        <Stack width={'70vw'}>
            <Stack direction={'row'} justifyContent={'space-around'}>
                <Typography fontWeight={700} variant="h6">{data.data.name}</Typography>
                <div>
                    <NodeMenu tp="pdf" data={{
                        ...data.data,
                        objectId: data.id
                    }}/>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </div>
            </Stack>
            <Stack direction={'row'} gap={1}>
                <Box width={'100%'}>
                    <PDFHighlightViewer url={data.data.src} texts={documentTexts}/>
                </Box>
                <Stack width={'40%'} maxHeight={'90vh'} overflow={'scroll'} padding={'0.2rem'} gap={1}>
                    {
                        relatedObjects?.map(e => (
                            <Paper elevation={4} sx={{ padding: '0.2rem' }}>
                                <Typography
                                    sx={{ borderRadius: '4px', backgroundColor: '#f3f3f3', padding: '0 0.1rem', width: 'min-content' }}
                                >
                                    {e?.source_task?.method}
                                </Typography>
                                <Typography variant="body2">{e.object.data.text}</Typography>
                            </Paper>
                        ))
                    }
                </Stack>
            </Stack>
        </Stack>
    )
}
