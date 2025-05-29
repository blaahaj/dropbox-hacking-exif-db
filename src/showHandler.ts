import {
  type DropboxProvider,
  type GlobalOptions,
  writeStderr,
  writeStdout,
} from "@blaahaj/dropbox-hacking-util";
import { ExifDB } from "./exifDB.js";
import { StateDir } from "./stateDir.js";

export const showHandler = async (
  _dbxp: DropboxProvider,
  argv: string[],
  _globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  // `${subShow} STATE_DIR`
  if (argv.length !== 2) return usageFail();

  const statePath = argv[0];
  const exifPath = argv[1];

  const exifDb = new ExifDB(exifPath);
  const stateDir = new StateDir(statePath, exifDb);
  await stateDir.load();
  const state = await stateDir.getState();

  if (state.tag !== "ready") {
    return writeStderr(
      "Error: no listing available - use 'update' first\n",
    ).then(() => process.exit(1));
  }

  const payload = {
    ...state,
  };

  await writeStdout(JSON.stringify(payload) + "\n");
};
