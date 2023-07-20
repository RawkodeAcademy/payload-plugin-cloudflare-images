import {
    BeforeChangeHook,
    CollectionConfig,
    TypeWithID,
} from "payload/dist/collections/config/types";
import { FileData } from "payload/dist/uploads/types";
import { CloudflareImageService } from "../service";
import { getIncomingFiles } from "../utils";

interface Args {
    collection: CollectionConfig;
}

export const getBeforeChangeHook =
    ({ collection }: Args): BeforeChangeHook<FileData & TypeWithID> =>
        async ({ req, data, originalDoc }) => {
            console.log("getBeforeChangeHook for Cloudflare Images");

            const service = new CloudflareImageService({});

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

                    const promises = files.map(async (file) => {
                        console.log("Uploading File");
                        const response = await service.upload(
                            file.filename,
                            file.buffer,
                            collection,
                        );

                        console.log("FINISHED");
                        console.debug(response);

                        console.log(`Got Cloudflare Image ID: ${response.result.id}`);

                        return {
                            ...data,
                            cloudflareImageID: response.result.id,
                        };
                    });

                    await Promise.all(promises);
                }
            } catch (err: unknown) {
                req.payload.logger.error(
                    `There was an error while uploading files corresponding to the collection ${collection.slug} with filename ${data.filename}:`,
                );
                req.payload.logger.error(err);
            }

            return data;
        };
