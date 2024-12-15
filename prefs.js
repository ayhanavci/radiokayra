import Gio from "gi://Gio";

import * as Utils from "./utils.js";
import * as SearchRadioPageHandler from "./searchradio.js";
import * as SearchYoutubePageHandler from "./searchyoutube.js";
import * as StationsPageHandler from "./stationspage.js";
import * as Constants from "./constants.js";

import { ExtensionPreferences, gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class RadioKayraPreferences extends ExtensionPreferences {
  constructor(metadata) {
    super(metadata);
    console.info(`constructing ${this.metadata.name}`);
  }
  fillPreferencesWindow(window) {
    this._window = window;    
    this._channelsChanged = false;
    this.initGioSubProcess();
    
    //Stations
    this._stationsPageHandler = new StationsPageHandler.StationsPageHandler(this);
    this._stationsPageHandler.createStationsPage();
    
    //Youtube Search
    this._searchYoutubePageHandler = new SearchYoutubePageHandler.SearchYoutubePageHandler(this);
    this._searchYoutubePageHandler.createSearchPage();
    
    //Radio Search
    this._searchRadioPageHandler = new SearchRadioPageHandler.SearchRadioPageHandler(this);
    this._searchRadioPageHandler.createSearchPage();    

    window.connect("close-request", () => {      
      if (this._channelsChanged) {
        let val = Utils.uuidv4();
        this.getSettings().set_string(Constants.SCHEMA_CHANNEL_EVENT, Utils.uuidv4(val));  
      } 
       
      this._searchRadioPageHandler.clear();
      this._searchYoutubePageHandler.clear();
      this._stationsPageHandler.clear();

      this._searchRadioPageHandler = null;
      this._searchYoutubePageHandler = null;
      this._stationsPageHandler = null;
    });
  }  

  //Code blob to make gio subprocesses work. Recommended in gnome matrix chat.
  initGioSubProcess() {
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
  }
}
