import type { Config } from "payload/config";
import { getFields } from "./fields";
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
        console.log(`Adding Cloudflare Images to ${existingCollection.slug}`);

        const fields = getFields();

        const handlers = [
          ...(typeof existingCollection.upload === "object" &&
            Array.isArray(existingCollection.upload.handlers)
            ? existingCollection.upload.handlers
            : []),
        ];

        console.info(
          `Applying Cloudflare Images to ${existingCollection.slug}.`,
        );

        if (existingCollection.upload) {
          if (typeof existingCollection.upload === "object") {
            if (existingCollection.upload.imageSizes.length > 0) {
              console.warn(`You have any imageSizes for collection ${existingCollection.slug} defined, they are BEING IGNORED because Cloudflare Images are enabled on the collection.`,
              );
            }
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
          fields,
        };
      }),
      onInit: async (payload) => {
        initFunctions.forEach((fn) => fn());
        if (config.onInit) await config.onInit(payload);
      },
    };
  };
