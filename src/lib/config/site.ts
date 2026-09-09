import { env } from "./env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description: "Managed AI Sales System for Real Estate Companies",
  url: env.NEXT_PUBLIC_APP_URL,
  links: {
    github: "https://github.com/MikkyInnovate/SpaciaOS",
  },
  defaultWorkspace: {
    id: env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID,
    name: "Premier Realty Group",
    role: "Sales Operations",
  },
} as const;

export type SiteConfig = typeof siteConfig;
