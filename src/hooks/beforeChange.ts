import {
    BeforeChangeHook,
    CollectionConfig,
    TypeWithID,
} from "payload/dist/collections/config/types";
import { FileData } from "payload/dist/uploads/types";
import { CloudflareImageService } from "../service";
import { getIncomingFiles } from "../utils";
import { ID_MAP_FIELD_NAME } from "../fields";

interface Args {
    collection: CollectionConfig;
}

interface CloudflareImage {
    [ID_MAP_FIELD_NAME]: string;
}

export const getBeforeChangeHook =
    ({
        collection,
    }: Args): BeforeChangeHook<FileData & TypeWithID & CloudflareImage> =>
        async ({ req, data, originalDoc }) => {
            console.log("getBeforeChangeHook for Cloudflare Images");

            const service = new CloudflareImageService({});

            let returnValue = {};

            returnValue = { ...data };

            try {
                const files = getIncomingFiles({ req, data });

                if (files.length === 0) {
                    return data;
                }

                if (files.length > 1) {
                    throw new Error(
                        "Unexpected multiple files. Plugin should disable imageSizes. Please open an issue.",
                    );
                }

                const file = files[0];

                if (originalDoc) {
                    console.log(
                        `Replacing Image and Deleting Cloudflare ID ${originalDoc[ID_MAP_FIELD_NAME]}`,
                    );
                    await service.delete(originalDoc[ID_MAP_FIELD_NAME]);
                }

                console.log(`Uploading ${file.filename} to Cloudflare Images`);

                const response = await service.upload(file, collection);

                console.log("FINISHED");
                console.debug(response);

                if (!response.success) {
                    req.payload.logger.error(
                        `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
                    );
                    throw new Error(
                        `There was an error uploading the file ${file.filename}: ${response.errors[0].message}`,
                    );
                }

                console.log(`Got Cloudflare Image ID: ${response.result.id}`);
                data.filename = `${response.result.id}/public`;
                data[ID_MAP_FIELD_NAME] = response.result.id;
            } catch (err: unknown) {
                req.payload.logger.error(
                    `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
                );
                req.payload.logger.error(err);
            }

            console.debug(data);

            return data;
        };
