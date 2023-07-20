import { CollectionConfig } from "payload/types";
import { UploadResponse } from "./types";

interface Config {
  accountId?: string;
  apiToken?: string;
}

export class CloudflareImageService {
  private config: Config;
  private baseUrl: string;

  constructor(
    config: Config,
  ) {
    this.config = config;

    // Environment variables always take precedence
    if (process.env.CLOUDFLARE_ACCOUNT_ID) {
      this.config.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    }
    if (process.env.CLOUDFLARE_API_TOKEN) {
      this.config.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    }

    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1`;
  }

  async upload(
    filename: string,
    buffer: Buffer,
    collectionConfig: CollectionConfig
  ): Promise<UploadResponse> {
    console.log("Cloudflare Images upload ...");
    const formData = new FormData();

    formData.append("file", new Blob([buffer]), filename);
    formData.append("metadata", JSON.stringify({
      collection: collectionConfig?.slug,
    }));
    formData.append("requireSignedURLs", "false");

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "X-Auth-Key": this.config.apiToken,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    return await response.json() as UploadResponse;
  }

  async delete(imageId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${imageId}`, {
      method: "DELETE",
      headers: {
        "X-Auth-Key": this.config.apiToken,
      }
    });

    return response.ok;
  }
}
