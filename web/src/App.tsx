import React, { useEffect, useState } from 'react'
// import { Box, Typography } from '@mui/material'
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableHead from '@mui/material/TableHead';
// import TableRow from '@mui/material/TableRow';
// import Paper from '@mui/material/Paper';
// import { Tooltip } from '@mui/material';
import {
    createBrowserRouter,
    RouterProvider,
    useNavigate,
    useParams,
    Outlet
} from "react-router-dom";

// import { JSONTree } from 'react-json-tree'

// import OpenLayerTiffRender from './OpenLayerTiffRender';
// import { fromLonLat, transformExtent } from 'ol/proj';
// import { getCenter } from 'ol/extent';
// import DocumentsPage from './DocumentsPage';
// import MethodPage from './MethodPage';
import AgentsPage from './AgentsPage';
import { Box } from '@mui/material';
import Header from './Header';
import SideBar from './SideBar';

// const TasksList = () => {
//     const navigate = useNavigate();
//     const [tasks, setTasks] = useState([]);

//     useEffect(() => {
//         fetch('/api/tasks')
//         .then(response => response.json())
//         .then(tasks => setTasks(tasks.map(t => ({...t, start_time: (new Date(t.start_time)).toLocaleString() }))));
//     }, []);

//     return (
//         <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column'>
//             <h1>Tasks</h1>
//             <TableContainer sx={{ width: '70vw' }} component={Paper}>
//                 <Table aria-label="simple table">
//                     <TableHead>
//                         <TableRow>
//                             <TableCell>Id</TableCell>
//                             <TableCell align="right">Status</TableCell>
//                             <TableCell align="right">Start time</TableCell>
//                             <TableCell align="right">Stacktrace</TableCell>
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                     {tasks.map((task) => (
//                         <TableRow
//                             key={task.id}
//                             sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#e0e0e0' } }}
//                             onClick={() => navigate(`/tasks/${task.id}`)}
//                         >
//                             <TableCell component="th" scope="row">{task.id}</TableCell>
//                             <TableCell align="right">{task.status}</TableCell>
//                             <TableCell align="right">{task.start_time }</TableCell>
//                             <TableCell align="right" sx={{ maxWidth: '100px' }}>{task.stacktrace}</TableCell>
//                         </TableRow>
//                     ))}
//                     </TableBody>
//                 </Table>
//             </TableContainer>
//         </Box>
//     );
// };

// const JSONTreeTheme = {
//     scheme: 'ocean',
//     author: 'chris kempson (http://chriskempson.com)',
//     base00: 'white',
//     base01: '#343d46',
//     base02: '#4f5b66',
//     base03: '#65737e',
//     base04: '#a7adba',
//     base05: '#c0c5ce',
//     base06: '#dfe1e8',
//     base07: '#eff1f5',
//     base08: '#bf616a',
//     base09: '#d08770',
//     base0A: '#ebcb8b',
//     base0B: '#a3be8c',
//     base0C: '#96b5b4',
//     base0D: '#8fa1b3',
//     base0E: '#b48ead',
//     base0F: '#ab7967'
// };

// const JSONView = ({ object }) => {
//     const [json, setJson] = useState({});

//     useEffect(() => {
//         fetch(`/api/storage/${object.path}`)
//         .then(response => response.json())
//         .then(json => setJson(json));
//     }, []);

//     return <JSONTree data={json} theme={JSONTreeTheme} />;
// }

// const ImageView = ({ object }) => {
//     return (
//         <div style={{ cursor: 'pointer' }}>
//             <img width={'400px'} src={`/api/storage/${object.path}`} />
//         </div>
//     );
// }

// const XYZView = ({ object }) => {
    
//     return <OpenLayerTiffRender
//         viewCenter={object.meta.center}
//         xyzSource={{
//             url: `/api/storage/${object.path}/{z}/{x}/{-y}.webp`,
//             tileSize: object.meta.tile_size,
//             minZoom: object.meta.min_zoom,
//             maxZoom: object.meta.max_zoom
//         }}
//         extent={object.meta.extent}
//     />
// }

// const GeoTiffView = ({ object }) => {
//     const extent = transformExtent(object.meta.extent, 'EPSG:4326', 'EPSG:3857');
//     return (
//         <div>
//             <OpenLayerTiffRender
//                 viewCenter={getCenter(extent)}
//                 xyzSource={{
//                     url: `/api/storage/${object.meta.xyz}`,
//                     tileSize: object.meta.tile_size,
//                     minZoom: object.meta.min_zoom,
//                     maxZoom: object.meta.max_zoom
//                 }}
//                 extent={extent}
//             />
//         </div>
//     );
// }

// const ObjectView = ({ object }) => {
//     if (object.type == 'json')
//         return <JSONView object={object} />

//     if (object.type == 'image')
//         return <ImageView object={object} />

//     if (object.type == 'xyz')
//         return <XYZView object={object} />

//     if (object.type == 'geotiff')
//         return <GeoTiffView object={object} />

//     return <span>Unviewable object type {object.type}</span>
// };

// const ObjectsView = () => {
//     const { taskId } = useParams();
//     const [task, setTask] = useState(null);
//     const [objects, setObjects] = useState([]);

//     useEffect(() => {
//         fetch(`/api/tasks/${taskId}`)
//         .then(response => response.json())
//         .then(task => setTask(task));

//         fetch(`/api/objects?task_id=${taskId}`)
//         .then(response => response.json())
//         .then(objects => setObjects(objects));
//     }, []);

//     return (
//         <div style={{ paddingBottom: '8em' }}>
//             <Box display='flex' justifyContent='center'>
//                 <div>
//                     <h1>Task {taskId}</h1>
//                         {
//                             task ?
//                             <>
//                                 <div>{task.status}</div>
//                                 <JSONTree data={task.inputs} theme={JSONTreeTheme} />
//                                 <div>{task.stacktrace}</div>
//                             </>
//                             : null
//                         }
//                     <h1>Objects</h1>
//                 </div>
//             </Box>
//             {
//                 objects.map(object => (
//                     <Box
//                         key={object.id}
//                         sx={{ borderTop: '2px dashed grey', padding: '0.5em' }}
//                         display={'flex'}
//                     >
//                         <Box padding={2} gap={2} color={'grey'} width={'40em'}>
//                             <Typography variant='body2'>Algorithm: {object.algorithm_name}</Typography>
//                             <Typography variant='body2'>ID: {object.id}</Typography>
//                             <Typography variant='body2'>Type: {object.type}</Typography>
//                             <Typography variant='body2'>
//                                 <span>Path: </span>
//                                 <Tooltip
//                                     title={`${window.location.origin}/api/storage/${object.path}`}
//                                     placement="top-start"
//                                 >
//                                     <span style={{ cursor: 'pointer' }}>
//                                         {object.path}
//                                     </span>
//                                 </Tooltip>
//                             </Typography>
//                             <Typography variant='body2'>Path type: {object.path_type}</Typography>
//                             <Typography variant='body2'>Meta: {JSON.stringify(object.meta)}</Typography>
//                         </Box>
//                         <Box width='100%'>
//                             <Box display='flex' justifyContent='center'>
//                                 <ObjectView object={object}/>
//                             </Box>
//                         </Box>
//                     </Box>
//                 ))
//             }
//         </div>
//     )
// };



function Layout() {
    return (
        <>
            <Header />
            <Box display={'flex'} marginTop={'0.5em'}>
                <SideBar />
                <Outlet />
            </Box>
        </>
    );
}

const router = createBrowserRouter([
    // {
    //     path: "/tasks/:taskId",
    //     element: <ObjectsView />,
    // },
    // {
    //     path: "/list",
    //     element: <DocumentsPage />,
    // },
    // {
    //     path: "/ws",
    //     element: <Ws />,
    // },
    // {
    //     path: '/ywpi',
    //     element: <MethodPage />
    // },
    {
        element: <Layout />,
        children: [
            {
                path: "*",
                element: <AgentsPage />
            },
        ]
    }
]);


function App() {
    return (
        <RouterProvider router={router} />
    );
}

export default App;
