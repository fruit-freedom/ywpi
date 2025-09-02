import { Typography, Box } from "@mui/material";
import { default as SourceMarkdown } from "react-markdown";

export const Markdown = ({ children }) => {
    return (
        <SourceMarkdown
            components={{
                h1: ({ node, ...props }) => <Typography variant="h4" {...props} />,
                h2: ({ node, ...props }) => <Typography variant="h4" {...props} />,
                h3: ({ node, ...props }) => <Typography variant="h4" {...props} />,
                h4: ({ node, ...props }) => <Typography variant="h4" gutterBottom {...props} />,
                h5: ({ node, ...props }) => <Typography variant="h5" gutterBottom {...props} />,
                h6: ({ node, ...props }) => <Typography variant="h6" gutterBottom {...props} />,
                p: ({ node, ...props }) => <Typography variant="body1" {...props} />,
                strong: ({ node, ...props }) => (
                    <Typography component="span" fontWeight="bold" {...props} />
                ),
                em: ({ node, ...props }) => (
                    <Typography component="span" fontStyle="italic" {...props} />
                ),
                ul: ({ node, ...props }) => (
                    <Box component="ul" sx={{ paddingLeft: 2 }} {...props}>
                        <Typography {...props} />
                    </Box>
                ),
                ol: ({ node, ...props }) => (
                    <Box component="ol" sx={{ paddingLeft: 2 }} {...props}>
                        <Typography {...props} />
                    </Box>
                ),
                li: ({ node, ...props }) => (
                    <Box component="li" {...props}>
                        <Typography {...props} />
                    </Box>
                ),
                blockquote: ({ node, ...props }) => (
                    <Box
                        component="blockquote"
                        sx={{ borderLeft: '4px solid #ccc', margin: 2 }}
                    >
                        <Typography {...props} />
                    </Box>
                ),
                code: ({ node, ...props }) => (
                    <Typography
                        component="code"
                        sx={{ padding: '2px 4px', backgroundColor: '#8b8b8b30', borderRadius: '4px' }}
                        {...props}
                    />
                ),
                pre: ({ node, ...props }) => (
                    <Box
                        component="pre"
                        sx={{ overflowX: 'auto' }}
                        {...props}
                    />
                ),
            }}
        >
            {children}
        </SourceMarkdown>
    );
}
