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

export const getBeforeChangeHook =
    ({ collection }: Args): BeforeChangeHook<FileData & TypeWithID> =>
        async ({ req, data, originalDoc }) => {
            console.log("getBeforeChangeHook for Cloudflare Images");

            const service = new CloudflareImageService({});

            let returnValue = {};

            returnValue = { ...data };

            try {
                const files = getIncomingFiles({ req, data });

                if (files.length > 0) {
                    console.log("Got a File");

                    // If there is an original doc,
                    // And we have new files,
                    // We need to delete the old files before uploading new
                    if (originalDoc) {
                        let filesToDelete: string[] = [];

                        if (typeof originalDoc?.filename === "string") {
                            filesToDelete.push(originalDoc.filename);
                        }

                        if (typeof originalDoc.sizes === "object") {
                            filesToDelete = filesToDelete.concat(
                                Object.values(originalDoc?.sizes || []).map(
                                    (resizedFileData) => resizedFileData?.filename,
                                ),
                            );
                        }

                        const deletionPromises = filesToDelete.map(async (filename) => {
                            if (filename) {
                                await service.delete(originalDoc.id.toString());
                            }
                        });

                        await Promise.all(deletionPromises);
                    }

                    // Do this sequentially so we can update the array field
                    for (const file of files) {
                        console.log(`Uploading ${file.filename} to Cloudflare Images`);

                        const response = await service.upload(
                            file,
                            collection,
                        );

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

                        const cloudflareImageMap: { originalFilename: string, cloudflareImageID: string }[] = data[ID_MAP_FIELD_NAME] || [];

                        returnValue = {
                            ...returnValue,
                            [ID_MAP_FIELD_NAME]: cloudflareImageMap.push({
                                originalFilename: file.filename,
                                cloudflareImageID: response.result.id,
                            }),
                        };
                    }
                }
            } catch (err: unknown) {
                req.payload.logger.error(
                    `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
                );
                req.payload.logger.error(err);
            }

            return data;
        };
