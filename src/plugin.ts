import type { Config } from "payload/config";
import { ID_MAP_FIELD_NAME, getFields } from "./fields";
import { getBeforeChangeHook } from "./hooks/beforeChange";
import type { PluginOptions } from "./types";

export const cloudflareImages =
  (pluginOptions: PluginOptions) => (incomingConfig: Config): Config => {
    const { collections: pluginCollections, enabled } = pluginOptions;
    const config = { ...incomingConfig };

    config.admin = {
      ...(config.admin || {}),
    };

    if (enabled === false) {
      console.log("Cloudflare Images disabled");
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

        console.info(
          `Applying Cloudflare Images to ${existingCollection.slug}.`,
        );

        const fields = getFields();

        if (typeof existingCollection.upload === "object") {
          if (existingCollection.upload.imageSizes?.length > 0) {
            console.warn(
              `You have any imageSizes for collection ${existingCollection.slug} defined, they are BEING IGNORED because Cloudflare Images are enabled on the collection.`,
            );
          }
        }

        console.log("Fields are:");
        console.debug({
          ...existingCollection.fields,
          ...fields,
        });

        console.log(process.env.CLOUDFLARE_IMAGE_DELIVERY_URL);

        return {
          ...existingCollection,
          upload: {
            ...(typeof existingCollection.upload === "object"
              ? { ...existingCollection.upload, imageSizes: [] }
              : {}),
            handlers,
            disableLocalStorage: true,
            staticURL: process.env.CLOUDFLARE_IMAGE_DELIVERY_URL,
            adminThumbnail: 'square'
          },
          hooks: {
            ...(existingCollection.hooks || {}),
            beforeChange: [
              ...(existingCollection.hooks?.beforeChange || []),
              getBeforeChangeHook({ collection: existingCollection }),
            ],
            // afterDelete: [
            //   ...(existingCollection.hooks?.afterDelete || []),
            //   getAfterDeleteHook({ collection: existingCollection }),
            // ],
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
