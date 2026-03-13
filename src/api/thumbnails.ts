import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { getAssetDiskPath, getAssetsURL, mediaTypeToExtension } from "./assets";
import { randomBytes } from "crypto";

export async function handlerUploadThumbnail(cfg: ApiConfig, req: BunRequest) {
  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  console.log("uploading thumbnail for video", videoId, "by user", userID);

  const formData = await req.formData()
  const file = formData.get("thumbnail");
  if (!(file instanceof File)) {
    throw new BadRequestError("Invalid thumbnail file");
  }
  const maxUploadSize = 10 << 20;
  if (file.size > maxUploadSize) {
    throw new BadRequestError("Thumbnail file is too large (max 10MB)");
  }
  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Video not found");
  }
  if (userID !== video.userID) {
    throw new UserForbiddenError("You don't have permission to upload a thumbnail for this video");
  }
  const fileType = file.type;
  if (fileType !== "image/jpeg" && fileType !== "image/png") {
    throw new BadRequestError("Invalid thumbnail file type (only JPEG and PNG are allowed)");
  }
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const ext = mediaTypeToExtension(fileType);
  const rbytes= randomBytes(32);
  const bytestring = rbytes.toString("base64url");
  const filePath = getAssetDiskPath(cfg, `${bytestring}${ext}`);
  await Bun.write(filePath, fileBuffer);

  video.thumbnailURL = getAssetsURL(cfg, `${bytestring}${ext}`);
  updateVideo(cfg.db, video);

  return respondWithJSON(200, video);
}
