import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Pango from "gi://Pango";
import GdkPixbuf from "gi://GdkPixbuf";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Animation from "resource:///org/gnome/shell/ui/animation.js";

import * as Utils from "./utils.js";
import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";

export const StreamInfoPopup = GObject.registerClass(
    {
        GTypeName: "StreamInfoPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(player, extensionPath, shellVersion) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._channelName = "";
            this._artist = "";     
            this._title = "";            
            this.hide();
            this._player = player;            
            this._extensionPath = extensionPath;

            this._streamLayout = new St.BoxLayout({                
                x_align: Clutter.ActorAlign.CENTER,
                style_class: "layout-box",
                //width: Constants.DEFAULT_PANEL_WIDTH,                
            });      
            //Gnome 48 or below?       
            if (shellVersion < 48) this._streamLayout.vertical = true;            
            else this._streamLayout.orientation = Clutter.Orientation.VERTICAL;
            
            
            this.add_child(this._streamLayout);                                               
            
            //Loading info
            this._loadingSpinner = new Animation.Spinner(16);
            this._streamLayout.add_child(this._loadingSpinner);

            this._loadtxt = new St.Label({
                text: "",
                style: "padding:5px",
                x_align: Clutter.ActorAlign.CENTER,                
                x_expand: true,
                reactive: true,
            });
            this._streamLayout.add_child(this._loadtxt); 

            //Channel Name
            this._channelNameLabel = new St.Label({
                style_class: Constants.CSS_CHANNEL_NAME_LABEL,
                //y_align: Clutter.ActorAlign.CENTER,
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
                style_class: Constants.CSS_CHANNEL_NAME_LABEL,
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                reactive: true,
            });
            this._streamLayout.add_child(this._durationLabel);
            this.hideDuration();

            //Artist Info
            this._artistLabel = new St.Label({
                style_class: Constants.CSS_CHANNEL_NAME_LABEL,
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
            this.stateReady();
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

            this._loadtxt?.destroy();
            this._loadtxt = null;

            this._loadingSpinner?.destroy();
            this._loadingSpinner = null;
        }
        statePlaying(channelBox) {
            this._onair.show();
            this._thumbnail.show();
            this._channelNameLabel.show();
            this._songLabel.show();
            this._loadingSpinner.stop();
            this._loadingSpinner.hide();            
            this._loadtxt.hide();            
            this.showThumbnail(channelBox);
            this.setChannelName(channelBox._channelInfo.getName());
            this.show();
            if (channelBox._is_live) { this.showOnAir(); this.hideDuration(); }
            else if (channelBox._duration !== 0) { this.showDuration(channelBox); this.hideOnAir();} 
            else { this.hideOnAir(); this.hideDuration();}

            //Uncomment if you want to do something with the video info
            //YtdlpHandler.getChannelJson_async(channelBox._channelInfo.getId(), channelBox._channelInfo.getUri(), this);
        }
        stateLoading() {
            this._onair.hide();
            this._channelNameLabel.hide();
            this._thumbnail.hide();
            this._songLabel.hide();
            this._loadtxt.set_text(_("Loading..."));
            this._loadingSpinner.play();
            this._loadtxt.show();            
            this._loadingSpinner.show();            
        }
        stateReady() {
            this._onair.show();
            this._thumbnail.show();
            this._channelNameLabel.show();
            this._songLabel.show();
            this._loadtxt.set_text(_("Ready..."));
            this._loadingSpinner.stop();
            this._loadingSpinner.hide();
            this._loadtxt.hide();
        }
        setChannelName(channelName) {
            this._channelName = channelName;
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
            this._artist = artist;     
            this._title = title;                        

            if (Utils.isEmptyString(artist)) this._artistLabel.hide();
            else {
                artist = Utils.truncateString(artist, Constants.MAX_SONG_TITLE);
                this.show();
                this._artistLabel.show();
            }

            if (Utils.isEmptyString(title)) this._songLabel.hide();
            else {
                title = Utils.truncateString(title, Constants.MAX_SONG_TITLE);
                this.show();
                this._songLabel.show();
                console.log(`${Constants.LOG_PREFIX_POPUPS} ${Constants.LOG_INFO_SONG_LABEL_SHOW}: [${artist}] [${title}]`);
            }
            this._artistLabel.text = artist;
            this._songLabel.text = title;
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
            let onAirPath = this._extensionPath + Constants.ICON_RADIO_ON_AIR_PATH;
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
