import {
    createBrowserRouter,
    RouterProvider,
    Outlet,
    useNavigate
} from "react-router-dom";
import { pdfjs } from 'react-pdf';
import AgentsPage from "./pages/AgentsPage/index.tsx";
import { Box, createTheme, ThemeProvider } from '@mui/material';
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
import { setNavigateRef } from "./navigate.ts";
import WorkflowPage from "./pages/WorkflowPage/index.tsx";
import WorkflowsPage from "./pages/WorkflowsPage/index.tsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  
function Layout() {
    const navigate = useNavigate();
    setNavigateRef(navigate);

    return (
        <Box
            height={"100vh"}
        >
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
            {
                path: '/workflows/:workflowId',
                element: <WorkflowPage />
            },
            {
                path: '/workflows',
                element: <WorkflowsPage />
            },
        ]
    }
]);

const queryClient = new QueryClient();

const theme = createTheme({
    palette: {
        primary: {
            main: "#171717"
        },
        secondary: {
            main: "#f5f5f5"
        }
    },
    components: {
        MuiButton: {
            defaultProps: {
                style: {
                    fontWeight: 700,
                    // width: 'min-content'
                },
            },
        },
        MuiPaper: {
            defaultProps: {
                style: {
                    boxShadow: "none",
                    border: "1px solid #d4d4d4",
                    borderRadius: "7px"
                }
            }
        }
    },
});



function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <RouterProvider router={router} />
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
