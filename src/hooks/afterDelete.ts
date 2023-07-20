import type { TypeWithID } from "payload/dist/globals/config/types";
import type { FileData } from "payload/dist/uploads/types";
import type {
	CollectionAfterDeleteHook,
	CollectionConfig,
} from "payload/types";
import { CloudflareImage } from "../types";
import { CloudflareImageService } from "../service";

interface Args {
	collection: CollectionConfig;
}

export const getAfterDeleteHook = ({
	collection,
}: Args): CollectionAfterDeleteHook<
	FileData & TypeWithID & CloudflareImage
> => {
	const service = new CloudflareImageService({});

	return async ({ req, doc }) => {
		try {
			await service.delete(doc["cloudflareImageID"]);
		} catch (err: unknown) {
			req.payload.logger.error(
				`There was an error while deleting files corresponding to the ${collection.labels?.singular} with ID ${doc.id}:`,
			);
			req.payload.logger.error(err);
		}
		return doc;
	};
};
