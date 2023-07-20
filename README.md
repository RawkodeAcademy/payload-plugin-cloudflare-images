# Cloudflare Images Plugin for Payload CMS

This plugin allows you to store images uploaded to PayloadCMS with Cloudflare Images, removing the need for any local storage.

This plugin disables `imageSizes` on your upload collections, as Cloudflare Images provides variants; that I assume you'll be using if you're using Cloudflare Images.

#### Requirements

- Payload version `1.0.0` or higher is required, previous versions are untested.

## Installation

`pnpm add @rawkode.academy/payload-plugin-cloudflare-images`

Feel free you use `npm` or `yarn` if you prefer.

## Authentication

You'll need to pass your Cloudflare credentials and account ID through the `cloudflareImages` function object, or use the following environment variables:

`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_IMAGE_DELIVERY_URL`

## Usage

```ts
import { cloudflareImages } from '@rawkode.academy/payload-plugin-cloudflare-images';

export default buildConfig({
  plugins: [
    cloudflareImages({
      collections: [
        Collection.slug,
      ]
    }),
  ],
});
```

### Conditionally Enabling/Disabling

The proper way to conditionally enable/disable this plugin is to use the `enabled` property.

```ts
cloudflareImages({
  enabled: process.env.NODE_ENV === 'prod',
}),
```
