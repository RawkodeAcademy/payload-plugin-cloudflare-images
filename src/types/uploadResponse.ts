interface Message {
    message: string;
    code: number;
}

export interface UploadedImage {
    id: string,
    filename: string,
    uploaded: string,
    requireSignedURLs: boolean,
    variants: string[],
    meta: Record<string, string>,
}

export interface UploadResponse {
    success: boolean,
    messages: Message[],
    errors: Message[],
    result: UploadedImage,
}
