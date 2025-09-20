import type { MetadataRoute } from "next";

import {
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  MEMBER_ROUTES,
  ROOT_PATH,
} from "@/shared/constants/routes";
import { getAppBaseUrl } from "@/shared/utils/url";

const STATIC_PATHS = [
  ROOT_PATH,
  AUTH_LOGIN_PATH,
  AUTH_SIGNUP_PATH,
  ...MEMBER_ROUTES,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();
  const lastModified = new Date();

  return STATIC_PATHS.map((path) => ({
    url: path === ROOT_PATH ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency: path === ROOT_PATH ? "daily" : "monthly",
    priority: path === ROOT_PATH ? 1 : 0.6,
  }));
}
