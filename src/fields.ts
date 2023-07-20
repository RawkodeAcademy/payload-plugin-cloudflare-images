import { Field } from "payload/types";

export const ID_MAP_FIELD_NAME = "cloudflareImages";

export const getFields = (): Field[] => {
    return [
        {
            name: ID_MAP_FIELD_NAME,
            label: 'Cloudflare Images',
            type: 'array',
            admin: {
                readOnly: true,
                hidden: false,
            },
            fields: [
                {
                    name: "originalFilename",
                    type: "text",
                },
                {
                    name: "cloudflareImageID",
                    type: "text",
                }
            ]
        }
    ]
};
