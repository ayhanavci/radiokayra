import { Extension, gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import * as KayraMenu from "./kayramenu.js";
import * as KayraSearchProvider from "./searchProvider.js";

export default class RadioKayraExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    console.info(`constructing ${this.metadata.name}`);
  }
  addSettingsWindow() {}
  enable() {    
    this.menuButton = new KayraMenu.RadiokayraMenuButton(this);
    this._provider = new KayraSearchProvider.SearchProvider(this, this.menuButton);
    Main.overview.searchController.addProvider(this._provider);
    Main.panel.addToStatusArea(this.uuid, this.menuButton);
  }

  disable() {    
    Main.overview.searchController.removeProvider(this._provider);
    this._provider = null;
    this.menuButton?.destroy();
    this.menuButton = null;
  }
}



