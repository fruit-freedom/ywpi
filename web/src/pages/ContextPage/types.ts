interface ContextUpdate {
    $push?: {
        [key: string]: any
    };
    $set?: {
        [key: string]: any
    };
}

export interface ContextProps<T = any> {
    data: T;
    contextId: string;
    applyContextUpdate: (update: ContextUpdate) => void;
    forceContextRefetch: () => void;
}
