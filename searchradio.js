import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GLib from 'gi://GLib';
import Gio from "gi://Gio";
import Gdk from 'gi://Gdk';
import Soup from 'gi://Soup?version=3.0';
import * as Utils from "./utils.js";
import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export const SearchRadioPageHandler = class ChannelInfo {
    constructor(kayraPrefs) {
        this._kayraPrefs = kayraPrefs;
        this._window = kayraPrefs._window;
        this._httpSession = new Soup.Session({
            user_agent: "Radio Kayra",
            timeout: 10
        });
        this.setServer();
    }
    clear() { 
        this._httpSession = null; 
    }
    createSearchPage() {
        this._searchPage = new Adw.PreferencesPage();
        this._searchPage.title = _("Radio Search");
        this._searchPage.icon_name = Constants.ICON_RADIO_SEARCH_PAGE;
        this._window.add(this._searchPage);

        this._searchGroup = new Adw.PreferencesGroup();
        this._searchGroup.title = _("Search");
        this._searchEntry = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
            "hexpand": true,
            placeholder_text: _("Channel name")
        });

        this._searchButton = new Gtk.Button({
            halign: Gtk.Align.CENTER,
            hexpand: false,
            label: _("Search")
        });
        let hbox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            "spacing": 10,
            "margin-start": 0,
            "margin-end": 0,
            "margin-top": 0,
            "margin-bottom": 0,
        });

        this._search_button_click_handler = this._searchButton.connect('clicked', () => this.createSearchResult());
        this._search_entry_click_handler = this._searchEntry.connect('activate', () => this.createSearchResult());

        hbox.append(this._searchEntry);
        hbox.append(this._searchButton);

        this._searchGroup.add(hbox);
        this._searchPage.add(this._searchGroup);

    }
    createSearchResult() {
        if (this.searchResults) this._searchPage.remove(this.searchResults);
        this.searchResults = new Adw.PreferencesGroup();
        this.searchResults.title = _("Search Results");
        this._searchPage.add(this.searchResults);

        this.search();
    }
    search() {
        let input = this._searchEntry.get_text();
        if (input !== null && input.trim().length > 0) {
            let params = {
                name: input,
                limit: `${Constants.MAX_RADIO_SEARCH_RESULTS}`
            };
            let message = Soup.Message.new_from_encoded_form(
                'POST',
                "http://" + this.server + "/json/stations/byname/" + input,
                Soup.form_encode_hash(params)
            );
            this._httpSession.send_and_read_async(
                message, GLib.PRIORITY_DEFAULT, null,
                (_httpSession, result) => {
                    if (message.get_status() === Soup.Status.OK) {
                        let bytes = _httpSession.send_and_read_finish(result);
                        let decoder = new TextDecoder('utf-8');
                        let response = decoder.decode(bytes.get_data());
                        console.info("[" + response + "]");
                        let jsonResponse = JSON.parse(response);
                        if (jsonResponse.length > 0) {
                            for (let i = 0; i < jsonResponse.length; i++) {
                                this.addSearchRow(jsonResponse[i]);
                            }
                        } else { console.warn(`${Constants.LOG_PREFIX_RADIO_SEARCH} ${Constants.LOG_ERROR_JSON_EMPTY}`);                        }
                    } else {                        
                        this.server = null;
                        this.setServer();
                    }
                }
            );
        }
    }
    setServer() {
        if (this.server) return;
        const res = Gio.Resolver.get_default();
        res.lookup_by_name_async(Constants.RADIO_SEARCH_SERVER_URL, null,
            (source, result) => {
                const values = source.lookup_by_name_finish(result);
                const value = values[Math.floor(Math.random() * values.length)];
                this.server = source.lookup_by_address(value, null);
            });
    }
    addSearchRow(apiStation) {
        try {
            const act = new Adw.ActionRow();
            act.title = Utils.processSpecialCharacters(apiStation.name, true);;
            
            let tagsShort = apiStation.tags;
            if (tagsShort.length > 50)
                tagsShort = tagsShort.substring(0, 50) + "...";

            let urlShort = apiStation.url;
            if (urlShort.length > 50)
                urlShort = urlShort.substring(0, 50) + "...";

            let subtitle = _("Country: ") + apiStation.country + "\n"
                + _("Tags: ")+ tagsShort + "\n"
                + _("Link: ") + urlShort + "\n"
                + _("Codec: ") + apiStation.codec + "\n"
                + _("Bitrate: ") + apiStation.bitrate + "kb/s\n";
            
            act.subtitle = Utils.processSpecialCharacters(subtitle, true);
            const addButton = new Gtk.Button({
                valign: Gtk.Align.CENTER,
                icon_name: Constants.ICON_ADD_CHANNEL,
            });
            addButton.get_style_context().add_class('circular');
            addButton.connect('clicked', () => {
                this._kayraPrefs.channelsChanged = true;
                this.addChannel(apiStation);
            });
            act.add_suffix(addButton);
            this.loadThumbnail(act, apiStation);
            this.searchResults.add(act);
        } catch (e) { console.warn(`${Constants.LOG_PREFIX_RADIO_SEARCH} ${Constants.LOG_ERROR_ADD_SEARCH_ROW} [${e}]`); }


    }
    loadThumbnail(act, apiStation) {
        try {
            let iconTexture = null;
            let favicon = apiStation.favicon;

            if (favicon && !favicon.endsWith('/')) {
                try {
                    const file = Gio.File.new_for_uri(favicon);
                    iconTexture = Gdk.Texture.new_from_file(file);
                }
                catch (error) { console.warn(`${Constants.LOG_PREFIX_RADIO_SEARCH} ${Constants.LOG_ERROR_LOAD_THUMBNAIL}: [${favicon}] [${error}]`);  }
            }
            let thumbNail = Gtk.Image.new();
            if (iconTexture !== null) thumbNail.set_from_paintable(iconTexture);
            else thumbNail.set_from_icon_name(Constants.ICON_CHANNEL_THUMB_PLACEHOLDER);
            thumbNail.set_pixel_size(Constants.SEARCH_PIXEL_SIZE);
            act.add_prefix(thumbNail);
        } catch (error) {
            console.warn(`${Constants.LOG_PREFIX_RADIO_SEARCH} ${Constants.LOG_ERROR_LOAD_THUMBNAIL}: [${error}]`);
        }
        
    }

    saveThumbnail(favicon, destinationFileName) {
        try {
            const file = Gio.File.new_for_uri(favicon);
            const destinationFile = Gio.File.new_for_path(destinationFileName);
            
            file.copy(destinationFile, 0, null, () => {//FIX 1 current_num_bytes, total_num_bytes
                
            });
        }
        catch (error) {
            console.warn(`${Constants.LOG_PREFIX_RADIO_SEARCH} ${Constants.LOG_ERROR_SAVE_THUMBNAIL}: [${favicon}] [${error}]`);            
        }
    }

    addChannel(channel) {
        //Encode special characters
        let encodedUri = Utils.processSpecialCharacters(channel.url_resolved, true);
        let encodedName = Utils.processSpecialCharacters(channel.name, true);
        let id = Utils.isEmptyString(channel.stationuuid) ? Utils.uuidv4() : channel.stationuuid;

        //TODO: UPDATE IF ALREADY EXISTS

        if (!this._kayraPrefs._stationsPageHandler.channelExists(encodedUri)) { //new channel, new uri  
            if (channel.favicon && !channel.favicon.endsWith('/'))
                Utils.saveThumbnail(channel.favicon, Utils.getConfigPath() + "/" + id);
            this._kayraPrefs._stationsPageHandler.addChannelInfo(id, encodedName, encodedUri, false);
        }
    }
}