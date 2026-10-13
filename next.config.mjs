/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // images of the content repo
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      // video thumbnails
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default config;
