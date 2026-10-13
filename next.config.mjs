/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // lets a phone on the home network load the dev server, to check pages on a real device
  allowedDevOrigins: ['192.168.*.*'],
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
