export interface PluginOptions {
    enabled?: boolean;
    accountId?: string;
    apiToken?: string;
    collections: Record<string, CollectionOptions>;
}

export interface CollectionOptions {
    disableLocalStorage?: boolean;
}
