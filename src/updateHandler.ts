import {
  type DropboxProvider,
  type GlobalOptions,
  processOptions,
  writeStderr,
} from "@blaahaj/dropbox-hacking-util";
import { ExifDB } from "./exifDB.js";
import { StateDir } from "./stateDir.js";
import { flush, makeLister } from "./makeLister.js";
import type { Handler } from "@blaahaj/dropbox-hacking-util/cli";
import { TAIL } from "./main.js";

export const updateHandler: Handler = async (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subUpdate} [${TAIL}] STATE_DIR`
  let tail = false;

  argv = processOptions(argv, {
    [TAIL]: () => (tail = true),
  });

  if (argv.length !== 2) return usageFail();

  const statePath = argv[0];
  const exifPath = argv[1];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag === "does_not_exist") {
    await writeStderr(
      `Error: no existing state, use 'exif-cache init' first\n`,
    );
    await usageFail();
    process.exit(1);
  }

  const dbx = await dbxp();
  const startCursor = state.cursor;

  const r = makeLister(
    dbx,
    {
      tag: "cursor",
      args: {
        cursor: startCursor,
      },
      tail,
    },
    stateDir,
    globalOptions,
  );

  await r.promise;
  await flush();
  await stateDir.flush();
};
