import type { ExifData } from "ts-exif-parser";

export type ExifFromHash = {
  exifData: ExifData;
  addedAt: Date;
  firstSeenFilename: string;
};
