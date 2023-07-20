export interface File {
    buffer: Buffer
    filename: string
    filesize: number
    mimeType: string
    tempFilePath?: string
}
