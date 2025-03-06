import Gio from "gi://Gio";

import * as Utils from "./utils.js";
import * as SearchRadioPageHandler from "./prefssearchradio.js";
import * as SearchYoutubePageHandler from "./prefssearchyoutube.js";
import * as StationsPageHandler from "./prefsstationspage.js";
import * as SettingsPageHandler from "./prefssettingsspage.js";
import * as AboutPageHandler from "./prefsaboutspage.js";
import * as Constants from "./constants.js";

import { ExtensionPreferences, gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

//glib-compile-schemas schemas/
export default class RadioKayraPreferences extends ExtensionPreferences {
  constructor(metadata) {
    super(metadata);
    console.info(`constructing ${this.metadata.name}`);
  }
  fillPreferencesWindow(window) {
    this._window = window;        
    this._channelsChanged = false;        
    
    //Stations
    this._stationsPageHandler = new StationsPageHandler.StationsPageHandler(this);
    this._stationsPageHandler.createPage();
    
    //Youtube Search
    this._searchYoutubePageHandler = new SearchYoutubePageHandler.SearchYoutubePageHandler(this);
    this._searchYoutubePageHandler.createPage();
    
    //Radio Search
    this._searchRadioPageHandler = new SearchRadioPageHandler.SearchRadioPageHandler(this);
    this._searchRadioPageHandler.createPage();    

    //Settings
    this._settingsPageHandler = new SettingsPageHandler.SettingsPageHandler(this);
    this._settingsPageHandler.createPage();

    //About
    this._aboutPageHandler = new AboutPageHandler.AboutPageHandler(this);
    this._aboutPageHandler.createPage();

    window.connect("close-request", () => {      
      if (this._channelsChanged) {
        let val = Utils.uuidv4();
        this.getSettings().set_string(Constants.SCHEMA_CHANNELS_CHANGE_EVENT, Utils.uuidv4(val));  
      } 
       
      this._searchRadioPageHandler.clear();
      this._searchYoutubePageHandler.clear();
      this._stationsPageHandler.clear();
      this._settingsPageHandler.clear();

      this._searchRadioPageHandler = null;
      this._searchYoutubePageHandler = null;
      this._stationsPageHandler = null;
      this._settingsPageHandler = null;
    });
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