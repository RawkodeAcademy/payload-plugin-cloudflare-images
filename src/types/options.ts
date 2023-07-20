export interface PluginOptions {
    enabled?: boolean;
    accountId?: string;
    apiToken?: string;
    collections: string[];
}

export interface CollectionOptions {
    disableLocalStorage?: boolean;
}
