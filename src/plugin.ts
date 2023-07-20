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

        return {
          ...existingCollection,
          upload: {
            ...(typeof existingCollection.upload === "object"
              ? existingCollection.upload
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
