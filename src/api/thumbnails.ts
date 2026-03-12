import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, UserForbiddenError } from "./errors";

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
  const maxUploadSize = 2 << 20;
  if (file.size > maxUploadSize) {
    throw new BadRequestError("Thumbnail file is too large (max 10MB)");
  }
  const fileType = file.type;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const stringBuffer = fileBuffer.toString("base64");
  const dataUrl = `data:${fileType};base64,${stringBuffer}`;
  const video = getVideo(cfg.db, videoId);
  if (userID !== video?.userID) {
    throw new UserForbiddenError("You don't have permission to upload a thumbnail for this video");
  }

  video.thumbnailURL = dataUrl;
  updateVideo(cfg.db, video);

  return respondWithJSON(200, video);
}
