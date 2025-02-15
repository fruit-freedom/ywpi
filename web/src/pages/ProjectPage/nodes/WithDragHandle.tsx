import { Stack } from "@mui/material"

export const WithDragHandle = ({ children }: any) => {
    return (
        <div style={{ userSelect: 'text' }} className="select-control">
            <Stack flexDirection={'row'} justifyContent={'flex-end'}>
                <div
                    style={{
                        width: '100%',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#e9e9e999',
                        marginBottom: '4px',
                        cursor: 'pointer'
                    }}
                    className="custom"
                />
            </Stack>
            {children}
        </div>
    )
}
