import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import * as Channels from "./channels.js";
import * as YtdlpHandler from "./ytdlphandler.js";
import * as Utils from "./utils.js";
import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export const StationsPageHandler = class StationsPageHandler {
    constructor(kayraPrefs) {
        this._kayraPrefs = kayraPrefs;
        this._window = kayraPrefs._window;        
    }
    clear() {
        this._channelGroup = null;
        this._stationsPage = null;
        this._rows = null;
    }
    createPage() {
        this._stationsPage = new Adw.PreferencesPage();
        this._stationsPage.title = _("Stations");
        this._stationsPage.description = _("Add / Edit and Delete radio stations.");
        this._stationsPage.icon_name = Constants.ICON_STATIONS_PAGE;

        this._window.add(this._stationsPage);
        this._rows = [];
        this._channelGroup = new Adw.PreferencesGroup();

        const row = new Adw.ActionRow();
        row.title = _("Radio Channels");
        const addNewButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            icon_name: Constants.ICON_ADD_CHANNEL,
        });
        addNewButton.get_style_context().add_class("circular");
        addNewButton.connect("clicked", () => { this.openEditWindow(null); });
        row.add_suffix(addNewButton);
        this._channelGroup.add(row);

        this.populateChannels(this._channelGroup);
        this._stationsPage.add(this._channelGroup);
    }

    populateChannels() {
        this._channelsReadWrite = new Channels.ChannelsReadWrite(this.path);
        this._channels = this._channelsReadWrite.getChannels();
        this._channels.sort((a, b) => parseInt(a.order) - parseInt(b.order));

        for (let index = 0; index < this._channels.length; ++index) {
            let channelData = this._channels[index];
            let channelInfo = new Channels.ChannelInfo(
                channelData.id,
                channelData.name,
                channelData.uri,
                channelData.order,
                channelData.useYtdlp,
                false
            );
            this.fillChannelRow(channelInfo);
        }
    }
    fillChannelRow(channelInfo) {
        const row = new Adw.ActionRow();
        this._rows.push(row);
        row.name = channelInfo.id;
        row.title = channelInfo.name;

        const deleteButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            icon_name: Constants.ICON_DELETE_CHANNEL,
        });

        deleteButton.get_style_context().add_class("circular");
        deleteButton.connect("clicked", () => {
            this._channelGroup.remove(row);
            this.removeChannel(row);
        });
        row.add_suffix(deleteButton);

        const editButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            icon_name: Constants.ICON_EDIT_CHANNEL,
        });
        editButton.get_style_context().add_class("circular");
        editButton.connect("clicked", () => { this.openEditWindow(row); });
        row.add_suffix(editButton);

        const moveDownButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            icon_name: Constants.ICON_MOVE_DOWN,
        });
        moveDownButton.get_style_context().add_class("circular");
        moveDownButton.connect("clicked", () => {
            //this.moveDownChannel(channelInfo.id);
            this.moveDownChannel(row);
            console.info("Move Down:[" + row.name + "]");
        });
        row.add_suffix(moveDownButton);

        const moveUpButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            icon_name: Constants.ICON_MOVE_UP,
        });
        moveUpButton.get_style_context().add_class("circular");
        moveUpButton.connect("clicked", () => {
            //this.moveUpChannel(channelInfo.id);
            this.moveUpChannel(row);
            console.info("Move up:[" + row.name + "]");
        });
        row.add_suffix(moveUpButton);

        this._channelGroup.add(row);
    }
    removeChannel(row) {
        let id = row.name;
        for (let index = 0; index < this._channels.length; ++index) {
            let channelData = this._channels[index];
            if (channelData.id === id) {
                this._channels.splice(index, 1);
                this.writeChannels();

                //Delete thumbnail, if exists
                let thumbNailPath = Utils.getConfigPath() + "/" + id;
                let thumbNailFile = Gio.file_new_for_path(thumbNailPath);
                if (thumbNailFile.query_exists(null)) thumbNailFile.delete(null);

                break;
            }
        }
    }
    writeChannels() {
        this._kayraPrefs._channelsChanged = true;
        this._channels.sort((a, b) => parseInt(a.order) - parseInt(b.order));
        for (let index = 0; index < this._channels.length; ++index) this._channels[index].order = index;

        this._channelsReadWrite.writeChannelsFile(this._channels);
    }
    moveDownChannel(row) {
        let id = row.name;
        if (this._rows[this._rows.length - 1].name == id) 
            return;  //This was the last row. Nothing to do
        
        for (let index = 0; index < this._channels.length - 1; ++index) {
            let channelData = this._channels[index];
            if (channelData.id === id) {
                let tempOrder = this._channels[index].order;
                this._channels[index].order = this._channels[index + 1].order;
                this._channels[index + 1].order = tempOrder;
                this.writeChannels();
                break;
            }
        }
        
        for (let index = 0; index < this._rows.length - 1; ++index) {
            let curRow = this._rows[index];
            if (curRow.name == id) {
                this.swapChannels(index, index + 1);
                break;
            }

        }
    }
    
    moveUpChannel(row) {        
        let id = row.name;
        console.error(`NEW CHANGES. MOVEUP ROW:[${row}] ID:[${id}]`);
        if (this._rows[0].name == id) 
            return;  //This was the first row. Nothing to do

        for (let index = 1; index < this._channels.length; ++index) {
            let channelData = this._channels[index];
            if (channelData.id === id) {
                console.error(`NEW CHANGES. MOVEUP FOUND ROW ID:[${id}]`);
                let tempOrder = this._channels[index].order;
                this._channels[index].order = this._channels[index - 1].order;
                this._channels[index - 1].order = tempOrder;
                this.writeChannels();                
                break;
            }
        }

        for (let index = 1; index < this._rows.length; ++index) {
            let curRow = this._rows[index];
            if (curRow.name == id) {                
                this.swapChannels(index, index - 1);
                break;
            }

        }
    }
    swapChannels(index1, index2) {
        let tempId = this._rows[index1].name;
        let tempTitle = this._rows[index1].title;

        this._rows[index1].name = this._rows[index2].name;
        this._rows[index1].title = this._rows[index2].title;

        this._rows[index2].name = tempId;
        this._rows[index2].title = tempTitle;
    }
    

    openEditWindow(row) {
        let id = null;
        if (row != null) id = row.name;

        let channelInfo = null;
        if (id !== null) {
            channelInfo = this.getChannelInfoById(id);
            if (channelInfo === null) console.warn(`${Constants.LOG_FAILED_TO_FIND_CHANNEL} ${Constants.LOG_PREFIX_PREPS}:[${id}]`);
        }

        let dialog = new Adw.Dialog();
        //dialog.set_content_height(300);
        //dialog.set_content_width(400);
        dialog.set_title(channelInfo === null ? _("Add a New Channel") : _("Edit Channel"));
        dialog.set_presentation_mode(Adw.ADW_DIALOG_BOTTOM_SHEET);
        dialog.set_can_close(true);

        let dlgContentBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
        });
        let headerBar = new Adw.HeaderBar();
        dlgContentBox.append(headerBar);

        ////////////////////////////////////////
        //First Row
        let firstRowContent = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 5,
        });
        let linkLabel = new Gtk.Label({
            label: _("Channel URL:"),
            xalign: 0,
        });
        linkLabel.set_width_chars(15);
        this.uriEntry = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
            hexpand: true,
        });

        firstRowContent.append(linkLabel);
        firstRowContent.append(this.uriEntry);

        this.uriEntry.set_width_chars(35);
        firstRowContent.set_margin_start(20);
        firstRowContent.set_margin_end(20);
        dlgContentBox.append(firstRowContent);
        ////////////////////////////////////////

        //Second Row
        let secondRowContent = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 5,
        });
        let nameLabel = new Gtk.Label({
            label: _("Channel Name:"),
            xalign: 0,
        });
        nameLabel.set_width_chars(15);

        this.nameEntry = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
            hexpand: true,
        });

        let getNameButton = new Gtk.Button({ label: _("Fetch from url") });
        getNameButton.connect("clicked", () => {
            let newUri = this.uriEntry.get_buffer().text;
            if (!Utils.isEmptyString(newUri)) {
                this.loadingSpinner.start();
                YtdlpHandler.getFullChannelJson(id, newUri, this);
            }
        });

        secondRowContent.append(nameLabel);
        secondRowContent.append(this.nameEntry);
        secondRowContent.append(getNameButton);
        secondRowContent.set_margin_start(20);
        secondRowContent.set_margin_end(20);
        dlgContentBox.append(secondRowContent);
        ////////////////////////////////////////

        //Third Row
        let thirdRowContent = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 5,
        });
        this.ytdlpCheck = new Gtk.CheckButton({ label: _("Use yt-dlp?") });
        this.ytdlpCheck.set_active(true);
        let saveChannelButton = new Gtk.Button({
            label: channelInfo === null ? _("Add") : _("Update"),
            halign: Gtk.Align.END,
            hexpand: false,
        });
        saveChannelButton.connect("clicked", () => {
            //Get Info from UI
            let uri = this.uriEntry.get_buffer().text;
            let useYtdlp = this.ytdlpCheck.get_active();
            let name = this.nameEntry.get_buffer().text;

            //Encode special characters
            let encodedUri = Utils.processSpecialCharacters(uri, true);
            let encodedName = Utils.processSpecialCharacters(name, true);

            //Save Info
            if (channelInfo !== null) { //Update channel
                this.updateChannelInfo(
                    row,
                    channelInfo.id,
                    encodedName,
                    encodedUri,
                    useYtdlp,
                );
            }
            else if (!this.channelExists(encodedUri))  //New channel, new Uri
                this.addChannelInfo(Utils.uuidv4(), encodedName, encodedUri, useYtdlp);
            else  //New channel but Uri already exists
                console.info("New channel uri:[" + encodedUri + "] already exists");

            dialog.close();
        });

        thirdRowContent.set_margin_start(20);
        thirdRowContent.set_margin_end(20);
        thirdRowContent.set_homogeneous(true);
        thirdRowContent.append(this.ytdlpCheck);
        thirdRowContent.append(saveChannelButton);
        dlgContentBox.append(thirdRowContent);
        ////////////////////////////////////////

        //Fourth Row
        this.fourthRowContent = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 5,
        });
        this.loadingSpinner = new Gtk.Spinner();
        this.fourthRowContent.append(this.loadingSpinner);
        this.fourthRowContent.set_homogeneous(true);
        dlgContentBox.append(this.fourthRowContent);
        ////////////////////////////////////////

        if (channelInfo !== null) {
            this.ytdlpCheck.set_active(channelInfo.getUseYtdlp());

            //Load decoded uri from file into UI
            let decodedUri = Utils.processSpecialCharacters(
                channelInfo.getUri(),
                false,
            );
            this.uriEntry.get_buffer().text = decodedUri;

            //Load decoded name from file into UI
            let decodedName = Utils.processSpecialCharacters(
                channelInfo.getName(),
                false,
            );
            this.nameEntry.get_buffer().text = decodedName;
        }
        dlgContentBox.set_margin_top(10);
        dlgContentBox.set_margin_bottom(30);
        dialog.set_child(dlgContentBox);
        dialog.present(this._window);
    }
    onFullChannelJsonReceived(id, channelData, error) {
        if (channelData === null) {
            console.error(`${Constants.LOG_PREFIX_YOUTUBE_HANDLER} ${Constants.LOG_ERROR_GET_FULL_JSON}:[${error}]`);
            return;
        }
        let title = "";
        if (channelData.playlist_count >= 1) title = channelData.title; //Ytdlp behaviour
        else title = channelData.fulltitle;
        this.nameEntry.get_buffer().text = title;
        this.loadingSpinner.stop();
    }

    getChannelInfoById(id) {
        let channelInfo = null;
        for (let index = 0; index < this._channels.length; ++index) {
            let channelData = this._channels[index];
            if (channelData.id === id) {
                channelInfo = new Channels.ChannelInfo(
                    channelData.id,
                    channelData.name,
                    channelData.uri,
                    channelData.order,
                    channelData.useYtdlp,
                    false
                );
                break;
            }
        }
        return channelInfo;
    }
    updateChannelInfo(row, id, name, uri, useYtdlp) {
        for (let index = 0; index < this._channels.length; ++index) {
            let channelData = this._channels[index];
            if (channelData.id === id) {
                this._channels[index].name = name;
                this._channels[index].uri = uri;
                this._channels[index].useYtdlp = useYtdlp;
                this.writeChannels();                
                row.name = id;
                row.title = name;
                return;
            }
        }
    }

    addChannelInfo(newId, newName, newUri, newUseYtdlp) {
        let newOrder = this._channels.length + 1;
        const newChannel = {
            id: newId,
            name: newName,
            order: newOrder,
            useYtdlp: newUseYtdlp,
            uri: newUri,
        };
        this._channels.push(newChannel);
        this.writeChannels();        
        let channelInfo = new Channels.ChannelInfo(
            newId,
            newName,
            newUri,
            newOrder,
            newUseYtdlp,
            false
        );
        this.fillChannelRow(channelInfo);        
    }
    channelExists(encodedUri) {
        for (let index = 0; index < this._channels.length; ++index) {
            if (this._channels[index].uri === encodedUri) return true;
        }
        return false;
    }

}