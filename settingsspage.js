import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import * as Constants from "./constants.js";

import { ExtensionPreferences, gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export const SettingsPageHandler = class SettingsPageHandler {
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
    createSettingsPage() {
        this._settingsPage = new Adw.PreferencesPage();
        this._settingsPage.title = "Settings";        
        this._settingsPage.icon_name = Constants.ICON_SETTINGS;
    
        this._window.add(this._settingsPage);
        this._rows = [];        
                
        this.asd = new Adw.PreferencesGroup({ title: _('Radio Kayra v2.0. A foss hobby project by Ayhan Avcı (2024-2025)'), description: _("Mid click toggles play / stop.\nDon't forget to install yt-dlp &amp; gstreamer. Links at the bottom. Enjoy!")});
        this._settingsPage.add(this.asd);        
        
        //Settings
        this._settingsGroup = new Adw.PreferencesGroup();
        
        //HOVER
        this._show_hover_tooltip = new Adw.SwitchRow({
            title: _("Show hover tooltip"),
            subtitle: _("Shows the song, artist, station info when you hover on the radio icon")
        });
        this._schema.bind(Constants.SCHEMA_SONG_TOOLTIP, this._show_hover_tooltip, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._settingsGroup.add(this._show_hover_tooltip); 
        //HOVER

        //RIGHT CLICK SETTINGS
        this._right_click_settings = new Adw.SwitchRow({
            title: _("Right click - Settings"),
            subtitle: _("Opens the settings(this) window when you right click on the radio icon.")
        });
        this._schema.bind(Constants.SCHEMA_RIGHTCLICK_SETTINGS, this._right_click_settings, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._settingsGroup.add(this._right_click_settings); 
        //RIGHT CLICK SETTINGS

        //RIGHT CLICK COPY SONG
        this._right_click_songtitle = new Adw.SwitchRow({
            title: _("Right click - Copy Song"),
            subtitle: _("Copies the song title to clipboard when you right click on the radio icon.")
        });
        this._schema.bind(Constants.SCHEMA_RIGHTCLICK_COPYSONG, this._right_click_songtitle, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._settingsGroup.add(this._right_click_songtitle); 
        //RIGHT CLICK SETTINGS

        this._panel_height_spin = new Adw.SpinRow({
            title: _("Panel Height"),
            subtitle: _("The height of the extension window when opened."),
            adjustment: new Gtk.Adjustment({
                lower: 100,
                upper: 700,
                step_increment: 5
            })
        });
        //GNOME SEARCH
        this._gnome_search = new Adw.SwitchRow({
            title: _("Gnome Search Support"),
            subtitle: _("Search and play your stations using Gnome search.")
        });
        this._schema.bind(Constants.SCHEMA_GNOME_SEARCH, this._gnome_search, 'active', Gio.SettingsBindFlags.DEFAULT);
        this._settingsGroup.add(this._gnome_search); 
        //GNOME SEARCH

        //this._panel_height_spin.value = 220;
        this._schema.bind(Constants.SCHEMA_PANEL_HEIGHT, this._panel_height_spin, 'value', Gio.SettingsBindFlags.DEFAULT);
        this._settingsGroup.add(this._panel_height_spin); 

        this._settingsPage.add(this._settingsGroup);                

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

        this._settingsPage.add(this._urlsGroup);
      }           
 
}