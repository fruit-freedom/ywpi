import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
    useLocation
} from "react-router-dom";
import { pdfjs } from 'react-pdf';
import AgentsPage from './pages/AgentsPage';
import { Box, Stack } from '@mui/material';
import Header from './Header';
import SideBar from './SideBar';
import MethodPage from './MethodPage';
import { RetrievePage } from './pages/RetrievePage/RetrievePage';
import ProjectPage from './pages/ProjectPage';
import { QueryClient, QueryClientProvider } from 'react-query';
import ProjectsPage from './pages/ProjectsPage';
import { TestPage } from "./pages/TestPage.tsx";
import PDFViewer from "./pages/PDFViewer/index.tsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  
function Layout() {
    const location = useLocation();

    return (
        <Box>
            {/* <Header /> */}
            <Stack direction={'row'} gap={1}>
                {
                    !location.pathname.startsWith('/r') && !location.pathname.startsWith('/p') ?
                    <SideBar />
                    :
                    null
                }
                <Outlet />
            </Stack>
        </Box>
    );
}

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "*",
                element: <AgentsPage />
            },
            {
                path: "/m",
                element: <MethodPage />
            },
            {
                path: '/r',
                element: <RetrievePage />
            },
            {
                path: '/projects',
                element: <ProjectsPage />
            },
            {
                path: '/projects/:projectId',
                element: <ProjectPage />
            },
            {
                path: '/ptest',
                element: <TestPage />
            },
            {
                path: '/pview',
                element: <PDFViewer />
            }
        ]
    }
]);

const queryClient = new QueryClient();


function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}

export default App;
