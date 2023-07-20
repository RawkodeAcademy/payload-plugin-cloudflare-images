import type { Config } from "payload/config";
import { getFields } from "./fields";
import { getAfterDeleteHook } from "./hooks/afterDelete";
import { getBeforeChangeHook } from "./hooks/beforeChange";
import type { PluginOptions } from "./types";

export const cloudflareImages =
	(pluginOptions: PluginOptions) => (incomingConfig: Config): Config => {
		const { collections: enableForCollections, enabled } = pluginOptions;
		const config = { ...incomingConfig };

		config.admin = {
			...(config.admin || {}),
		};

		if (enabled === false) {
			console.info("Cloudflare Images Plugin Disabled");
			return config;
		}

		const initFunctions: Array<() => void> = [];

		return {
			...config,
			collections: (config.collections || []).map((existingCollection) => {
				const handlers = [
					...(typeof existingCollection.upload === "object" &&
					Array.isArray(existingCollection.upload.handlers)
						? existingCollection.upload.handlers
						: []),
				];

				if (!existingCollection.upload) {
					return existingCollection;
				}

				if (!enableForCollections.includes(existingCollection.slug)) {
					return existingCollection;
				}

				console.info(
					`Enabling Cloudflare Images for Collection: ${existingCollection.slug}.`,
				);

				const fields = getFields();

				if (typeof existingCollection.upload === "object") {
					if (existingCollection.upload.imageSizes?.length > 0) {
						console.warn(
							`You have any imageSizes for collection ${existingCollection.slug} defined, they are BEING IGNORED because Cloudflare Images are enabled on the collection.`,
						);
					}
				}

				return {
					...existingCollection,
					upload: {
						...(typeof existingCollection.upload === "object"
							? { ...existingCollection.upload, imageSizes: [] }
							: {}),
						handlers,
						disableLocalStorage: true,
						// TODO: Is this the best way to bring this in?
						staticURL: process.env.CLOUDFLARE_IMAGE_DELIVERY_URL,
						// TODO: This should probably be configurable
						adminThumbnail: "public",
					},
					hooks: {
						...(existingCollection.hooks || {}),
						beforeChange: [
							...(existingCollection.hooks?.beforeChange || []),
							getBeforeChangeHook({ collection: existingCollection }),
						],
						afterDelete: [
							...(existingCollection.hooks?.afterDelete || []),
							getAfterDeleteHook({ collection: existingCollection }),
						],
					},
					fields: [...existingCollection.fields, ...fields],
				};
			}),
			onInit: async (payload) => {
				initFunctions.forEach((fn) => fn());
				if (config.onInit) await config.onInit(payload);
			},
		};
	};
