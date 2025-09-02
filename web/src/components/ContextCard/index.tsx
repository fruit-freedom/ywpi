import { Box } from "@mui/material"
import { Chat } from "../../pages/ProjectPage/nodes/TextNodes"
import MethodCard from "../MethodCard/MethodCard"


export const ContextCard = () => {
    return (
        <>
            <Box maxHeight={'600px'} overflow={'auto'}>
                <Chat

                />
            </Box>
            <Box mt={'1rem'}>
                <MethodCard
                    agent={{ id: '111' }}
                    method={{
                        name: 'chat',
                        description: 'Chat interface',
                        inputs: [
                            {
                                name: 'message',
                                type: {
                                    name: 'str'
                                }
                            },
                            // {
                            //     name: 'thread_id',
                            //     type: {
                            //         name: 'str'
                            //     }
                            // }
                        ]
                    }}
                />
            </Box>

        </>
    )
}