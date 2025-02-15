export const nodes = [
    {
        id: 'sm4das36',
        type: 'text',
        data: { text: ` 3. Extract Phase
            - Identify Data Sources: Determine where your data will come from (e.g., databases, APIs, flat files, etc.).
            - Data Extraction Mechanism: Use connectors, drivers, or APIs to retrieve data. Ensure you handle authentication if needed.
            - Incremental vs Full Extract: Decide whether to extract full datasets or only changes (incremental loading).
            - Schedule Extraction: Set up a schedule for data extraction based on business needs.`
        },
        position: { x: 800, y: 400 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'sm4das37',
        type: 'text',
        data: { text: ` 4. Transform Phase
            - Data Cleaning: Remove duplicates, handle missing values, and ensure data types are consistent.
            - Data Transformation: Apply the necessary transformations based on business rules (e.g., aggregations, calculations, data type conversions).
            - Data Enrichment: Combine data from various sources to enhance its value and provide a more comprehensive view.`
        },
        position: { x: 800, y: 700 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'doc1',
        type: 'pdf',
        data: {
            name: 'Reqo: A Robust and Explainable Query Optimization Cost Model',
            src: 'https://arxiv.org/pdf/2501.17414'
        },
        position: { x: 300, y: 300 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'doc2',
        type: 'pdf',
        data: {
            name: 'Extractive Schema Linking for Text-to-SQL',
            src: 'https://arxiv.org/pdf/2501.17174'
        },
        position: { x: 100, y: 1000 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'sm4das39',
        type: 'json',
        data: {  },
        position: { x: 900, y: 0 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'sm4das40',
        type: 'retriever',
        data: {  },
        position: { x: -400, y: 500 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
    {
        id: 'sm4das41',
        type: 'strings',
        data: {  },
        position: { x: 900, y: 200 },
        targetPosition: 'left',
        dragHandle: '.custom',
    },
]

export const edges = [
    {
        id: 'e34-10',
        source: 'doc1',
        target: 'sm4das41',
    },
    {
        id: 'e34-3',
        source: 'doc1',
        target: 'sm4das39',
    },
    {
        id: 'e34-1',
        source: 'doc1',
        target: 'sm4das36',
    },
    {
        id: 'e34-2',
        source: 'doc1',
        target: 'sm4das37',
    },
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
    },
    {
        id: 'e2a-3',
        source: '2',
        target: '3',
        sourceHandle: 'a',
        animated: true,
    },
    {
        id: 'eg12',
        source: 'sm4das34',
        target: '3',
        sourceHandle: 'b',
    },
    {
        id: 'eg13',
        source: 'sm4das33',
        target: '3',
        sourceHandle: 'b',
    },
    {
        id: 'e2b-4',
        source: '2',
        target: '4',
        sourceHandle: 'b',
        animated: true,
    },
]