import { type ListerArgs, lister } from "@blaahaj/dropbox-hacking-lister";
import {
  type GlobalOptions,
  makePromiseLimiter,
} from "@blaahaj/dropbox-hacking-util";
import type { Dropbox, files } from "dropbox";
import type { StateDir } from "./stateDir.js";
import { ExifParserFactory } from "ts-exif-parser";
import { createFetcher, type Fetcher } from "./fetcher.js";

let pendingItems: Promise<void>[] = [];

export const flush = () =>
  Promise.all(pendingItems).then(() => {
    pendingItems = [];
  });

const doItem = async (
  _dbx: Dropbox,
  item: files.FileMetadata,
  stateDir: StateDir,
  fetcher: Fetcher,
): Promise<void> => {
  if (item.content_hash === undefined) return;
  if (item.path_lower === undefined) return;
  if (item.path_display === undefined) return;
  if (!item.path_lower.endsWith(".jpg")) return;

  if (stateDir.hasContentHash(item.content_hash)) return;

  const contentHash = item.content_hash;
  const pathDisplay = item.path_display;

  pendingItems.push(
    fetcher
      .fetch(item)
      .then((buffer) => ExifParserFactory.create(buffer).parse())
      .then((exifData) => stateDir.addFile(contentHash, exifData, pathDisplay)),
  );
};

export const makeLister = (
  dbx: Dropbox,
  listerArgs: ListerArgs,
  stateDir: StateDir,
  globalOptions: GlobalOptions,
) => {
  const limiter = makePromiseLimiter<Buffer>(5, "exif-cache-limiter");
  const fetcher = createFetcher(dbx, limiter, globalOptions);

  return lister({
    dbx,
    listing: listerArgs,
    onItem: async (item) => {
      if (item[".tag"] === "file") await doItem(dbx, item, stateDir, fetcher);
    },
    onCursor: (cursor) =>
      stateDir
        .setCursor(cursor)
        .then(() => flush())
        .then(() => stateDir.flush()),
    onPause: () => flush().then(() => stateDir.setReady()),
    globalOptions,
  });
};
