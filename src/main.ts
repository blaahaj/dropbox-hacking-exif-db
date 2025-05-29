import { DropboxProvider, GlobalOptions } from "@blaahaj/dropbox-hacking-util";
import { showHandler } from "./showHandler.js";
import { initHandler } from "./initHandler.js";
import { updateHandler } from "./updateHandler.js";
import {
  runAsMain,
  type Handler,
  type Operation,
} from "@blaahaj/dropbox-hacking-util/cli";

const verb = "exif-cache";

const subInit = "init";
const subUpdate = "update";
const subShow = "show";
export const RECURSIVE = "--recursive";
export const TAIL = "--tail";

const handler: Handler = (
  dbxp: DropboxProvider,
  argv: string[],
  globalOptions: GlobalOptions,
  usageFail: () => Promise<void>,
): Promise<void> => {
  if (argv[0] === subInit)
    return initHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  if (argv[0] === subUpdate)
    return updateHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  if (argv[0] === subShow)
    return showHandler(dbxp, argv.slice(1), globalOptions, usageFail);
  return usageFail();
};

const argsHelp = [
  `${subInit} [${RECURSIVE}] [${TAIL}] DROPBOX_PATH STATE_DIR EXIF_DIR`,
  `${subUpdate} [${TAIL}] STATE_DIR EXIF_DIR`,
  `${subShow} STATE_DIR EXIF_DIR`,
];

const operation: Operation = { verb, handler, argsHelp };

runAsMain(operation);
