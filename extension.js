import { Extension, gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Gio from "gi://Gio";
import * as KayraMenu from "./kayramenu.js";

export default class RadioKayraExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    //console.info(`constructing ${this.metadata.name}`);
  }
  
  enable() {                 
    this.menuButton = new KayraMenu.RadiokayraMenuButton(this);        
    this._provider = null;    
    Main.panel.addToStatusArea(this.uuid, this.menuButton);    
  }

  disable() {          
    this.menuButton?.destroy();
    this.menuButton = null;
  }    
}

//Code blob to make gio subprocesses work. Recommended in gnome matrix chat.
/* Gio.Subprocess */
Gio._promisify(Gio.Subprocess.prototype, "communicate_async");
Gio._promisify(Gio.Subprocess.prototype, "communicate_utf8_async");
Gio._promisify(Gio.Subprocess.prototype, "wait_async");
Gio._promisify(Gio.Subprocess.prototype, "wait_check_async");

/* Ancillary Methods */
Gio._promisify(
    Gio.DataInputStream.prototype,
    "read_line_async",
    "read_line_finish_utf8",
);
Gio._promisify(Gio.OutputStream.prototype, "write_bytes_async");