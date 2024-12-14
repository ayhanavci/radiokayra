import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Pango from "gi://Pango";
import GdkPixbuf from "gi://GdkPixbuf";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Slider from "resource:///org/gnome/shell/ui/slider.js";
import * as Animation from "resource:///org/gnome/shell/ui/animation.js";

import * as Utils from "./utils.js";
import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";

//Sections of the UI: Volume, Loading, Info, Edit, Channel list
export const VolumeControlPopup = GObject.registerClass(
    {
        GTypeName: "VolumeControlPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(player, settings) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._player = player;
            this._settings = settings;
            this._volume = this._settings.get_double(Constants.SCHEMA_VOLUME_LEVEL);
            this._saved_volume = this._volume;

            this._volumeLayout = new St.BoxLayout({
                vertical: false,
                width: Constants.DEFAULT_PANEL_WIDTH,
            });
            this._slider = new Slider.Slider(this._volume);
            this._slider_value_handler = this._slider.connect("notify::value", this.setVolume.bind(this));
            this._mute_icon = new St.Icon({
                icon_name: Constants.ICON_VOLUME_MEDIUM,
                icon_size: 20,
                reactive: true,
                style: "margin-right:5px",
            });
            this._mute_press_handler = this._mute_icon.connect("button-press-event", () => { this.toggleMute(); });

            this._volumeLayout.add_child(this._mute_icon);
            this._volumeLayout.add_child(this._slider);
            
            this.add_child(this._volumeLayout);
            this.setVolumeIcon();
            
        }        
        clear() {
            this._volumeLayout?.destroy();
            this._volumeLayout = null;

            this._slider.disconnect(this._slider_value_handler);
            this._volumeLayout?.destroy();
            this._volumeLayout = null;

            this._mute_icon.disconnect(this._mute_press_handler);
            this._mute_icon?.destroy();
            this._mute_icon = null;

        }
        
        setVolume(slider, _event) {
            this._player.setVolume(slider.value);
            this._volume = slider.value;
            this.setVolumeIcon(slider.value);
            this._settings.set_double(Constants.SCHEMA_VOLUME_LEVEL, slider.value);
        }
        getVolume() {
            return this._slider.value;
        }
        toggleMute() {
            if (this._volume > 0) {
                this._saved_volume = this._volume;
                this._volume = 0;
                this._slider.value = 0;
            } else {
                this._volume = this._saved_volume;
                this._slider.value = this._volume;
            }
            this._player.setVolume(this._volume);
            this.setVolumeIcon(this._volume);
        }
        setVolumeIcon() {
            if (this._volume === Constants._volume_LEVEL_MUTED) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_MUTED);
            else if (this._volume < Constants._volume_LEVEL_LOW) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_LOW);
            else if (this._volume < Constants._volume_LEVEL_MEDIUM) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_MEDIUM);
            else this._mute_icon.set_icon_name(Constants.ICON_VOLUME_HIGH);
        }
    },
);

export const LoadingInfoPopup = GObject.registerClass(
    {
        GTypeName: "LoadingInfoPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(player) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._player = player;
            this._loadingLayout = new St.BoxLayout({
                vertical: false,
                x_align: Clutter.ActorAlign.CENTER,
                style_class: Constants.CSS_LOADING_LAYOUT,
            });
            this._loadingSpinner = new Animation.Spinner(16);
            this._loadingLayout.add_child(this._loadingSpinner);

            this._loadtxt = new St.Label({
                text: "Ready...",
                style: "padding:5px",
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            this._loadingLayout.add_child(this._loadtxt);

            this.add_child(this._loadingLayout);
            this.hide();
        }
      
        clear() {
            this._loadingLayout?.destroy();
            this._loadingLayout = null;

            this._loadingSpinner?.destroy();
            this._loadingSpinner = null;

            this._loadtxt?.destroy();
            this._loadtxt = null;
        }
        statePlaying() {
            this._loadingSpinner.stop();
            this._loadingSpinner.hide();
            this._loadtxt.set_text(_("Playing..."));
            this.hide();
        }
        stateLoading() {
            this._loadingSpinner.show();
            this._loadingSpinner.play();
            this._loadtxt.set_text(_("Loading..."));
            this.show();
        }
        stateReady() {
            this._loadingSpinner.hide();
            this._loadtxt.set_text(_("Ready..."));
            this.hide();
        }
        closeLoading() { }
    },
);

export const ControlsPopup = GObject.registerClass(
    {
        GTypeName: "ControlsPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor() {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._play_click_handler = null;
            this._controlsLayout = new St.BoxLayout({
                vertical: false,
                x_align: Clutter.ActorAlign.CENTER,
                height: 40,
                width: Constants.DEFAULT_PANEL_WIDTH,
            });
            this.add_child(this._controlsLayout);
            this._playbutton = new St.Icon({
                style_class: Constants.CSS_ICON_PLAY_BUTTON,
                icon_name: Constants.ICON_PLAY,
                reactive: true,
                icon_size: 40,
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
            });

            this._controlsLayout.add_child(this._playbutton);
            this.add_child(this._controlsLayout);
        }
      
        clear() {
            if (this._play_click_handler !== null)
                this.disconnect(this._play_click_handler);

            this._controlsLayout?.destroy();
            this._controlsLayout = null;

            this._playbutton?.destroy();
            this._playbutton = null;
        }
        statePlaying() { this._playbutton.set_icon_name(Constants.ICON_STOP); }
        stateLoading() { this._playbutton.set_icon_name(Constants.ICON_STOP); }
        stateReady() { this._playbutton.set_icon_name(Constants.ICON_PLAY); }
        setOnPlayClicked(onPlayClicked) {
            //Whole row is clickable
            this._play_click_handler = this.connect("button-press-event", () => {
                onPlayClicked();
            });
            //Uncomment to make only the button clickable
            //this._playbutton.connect("button-press-event", () => onPlayClicked());
        }
    },
);

