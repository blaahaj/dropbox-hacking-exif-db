import {
  processOptions,
  type DropboxProvider,
  type GlobalOptions,
} from "@blaahaj/dropbox-hacking-util";
import { ExifDB } from "./exifDB.js";
import { StateDir } from "./stateDir.js";
import { flush, makeLister } from "./makeLister.js";
import { RECURSIVE, TAIL } from "./main.js";

export const initHandler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subInit} [${RECURSIVE}] ${TAIL}] DROPBOX_PATH STATE_DIR`
  let recursive = false;
  let tail = false;

  argv = processOptions(argv, {
    [RECURSIVE]: () => (recursive = true),
    [TAIL]: () => (tail = true),
  });

  if (argv.length !== 3) return usageFail();

  const dropboxPath = argv[0];
  const statePath = argv[1];
  const exifPath = argv[2];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
  await stateDir.initialize(dropboxPath, recursive);

  const dbx = await dbxp();

  const r = makeLister(
    dbx,
    {
      tag: "from_start",
      args: {
        path: dropboxPath,
        recursive,
      },
      tail,
    },
    stateDir,
    globalOptions,
  );

  await r.promise;
  await flush();
  await stateDir.setReady();
};
