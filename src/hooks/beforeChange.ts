import {
	BeforeChangeHook,
	CollectionConfig,
	TypeWithID,
} from "payload/dist/collections/config/types";
import { FileData } from "payload/dist/uploads/types";
import { CloudflareImageService } from "../service";
import { getIncomingFiles } from "../utils";
import { CloudflareImage } from "../types";

interface Args {
	collection: CollectionConfig;
}

export const getBeforeChangeHook =
	({
		collection,
	}: Args): BeforeChangeHook<FileData & TypeWithID & CloudflareImage> =>
	async ({ req, data, originalDoc }) => {
		const service = new CloudflareImageService({});

		try {
			const files = getIncomingFiles({ req, data });

			// No files being uploaded, return data unchanged
			if (files.length === 0) {
				return data;
			}

			// Multiple files being uploaded, throw error
			// This should only happen if Payload's upload
			// is configured with multiple imageSizes, which
			// we try to disable during initialization
			if (files.length > 1) {
				throw new Error(
					"Unexpected multiple files. Cloudflare Images Plugin should disable imageSizes. Please open an issue.",
				);
			}

			const file = files.shift();

			// originalDoc means we had a previously uploaded image,
			// so we best delete it from Cloudflare Images and replace.
			// TODO: We should make the cleanUpPolicy configurable
			if (originalDoc) {
				req.payload.logger.info(
					`Deleting Cloudflare Image ID ${originalDoc["cloudflareImageID"]} to prepare for replacement.`,
				);
				await service.delete(originalDoc["cloudflareImageID"]);
			}

			req.payload.logger.info(
				`Uploading ${file.filename} to Cloudflare Images`,
			);

			const response = await service.upload(file, collection);

			if (!response.success) {
				req.payload.logger.error(
					`There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
				);
				throw new Error(
					`There was an error uploading the file ${file.filename}: ${response.errors[0].message}`,
				);
			}

			req.payload.logger.info(`Got Cloudflare Image ID: ${response.result.id}`);
			data["cloudflareImageID"] = response.result.id;

			// Setting the filename to the delivery filename,
			// so adminThumbnails work as expected
			data.filename = `${response.result.id}/public`;
		} catch (err: unknown) {
			req.payload.logger.error(
				`There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
			);
			req.payload.logger.error(err);
		}
		return data;
	};
