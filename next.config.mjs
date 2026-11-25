/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ship /data/*.json with the API route so the sample fallback also works on Vercel.
  outputFileTracingIncludes: { "/api/data/[dataset]": ["./data/**/*"] },
  devIndicators: false,
}
export default nextConfig
