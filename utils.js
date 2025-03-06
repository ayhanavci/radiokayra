import Gio from "gi://Gio";
import GLib from 'gi://GLib';
import * as Constants from "./constants.js";

export function processSpecialCharacters(str, isEncode) {
  new Map([
    ["&", "&amp;"],
    ["<", "&lt"],
    [">", "&gt"],
    ['"', "&quot;"],
    ["'", "&apos;"],
  ]).forEach((value, key) => {
    if (isEncode) str = str.replaceAll(key, value);
    else str = str.replaceAll(value, key);
  });
  return str;
}

export function isEmptyString(str) {
  return str === "" || str === null || str === undefined;
}

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function saveThumbnail(thumbnailPath, destinationFileName) {  
  try {
      const file = Gio.File.new_for_uri(thumbnailPath);
      const destinationFile = Gio.File.new_for_path(destinationFileName);
      file.copy(destinationFile, Gio.FileCopyFlags.OVERWRITE, null, () => { 
          // Report copy-status:
          /*print ("%" + int64.FORMAT + " bytes of %" + int64.FORMAT + " bytes copied.\n",
              current_num_bytes, total_num_bytes);*/
      });
  }
  catch (error) {
      console.warn(`${Constants.LOG_PREFIX_UTILS} ${Constants.LOG_ERROR_SAVE_THUMBNAIL} 2:  [${error}] [${thumbnailPath}]->[${destinationFileName}]`);
  }
}

export function getConfigPath() { return GLib.get_user_config_dir() + "/" + Constants.CONFIG_FOLDER_NAME; }

export function truncateString(string, limit) { 
    if (string.length <= limit) return string;
    return string.slice(0, limit) + "...";
}

