import { Field } from "payload/types";

export const getFields = (): Field[] => {
	return [
		{
			name: "cloudflareImageID",
			label: "Cloudflare Image ID",
			type: "text",
			admin: {
				readOnly: true,
				hidden: false,
				position: "sidebar",
			},
			access: {
				read: () => true,
				create: () => false,
				update: () => false,
			},
		},
	];
};
