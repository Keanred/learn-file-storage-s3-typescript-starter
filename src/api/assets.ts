import { existsSync, mkdirSync } from "fs";
import path from "path";

import type { ApiConfig } from "../config";

export function ensureAssetsDir(cfg: ApiConfig) {
  if (!existsSync(cfg.assetsRoot)) {
    mkdirSync(cfg.assetsRoot, { recursive: true });
  }
}

export function getAssetsURL(cfg: ApiConfig, fileName: string) {
  return `http://localhost:${cfg.port}/assets/${fileName}`;
}

export function getAssetDiskPath(cfg: ApiConfig, fileName: string) {
  return path.join(cfg.assetsRoot,fileName);
}

export function mediaTypeToExtension(mediaType: string) {
  const type = mediaType.split("/")[1];
  return `.${type}`;
}
