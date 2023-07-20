import type { Config } from 'payload/config'
import { getFields } from './fields'
import { getBeforeChangeHook } from './hooks/beforeChange'
import type { PluginOptions } from './types'

export const cloudflareImages =
  (pluginOptions: PluginOptions) =>
    (incomingConfig: Config): Config => {
      const { collections: allCollectionOptions, enabled } = pluginOptions
      const config = { ...incomingConfig }


      config.admin = {
        ...(config.admin || {}),
      }

      if (enabled === false) {
        return config
      }

      const initFunctions: Array<() => void> = []

      return {
        ...config,
        collections: (config.collections || []).map(existingCollection => {
          const options = allCollectionOptions[existingCollection.slug]

          if (options?.adapter) {
            const adapter = options.adapter({
              collection: existingCollection,
              prefix: options.prefix,
            })

            if (adapter.onInit) initFunctions.push(adapter.onInit)

            const fields = getFields();

            const handlers = [
              ...(typeof existingCollection.upload === 'object' &&
                Array.isArray(existingCollection.upload.handlers)
                ? existingCollection.upload.handlers
                : []),
            ]

            if (!options.disablePayloadAccessControl) {
              handlers.push(adapter.staticHandler)
            }

            return {
              ...existingCollection,
              upload: {
                ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
                handlers,
                disableLocalStorage:
                  typeof options.disableLocalStorage === 'boolean'
                    ? options.disableLocalStorage
                    : true,
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
            }
          }

          return existingCollection
        }),
        onInit: async payload => {
          initFunctions.forEach(fn => fn())
          if (config.onInit) await config.onInit(payload)
        },
      }
    }