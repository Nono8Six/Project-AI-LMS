import type { MetadataRoute } from "next";

import {
  ADMIN_PREFIX,
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  ROOT_PATH,
  UNAUTHORIZED_PATH,
} from "@/shared/constants/routes";
import { ORPC_PREFIX } from "@/shared/constants/api";
import { getAppBaseUrl } from "@/shared/utils/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ROOT_PATH,
        disallow: [
          `${ADMIN_PREFIX}/*`,
          `${ORPC_PREFIX}/*`,
          "/_next/*",
          UNAUTHORIZED_PATH,
          AUTH_LOGIN_PATH,
          AUTH_SIGNUP_PATH,
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
