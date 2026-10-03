import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: the waitlist pages are static and the API is fully dynamic,
// so there is nothing to revalidate (and no R2 bucket to create).
export default defineCloudflareConfig({});