export const StreamInfoPopup = GObject.registerClass(
    {
        GTypeName: "StreamInfoPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(player, extensionPath) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this.hide();
            this._player = player;            
            this._extensionPath = extensionPath;
            this._streamLayout = new St.BoxLayout({
                vertical: true,
                x_align: Clutter.ActorAlign.CENTER,
                width: Constants.DEFAULT_PANEL_WIDTH,
            });
            this.add_child(this._streamLayout);

                       

            //Channel Name
            this._channelNameLabel = new St.Label({
                style_class: Constants.CSS_CHANNEL_NAME_LABEL,
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            //this._artistLabel.clutter_text.set_max_length(90);
            this._channelNameLabel.clutter_text.line_wrap = true;
            this._channelNameLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            this._channelNameLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            this._streamLayout.add_child(this._channelNameLabel);

            //Stream Thumbnail
            this._thumbnail = new St.Icon({
                icon_size: 100,
                //style: "width: 200px; height: 100px",
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
            });

            this._thumbnail.hide();
            this._streamLayout.add_child(this._thumbnail);

            //Song duration
            this._durationLabel = new St.Label({
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            this._streamLayout.add_child(this._durationLabel);
            this.hideDuration();

            //Artist Info
            this._artistLabel = new St.Label({
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            //this._artistLabel.clutter_text.set_max_length(90);
            this._artistLabel.clutter_text.line_wrap = true;
            this._artistLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            this._artistLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            this._streamLayout.add_child(this._artistLabel);

            //Song title Info
            this._songLabel = new St.Label({
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            this._streamLayout.add_child(this._songLabel);

            //Stream live icon
            this._onair = new St.Icon({
                icon_size: 15,
                //style: "width: 200px; height: 100px",
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
            });
            this._streamLayout.add_child(this._onair);
            this.hideOnAir(); 
        }
       
        clear() {
            this._streamLayout?.destroy();
            this._streamLayout = null;

            this._onair?.destroy();
            this._onair = null;

            this._channelNameLabel?.destroy();
            this._channelNameLabel = null;

            this._thumbnail?.destroy();
            this._thumbnail = null;

            this._artistLabel?.destroy();
            this._artistLabel = null;

            this._songLabel?.destroy();
            this._songLabel = null;
        }
        statePlaying(channelBox) {
            this.showThumbnail(channelBox);
            this.setChannelName(channelBox._channelInfo.getName());
            this.show();
            if (channelBox._is_live) { this.showOnAir(); this.hideDuration(); }
            else if (channelBox._duration !== 0) { this.showDuration(channelBox); this.hideOnAir();} 
            else { this.hideOnAir(); this.hideDuration();}

            //Uncomment if you want to do something with the video info
            //YtdlpHandler.getChannelJson_async(channelBox._channelInfo.getId(), channelBox._channelInfo.getUri(), this);
        }
        setChannelName(channelName) {
            this._channelNameLabel.text = Utils.processSpecialCharacters(
                channelName,
                false,
            );
        }
        resetTags() {
            this._artistLabel.text = "";
            this._songLabel.text = "";
            this._artistLabel.hide();
            this._songLabel.hide();
        }
        onNewTag(artist, title) {
            this._artistLabel.text = artist;
            this._songLabel.text = title;

            if (Utils.isEmptyString(artist)) this._artistLabel.hide();
            else {
                this.show();
                this._artistLabel.show();
            }

            if (Utils.isEmptyString(title)) this._songLabel.hide();
            else {
                this.show();
                this._songLabel.show();
                console.log(`${Constants.LOG_PREFIX_POPUPS} ${Constants.LOG_INFO_SONG_LABEL_SHOW}: [${artist}] [${title}]`);
            }
        }
        doesThumbnailExist(channelBox) {
            let thumbNailPath = Utils.getConfigPath() + "/" + channelBox._channelInfo.getId();
            let thumbNailFile = Gio.file_new_for_path(thumbNailPath);
            return thumbNailFile.query_exists(null);
        }
        showThumbnail(channelBox) {
            this.show();

            if (this.doesThumbnailExist(channelBox)) {
                try {
                    let thumbNailPath = Utils.getConfigPath() + "/" + channelBox._channelInfo.getId();
                    this._thumbnail.gicon = Gio.icon_new_for_string(thumbNailPath);
                    this._thumbnail.show();
                    const pixbuf = GdkPixbuf.Pixbuf.new_from_file(thumbNailPath);
                    const width = pixbuf.get_width();
                    const height = pixbuf.get_height();
                    this._thumbnail.set_scale(width / height, 1);
                    this._thumbnail.set_pivot_point(0.5, 0.5);
                }
                catch (error) {
                    console.warn(`${Constants.LOG_PREFIX_POPUPS} ${Constants.LOG_SHOW_THUMBNAIL_ERROR}:[${error}]`);
                    this.showThumbnailGeneric();
                }
            }
            else { this.showThumbnailGeneric(); }
        }
        showThumbnailGeneric() {
            this._thumbnail.set_icon_name(Constants.ICON_CHANNEL_THUMB_PLACEHOLDER);
            this._thumbnail.set_scale(1, 1);
            this._thumbnail.set_pivot_point(1, 1);
        }
        showOnAir() {
            let onAirPath = this._extensionPath + Constants.ICON_RADIO_ON_AIR;
            this._onair.gicon = Gio.icon_new_for_string(onAirPath);
            this._onair.show();
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file(onAirPath);

            const width = pixbuf.get_width();
            const height = pixbuf.get_height();

            this._onair.set_scale(width / height, 1);
            this._onair.set_pivot_point(0.5, 0.5);
        }
        hideOnAir() { this._onair.hide(); }
        showDuration(channelBox) {            
            this._durationLabel.text = channelBox._duration.toString();
            this._durationLabel.show();
        }
        hideDuration() {
            this._durationLabel.hide();
        }
    },
);

export const ChannelBox = GObject.registerClass(
    class ChannelBox extends PopupMenu.PopupBaseMenuItem {
        constructor(channelInfo, radiokayraPanel) {
            super({
                reactive: true,
                can_focus: true,
            });
            this._channelInfo = channelInfo;
            this._radiokayraPanel = radiokayraPanel;
            this._is_live = false;
            this._duration = 0;
            this._resolvedUrl = "";
            if (this._channelInfo.getUseYtdlp()) {
                this._resolved = false;
            }
            else {
                this._resolvedUrl = this._channelInfo.getUri();
                this._resolved = true;
            }

            this.addThumbnail();
            this._channelLabel = new St.Label({
                reactive: true,
                x_align: Clutter.ActorAlign.START,
                //x_expand: true,
            });
            this._channelLabel.text = Utils.processSpecialCharacters(
                this._channelInfo.getName(),
                false,
            );
            this._channelLabel.clutter_text.set_max_length(40);
            this.add_child(this._channelLabel);
        }
       
        clear() {
            this._thumbnail?.destroy();
            this._thumbnail = null;

            this._channelLabel?.destroy();
            this._channelLabel = null;
        }
        getResolvedUrl() {
            return this._resolvedUrl;
        }
        setResolvedUrl(url) {
            this._resolvedUrl = url;
            this._resolved = true;
        }
        isResolved() { return this._resolved; }
        setIsLive(value) { if (value === "True") this._is_live = true; }
        setDuration(value) { this._duration = value; }
        doesThumbnailExist() {
            let thumbNailPath = Utils.getConfigPath() + "/" + this._channelInfo.getId();
            let thumbNailFile = Gio.file_new_for_path(thumbNailPath);
            return thumbNailFile.query_exists(null);
        }
        addThumbnail() {
            this._thumbnail = new St.Icon({ style_class: Constants.CSS_CHANNEL_LIST_THUMBNAIL });
            this._thumbnail.set_icon_size(20);

            if (this.doesThumbnailExist()) {
                try {
                    let thumbNailPath =
                        Utils.getConfigPath() + "/" + this._channelInfo.getId();
                    this._thumbnail.gicon = Gio.icon_new_for_string(thumbNailPath);
                    this._thumbnail.show();

                    const pixbuf = GdkPixbuf.Pixbuf.new_from_file(thumbNailPath);

                    const width = pixbuf.get_width();
                    const height = pixbuf.get_height();

                    this._thumbnail.set_scale(width / height, 1);
                    this._thumbnail.set_pivot_point(0.5, 0.5);
                }
                catch (error) {
                    console.warn(`${Constants.LOG_PREFIX_POPUPS} ${Constants.LOG_ADD_THUMBNAIL_ERROR}:[${error}]`);
                    this.showThumbnailGeneric();
                }
            }
            else {
                this._thumbnail.set_icon_name(Constants.ICON_CHANNEL_THUMB_PLACEHOLDER);
            }
            this.add_child(this._thumbnail);
        }

        activate() {
            this._radiokayraPanel.onChannelChanged(this);
        }
    },
);
