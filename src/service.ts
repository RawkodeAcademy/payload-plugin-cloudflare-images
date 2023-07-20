import { CollectionConfig } from "payload/types";
import { File, UploadResponse } from "./types";

interface Config {
  accountId?: string;
  apiToken?: string;
  imageDeliveryUrl?: string;
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
    if (process.env.CLOUDFLARE_IMAGE_DELIVERY_URL) {
      this.config.imageDeliveryUrl = process.env.CLOUDFLARE_IMAGE_DELIVERY_URL;
    }

    console.debug(this.config);

    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/images/v1`;
  }

  getImageDeliveryUrl(): string {
    return this.config.imageDeliveryUrl;
  }

  async upload(
    file: File,
    collectionConfig: CollectionConfig
  ): Promise<UploadResponse> {
    console.log("Cloudflare Images upload ...");
    const formData = new FormData();

    formData.append("metadata", JSON.stringify({
      collection: collectionConfig?.slug,
    }));
    formData.append("file", new Blob([file.buffer]), file.filename);


    console.debug(formData);

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
      },
      body: formData,
    });

    return await response.json() as UploadResponse;
  }

  async delete(imageId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${imageId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
      }
    });

    return response.ok;
  }
}
