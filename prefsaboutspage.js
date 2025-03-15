import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export const AboutPageHandler = class AboutPageHandler {
    constructor(kayraPrefs) {
        this._kayraPrefs = kayraPrefs;
        this._window = kayraPrefs._window; 
        this._schema = this._kayraPrefs.getSettings();     
    }
    clear() { 
        this._settingGroup = null;
        this._settingsPage = null;  
        this._rows = null;
    }
    createPage() {
        this._aboutPage = new Adw.PreferencesPage();
        this._aboutPage.title = _("About");        
        this._aboutPage.icon_name = Constants.ICON_ABOUT;
    
        this._window.add(this._aboutPage);
        this._rows = [];        
                
        this.about = new Adw.PreferencesGroup({ title: _('Radio Kayra v2.1\nA foss hobby project by Ayhan Avcı (2024-2025)'), description: _("Mid clicking the radio icon toggles play / stop.\nDon't forget to install yt-dlp &amp; gstreamer. Links at the bottom. Enjoy!")});
        this._aboutPage.add(this.about);        
                                                       
        this._urlsGroup = new Adw.PreferencesGroup({ title: _('Links')});        

        let row = new Adw.ActionRow();
        row.title = _("Project");
        let newLink = new Gtk.LinkButton({
          valign: Gtk.Align.CENTER,
          label: "https://github.com/ayhanavci/radiokayra",
          focusable: 1,
          uri: "https://github.com/ayhanavci/radiokayra"
        });        
        row.add_suffix(newLink);        
        this._urlsGroup.add(row); 
        
        row = new Adw.ActionRow();
        row.title = _("Extension");
        newLink = new Gtk.LinkButton({
          valign: Gtk.Align.CENTER,
          label: "https://extensions.gnome.org/extension/7649/radio-kayra/",
          focusable: 1,
          uri: "https://extensions.gnome.org/extension/7649/radio-kayra/"
        });        
        row.add_suffix(newLink);        
        this._urlsGroup.add(row); 

        row = new Adw.ActionRow();
        row.title = _("Yt-dlp");
        newLink = new Gtk.LinkButton({
          valign: Gtk.Align.CENTER,
          label: "https://github.com/yt-dlp/yt-dlp/wiki/Installation",
          focusable: 1,
          uri: "https://github.com/yt-dlp/yt-dlp/wiki/Installation"
        });        
        row.add_suffix(newLink);        
        this._urlsGroup.add(row); 
        
        row = new Adw.ActionRow();
        row.title = _("GStreamer");
        newLink = new Gtk.LinkButton({
          valign: Gtk.Align.CENTER,
          label: "https://gstreamer.freedesktop.org/download/#linux",
          focusable: 1,
          uri: "https://gstreamer.freedesktop.org/download/#linux"
        });        
        row.add_suffix(newLink);        
        this._urlsGroup.add(row);         

        this._aboutPage.add(this._urlsGroup);
      }           
 
}