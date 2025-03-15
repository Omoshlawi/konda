import "dotenv/config";
import config from "config";
import { CookieOptions } from "express";
import path from "path";
export const BASE_DIR = process.cwd();
export const MEDIA_ROOT = path.join(BASE_DIR, "media");
export const MEDIA_URL = "media";
export const PROFILE_URL = "uploads";

export const configuration = {
  version: require("./../../package.json").version,
  name: require("./../../package.json").name,
  db: config.get("db") as string | undefined | null,
  port: config.get("port") as string | undefined | null,
  backend_url: config.get("backend_url") as string,
  redis: config.get("redis_db") as string | undefined | null,
  mqtt: config.get("mqtt_broker") as string | undefined | null,
  registry: {
    url: config.get("registry.url") as string,
    version: config.get("registry.version") as string,
  },
  auth: {
    google_id: config.get("google_client_id") as string,
    google_secrete: config.get("google_client_secrete") as string,
    github_id: config.get("github_client_id") as string,
    github_secrete: config.get("github_client_secrete") as string,
    auth_secrete: config.get("auth_secrete") as string,
    access_token_age: config.get("token.access_expiry") as string,
    refresh_token_age: config.get("token.refresh_expiry") as string,
  },
  authCookieConfig: {
    name: "session-token",
    config: {
      MAX_AGE: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    } as CookieOptions,
  },
};

export const PHONE_NUMBER_REGEX = /^(\+?254|0)((7|1)\d{8})$/;
export const PLATE_NUMBER_REGEX = /^(K[A-Z]{2} \d{3}[A-Z])$|^(\d{3} CD \d{2})$/i;

export const UUID_REGEX =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
export const SEMANTIC_VERSION_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
