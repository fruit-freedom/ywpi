import {
    createBrowserRouter,
    RouterProvider,
    Outlet
} from "react-router-dom";
import { pdfjs } from 'react-pdf';
import AgentsPage from "./pages/AgentsPage/index.tsx";
import { Box } from '@mui/material';
import Header from './Header';
import MethodPage from './MethodPage';
import { RetrievePage } from './pages/RetrievePage/RetrievePage';
import ProjectPage from './pages/ProjectPage';
import { QueryClient, QueryClientProvider } from 'react-query';
import ProjectsPage from './pages/ProjectsPage';
import { TestPage } from "./pages/TestPage.tsx";
import PDFViewer from "./pages/PDFViewer/index.tsx";
import ChatPage from "./pages/ChatPage/index.tsx";
import { ContextPage } from "./pages/ContextPage/index.tsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  
function Layout() {
    return (
        <Box>
            <Header />
            <Outlet />
        </Box>
    );
}

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/chat",
                element: <ChatPage />
            },
            {
                path: "/agents",
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
                path: '*',
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
            },
            {
                path: '/projects/:projectId/contexts/:contextId',
                element: <ContextPage />
            },
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
