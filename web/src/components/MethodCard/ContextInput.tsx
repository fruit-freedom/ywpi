import { Box, Paper, Stack, TextareaAutosize, Typography } from "@mui/material"
import { Controller } from "react-hook-form"
import { useQuery } from "react-query";
import { Context } from "../../api/types";


const ContextList = ({ onClick }: { onClick?: (ctx: Context) => void; }) => {
    const { data: contexts } = useQuery<Context[]>({
        queryFn: () => fetch(`/api/projects/6807e7807495857a037b2c1f/contexts`).then(e => e.json()),
        queryKey: ['projects', '6807e7807495857a037b2c1f', 'contexts'],
    });

    return (
        <Stack gap={1}>
            {
                contexts?.map(e => (
                    <Paper key={e.id} elevation={4}>
                        <Box padding={1} onClick={() => onClick?.(e)} sx={{ cursor: 'pointer' }}>
                            <Typography variant='caption'>{e.id}</Typography>
                            <Typography>{e.tp}</Typography>
                        </Box>
                    </Paper>
                ))
            }
        </Stack>
    )
}

export const ContextInput = ({ register, name, control, setValue }: any) => {

    return (
        <Box>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <TextareaAutosize
                        value={JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                            field.onChange(JSON.parse(e.target.value))
                        }}
                        minRows={8}
                        style={{ width: '100%', borderColor: 'lightgray' }}
                        placeholder="{}"
                    />
                )}
            />
            {/* <ContextList
                onClick={context => {
                    setValue(name, { id: context.id, tp: context.tp })
                }}
            /> */}
        </Box>
    )

}