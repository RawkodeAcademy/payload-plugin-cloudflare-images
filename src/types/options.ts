export interface PluginOptions {
    enabled?: boolean;
    accountId?: string;
    apiToken?: string;
    imageDeliveryUrl?: string;
    collections: string[];
}

export interface CollectionOptions {
    disableLocalStorage?: boolean;
}
