export interface Explain {
    name: string[];
    claims: string[];
    keywords: string[];
    activities: string[];
    mpk_indices: string[];
}

export interface Doc {
    id: string;
    score: number;
    keywords: string[];
    activities: string[];
    explain?: Explain;
}

export interface Org {
    id: string;
    docs: Doc[];
    score?: number;
}

export interface LlamaIndexDocument {
    doc_id: string;
    text: string;
    metadata: any;
}

export interface RetrieveResponse {
    __others__: LlamaIndexDocument[];
}

export interface Document {
    id: string;
    number: string;
    name: string;
    type: DocumentType;
    abstract: string;
    description: string;
    claims: string;
    mpk_indices: string[];
    pdf_path: string;
    publication_date: string;
    doi?: string;
    journal?: string;
    superviser?: string;
    execution_period?: string;
    customer?: string;
}

export interface Organization {
    id: string;
    name: string;
    technical_brokers: string[];
    city: string;
    addresses: string[];
    website: string;
    telephone: string;
    email: string;
    extra_info?: any;
    short_name?: string;
}
