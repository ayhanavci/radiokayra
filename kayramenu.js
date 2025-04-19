import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Config from "resource:///org/gnome/shell/misc/config.js";

import * as YtdlpHandler from "./ytdlphandler.js";
import * as Utils from "./utils.js";
import * as ChannelBox from "./channelbox.js";
import * as PopControls from "./popcontrols.js";
import * as PopStreamInfo from "./popstreaminfo.js";
import * as PopVolumeControl from "./popvolumecontrol.js";
import * as Channels from "./channels.js";
import * as Constants from "./constants.js";
import * as RadioKayra from "./radiokayra.js";
import * as KayraSearchProvider from "./searchProvider.js";

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

let radiokayraPanel;

export const RadiokayraMenuButton = GObject.registerClass(
    {
        GTypeName: "RadiokayraMenuButton",
    },
    class RadiokayraMenuButton extends PanelMenu.Button {
        destroy() {
            this._player.stop();
            this._player.disconnectSourceBus();

            this._settings.disconnect(this._settings_settings_changed_handler);
            this._settingsMenuItem.disconnect(this._settings_menu_activate_handler);
            this.disconnect(this._icon_mouse_click_handler);

            this.setTrayIconStopped();
            this._controlsPopup.clear();            
            this._volumeControlPopup.clear();
            this._streamInfoPopup.clear();
            this._settingsMenuItem?.destroy();

            this._controlsPopup = null;            
            this._volumeControlPopup = null;
            this._streamInfoPopup = null;
            this._settingsMenuItem = null;

            this._trayIcon?.destroy();
            this._trayIcon = null;

            this._channelSection?.destroy();
            this._channelSection = null;

            this._scrollViewMenuSection?.destroy();
            this._scrollViewMenuSection = null;

            this._channelScrollView?.destroy();
            this._channelScrollView = null;

            this._tooltip?.destroy();
            this._tooltip = null;

            if (this._provider !== null) {
                Main.overview.searchController.removeProvider(this._provider);
                this._provider = null;
            }
                        
            super.destroy();
        }
        setTrayIconStopped() {
            this._trayIcon.set_gicon(this._iconStopped);
        }
        setTrayIconPlaying() {
            this._trayIcon.set_gicon(radiokayraPanel._iconPlaying);
        }
        openPreferences() {
            this._kayraExtension.openPreferences();
        }
        
        _init(extension) {       
            super._init(0.0, "RadiokayraMenuButton");            
            radiokayraPanel = this;
            this._shellVersion = this.getShellversion();
            //console.log("SHELL VERSION:" + this._shellVersion);            
            this._lastClickedChannelId = "";
            this._kayraExtension = extension;
            this._settings = extension.getSettings();
            this._path = extension.path;
            this._activeChannel = null;                        
            
            let volume = this._settings.get_double(Constants.SCHEMA_VOLUME_LEVEL);
            
            this._player = new RadioKayra.RadioPlayer(volume);
            
            //REFRESH CHANNELS EVENT
            this._settings_changed_handler = this._settings.connect("changed::" + Constants.SCHEMA_CHANNELS_CHANGE_EVENT, () => {
                console.info(`EXT: ${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNELS_JSON_CHANGED}`);
                this._channelSection.removeAll();                
                this.addChannels();
            });
            //REFRESH CHANNELS EVENT            
                                 
            this._iconStopped = Gio.icon_new_for_string(this._path + Constants.ICON_RADIO_OFF_PATH);
            this._iconPlaying = Gio.icon_new_for_string(this._path + Constants.ICON_RADIO_ON_PATH);

            this._trayIcon = new St.Icon({
                gicon: this._iconStopped,
                style_class: "system-status-icon",
            });
            this._tooltip = new St.Label({ style_class: 'song-info-panel-tooltip' });
            this.label_actor = this._tooltip;
            Main.layoutManager.addChrome(this._tooltip);            
            
            this.add_child(this._trayIcon);
            
            this.initRadioCallbacks();

            //Controls Section
            this._controlsPopup = new PopControls.ControlsPopup(this._shellVersion);
            this.menu.addMenuItem(this._controlsPopup);
            //console.error(`MY WIDTH IS ${this.get_style()}`);
            //Controls Section END            

            //Volume Section
            this._volumeControlPopup = new PopVolumeControl.VolumeControlPopup(this._player, this._settings, this._shellVersion);
            this.menu.addMenuItem(this._volumeControlPopup);            
            //Volume Section END

            //Stream Info Section
            this._streamInfoPopup = new PopStreamInfo.StreamInfoPopup(this._player, this._path, this._shellVersion);
            this.menu.addMenuItem(this._streamInfoPopup);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            //Stream Info Section END

            this._tooltip.text = "";

            this.hideTooltip();
            this.connect("enter-event", (_widget) => {
                this.showTooltip();
            });
            this.connect("leave-event", (_widget) => {
                this.hideTooltip();
            });

            //Channels Header Section
            this._settingsMenuItem = new PopupMenu.PopupImageMenuItem(
                _("Settings"),
                Constants.ICON_SETTINGS,
                {
                    style_class: Constants.CSS_SETTINGS_POPUP,
                },
            );
            this._settings_menu_activate_handler = this._settingsMenuItem.connect("activate", () => { radiokayraPanel.openPreferences(); });
            this.menu.addMenuItem(this._settingsMenuItem);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            //Channels Edit Section END
            
            //Channels Section
            this._channelSection = new PopupMenu.PopupMenuSection();
            this._scrollViewMenuSection = new PopupMenu.PopupMenuSection();

            this._channelScrollView = new St.ScrollView({ overlay_scrollbars: true, });

            this._channelScrollView.add_child(this._channelSection.actor);
            let newHeight = radiokayraPanel._settings.get_int(Constants.SCHEMA_PANEL_HEIGHT);
            this._channelScrollView.set_height(newHeight);
            
            //PANEL HEIGHT EVENT            
            this._height_changed_handler = this._settings.connect("changed::" + Constants.SCHEMA_PANEL_HEIGHT, () => {                
                newHeight = radiokayraPanel._settings.get_int(Constants.SCHEMA_PANEL_HEIGHT);
                this._channelScrollView.set_height(newHeight);
            });
            //PANEL HEIGHT EVENT

            this._scrollViewMenuSection.actor.add_child(this._channelScrollView);            
            this.menu.addMenuItem(this._scrollViewMenuSection);
            this.addChannels();
            
            //If there is no previously played channel, pick the first one on the list (if any)
            if (this._activeChannel === null && this.channelBoxList !== null && this.channelBoxList.length > 0)
                this._activeChannel = this.channelBoxList[0];


            //Channels Section END
            this._controlsPopup.setOnPlayClicked(this.onPlayClicked);
            this._controlsPopup.setOnPlayPrevClicked(this.onPlayPrevClicked);
            this._controlsPopup.setOnPlayNextClicked(this.onPlayNextClicked);

            //Menu Icon mouse clicks
            this._icon_mouse_click_handler = this.connect('button-press-event', (actor, event) => {
                if (event.get_button() === 2 && radiokayraPanel._activeChannel !== null) { //Middle click
                    this.menu.close();
                    radiokayraPanel.onPlayClicked();
                }
                else if (event.get_button() === 3) { //Right click
                    this.menu.close();                    
                    if (radiokayraPanel._settings.get_boolean(Constants.SCHEMA_RIGHTCLICK_SETTINGS)) 
                        radiokayraPanel.openPreferences();
                    if (radiokayraPanel._settings.get_boolean(Constants.SCHEMA_RIGHTCLICK_COPYSONG)) {
                        let song = radiokayraPanel._streamInfoPopup._artist;
                        if (!Utils.isEmptyString(song)) song += " ";                        
                        song += radiokayraPanel._streamInfoPopup._title;                        
                        
                        if (!Utils.isEmptyString(song))
                            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, song);
                    }                     
                }
            });

            this._provider = null;
            if (radiokayraPanel._settings.get_boolean(Constants.SCHEMA_GNOME_SEARCH)) 
            {                
                this._provider = new KayraSearchProvider.SearchProvider(extension, this);
                Main.overview.searchController.addProvider(this._provider);
            }  
            
            this._search_event_handler = this._settings.connect("changed::" + Constants.SCHEMA_GNOME_SEARCH, () => {                
                let bSearch = radiokayraPanel._settings.get_boolean(Constants.SCHEMA_GNOME_SEARCH);
                console.error("GNOME SEARCH:" + bSearch);
                if (bSearch) {
                    if (this._provider !== null) {
                        Main.overview.searchController.removeProvider(this._provider);                                               
                    }
                    this._provider = new KayraSearchProvider.SearchProvider(extension, this); 
                    Main.overview.searchController.addProvider(this._provider);
                }
                else {
                    Main.overview.searchController.removeProvider(this._provider);
                    this._provider = null;
                }                                    
            });
            
            this.stateReady();
            this.setTrayIconStopped();
        }
        addChannels() {
            let channelsReadWrite = new Channels.ChannelsReadWrite(radiokayraPanel._path);
            let channels = channelsReadWrite.getChannels();
            let lastPlayedId = radiokayraPanel._settings.get_string(Constants.SCHEMA_LAST_PLAYED);
            this.channelBoxList = [];

            for (let i = 0; i < channels.length; ++i) {
                let channelData = channels[i];
                let channelInfo = new Channels.ChannelInfo(
                    channelData.id,
                    channelData.name,
                    channelData.uri,
                    channelData.order,
                    channelData.useYtdlp,
                    false
                );
                let channelBox = new ChannelBox.ChannelBox(channelInfo, this);
                this.channelBoxList.push(channelBox);
                this._addToChannelSection(channelBox);
                if (!Utils.isEmptyString(lastPlayedId) &&
                    lastPlayedId === channelInfo.getId()) {
                    radiokayraPanel._activeChannel = channelBox;
                    this._streamInfoPopup.setChannelName(channelInfo.getName());
                    this._streamInfoPopup.showThumbnail(channelBox);
                }
            }
        }
        _addToChannelSection(channelBox) {            
            this._channelSection.addMenuItem(channelBox);
        }
        enable() {

        }

        initRadioCallbacks() {
            this._player.setOnError((type, message) => { this.onPlayerError(type, message); });
            this._player.setOnStreamStarted(() => { this.onPlayerStreamStarted(); });
            this._player.setOnStreamEnded(() => { this.onPlayerStreamEnded(); });
            this._player.setOnTagChanged((artist, title) => { this.onPlayerTagChanged(artist, title); });
        }
        onPlayerStreamStarted() {
            if (radiokayraPanel._activeChannel === null) {
                console.warn("Active Channel is null. This shouldn't happen.")
                return;
            }
            radiokayraPanel.setTrayIconPlaying();            
            radiokayraPanel._controlsPopup.statePlaying();
            radiokayraPanel._streamInfoPopup.statePlaying(radiokayraPanel._activeChannel);
            radiokayraPanel._player.setVolume(radiokayraPanel._volumeControlPopup.getVolume());
            console.info("STREAM STARTED");
        }
        onPlayerStreamEnded() {
            radiokayraPanel.setTrayIconStopped();
            radiokayraPanel.stateReady();
        }
        onPlayerError(type, message) { console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_PLAYER_ERROR} [${type}] [${message}]`); }
        onPlayerTagChanged(artist, title) { 
            radiokayraPanel._streamInfoPopup.onNewTag(artist, title); 
            radiokayraPanel.updateToolTip();
        }
        onChannelChanged(channel) {
            if (radiokayraPanel._activeChannel === null) console.info(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_CHANGED}:[] -> [${channel._channelInfo.getId()}]`);
            else console.info(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_CHANGED}:[${radiokayraPanel._activeChannel._channelInfo.getId()}] -> [${channel._channelInfo.getId()}]`);
            radiokayraPanel._activeChannel = channel;
            radiokayraPanel._lastClickedChannelId = radiokayraPanel._activeChannel._channelInfo.getId();

            if (radiokayraPanel._player.isPlaying()) this._player.stop();

            radiokayraPanel.stateReady();
            radiokayraPanel.stateLoadingChannel();

            if (radiokayraPanel._activeChannel.isResolved()) radiokayraPanel.playResolvedUrl();
            else YtdlpHandler.getShortChannelJson(radiokayraPanel._activeChannel, this);
        }
        onPlayClicked() {
            if (radiokayraPanel._activeChannel === null) return; //"Play Clicked: No active channels!"

            if (radiokayraPanel._player.isPlaying()) { //Stop if playing
                radiokayraPanel._player.stop();
                radiokayraPanel.stateReady();
                radiokayraPanel.setTrayIconStopped();
            } else { //Play if stopped        
                radiokayraPanel.stateLoadingChannel();
                if (radiokayraPanel._player.isSourceReady()) //A resolved channel was already playing. Continue.
                    radiokayraPanel._player.play();
                else if (radiokayraPanel._activeChannel.isResolved()) //First time play is clicked. It plays last played channel. Source wasn't ready but url is resolved. Likely a non-youtube stream.          
                    radiokayraPanel.playResolvedUrl();
                else  //First time play is clicked. It plays last played channel. Source isn't ready neither the url. Likely a youtube channel.          
                    YtdlpHandler.getShortChannelJson(radiokayraPanel._activeChannel, radiokayraPanel);

            }
        }
        onPlayNextClicked() {            
            radiokayraPanel._navigateChannel(radiokayraPanel.findNextChannelBox());
                     
        }
        onPlayPrevClicked() {
            radiokayraPanel._navigateChannel(radiokayraPanel.findPrevChannelBox());
        }
        _navigateChannel(channel) {
            let activeChannel = radiokayraPanel._activeChannel;
            if (channel === null) {
                console.info(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_NAVIGATE}:[Fail]`);  
                return; 
            }
            if (activeChannel === null) {
                console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_NAVIGATE}:[Active channel not found]`);              
            }                
            else {
                if (channel._channelInfo.getId() === activeChannel._channelInfo.getId()) { 
                    //Probably just 1 channel in the list. Don't switch.
                    console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_NAVIGATE}:[ID is the same ${activeChannel._channelInfo.getId()}]`);                              
                    return;
                }
                else {
                    //More than 1 channels, everything is fine.
                    console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_NAVIGATE}:[Active channel: ${activeChannel._channelInfo.getName()}]`);            
                }                
            }                            
            console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_NAVIGATE}:[Switching to: ${channel._channelInfo.getName()}]`);              
            radiokayraPanel.onChannelChanged(channel);   
        }
        onShortChannelJsonSuccess(channelBox, jsonData) {
            if (!Utils.isEmptyString(radiokayraPanel._lastClickedChannelId) && channelBox._channelInfo.getId() !== radiokayraPanel._lastClickedChannelId)
                return; //User clicked another channel before yt-dlp returned. Don't do anything!
            console.info(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_PROCESSED_URL_SUCCESS}:[${jsonData.url}]`);
            radiokayraPanel._activeChannel.setResolvedUrl(jsonData.url);
            radiokayraPanel._activeChannel.setIsLive(jsonData.is_live);
            if (!Utils.isEmptyString(jsonData.duration)) radiokayraPanel._activeChannel.setDuration(jsonData.duration);
            radiokayraPanel.playResolvedUrl();

            let thumbNailPath = Utils.getConfigPath() + "/" + channelBox._channelInfo.getId();
            if (jsonData.thumbnail) Utils.saveThumbnail(jsonData.thumbnail, thumbNailPath);
            radiokayraPanel._streamInfoPopup.showThumbnail(channelBox);

        }
        onShortChannelJsonError(errormsg) {
            console.warn(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_PROCESSED_URL_ERROR}:[${errormsg}]`);
            Main.notify('Yt-dlp error', errormsg);
        }
        playResolvedUrl() {
            let url = radiokayraPanel._activeChannel.getResolvedUrl();            
            url = Utils.processSpecialCharacters(url, false);        
            radiokayraPanel._player.changeChannel(url);
            radiokayraPanel._player.play();
        }
        stateReady() {
            radiokayraPanel._controlsPopup.stateReady();            
            radiokayraPanel._streamInfoPopup.resetTags();
        }
        stateLoadingChannel() {                        
            radiokayraPanel._streamInfoPopup.stateLoading();
            radiokayraPanel._controlsPopup.stateLoading();
            console.info("Playing Link:[" + radiokayraPanel._activeChannel._channelInfo.getUri() + "] Ytdl:[" + radiokayraPanel._activeChannel._channelInfo.getUseYtdlp() + "]");
            radiokayraPanel._settings.set_string(
                Constants.SCHEMA_LAST_PLAYED,
                radiokayraPanel._activeChannel._channelInfo.getId(),
            );
        }
        findChannelBox(id) {
            for (let i = 0; i < this.channelBoxList.length; ++i) {
                let channelBox = this.channelBoxList[i];
                if (channelBox._channelInfo.id === id) return channelBox;
            }
            return null;
        }
        findPrevChannelBox() {          
            if (radiokayraPanel.channelBoxList.length === 0 || radiokayraPanel._activeChannel === null)
                return null;    
            let activeChannelInfo = radiokayraPanel._activeChannel._channelInfo;
            //console.error(`Active channel order ${activeChannelInfo.getOrder()}`);        

            for (let i = radiokayraPanel.channelBoxList.length - 1; i >= 0; --i) {
                let channelBox = radiokayraPanel.channelBoxList[i];                
                if (channelBox._channelInfo.getOrder() < activeChannelInfo.getOrder()) return channelBox;                
            }
            return radiokayraPanel.channelBoxList[radiokayraPanel.channelBoxList.length - 1];
        }
        findNextChannelBox() {                          
            if (radiokayraPanel.channelBoxList.length === 0 || radiokayraPanel._activeChannel === null)
                return null;    
            let activeChannelInfo = radiokayraPanel._activeChannel._channelInfo;
            //console.error(`Active channel order ${activeChannelInfo.getOrder()}`);        

            for (let i = 0; i < radiokayraPanel.channelBoxList.length; ++i) {
                let channelBox = radiokayraPanel.channelBoxList[i];
                if (channelBox._channelInfo.getOrder() > activeChannelInfo.getOrder()) return channelBox;
                
            }
            return radiokayraPanel.channelBoxList[0];
        }
        updateToolTip() {
            if (this._tooltip === null)
                return;            
            let text = "";            
            let artist = radiokayraPanel._streamInfoPopup._artist;
            let title = radiokayraPanel._streamInfoPopup._title;
            let channelName = radiokayraPanel._streamInfoPopup._channelName;
            let isPlaying = radiokayraPanel._player.isPlaying();            

            if (isPlaying) {                
                if (!Utils.isEmptyString(artist)) {                    
                    artist = Utils.processSpecialCharacters(artist, false);
                    text += Utils.truncateString(artist, Constants.MAX_TOOLTIP_WIDTH);
                    text += "\n";
                }                                   
    
                if (!Utils.isEmptyString(title)) {                    
                    title = Utils.processSpecialCharacters(title, false);
                    text += Utils.truncateString(title, Constants.MAX_TOOLTIP_WIDTH);
                    text += "\n";
                } 
            }
              
            if (!Utils.isEmptyString(channelName)) {                
                channelName = Utils.processSpecialCharacters(channelName, false);
                text += Utils.truncateString(channelName, Constants.MAX_TOOLTIP_WIDTH);            
            }                
            this._tooltip.text = text;
        }
        showTooltip() {            
            if (this._tooltip === null || !radiokayraPanel._settings.get_boolean(Constants.SCHEMA_SONG_TOOLTIP))
                return;
            this.updateToolTip();
            this._tooltip.opacity = 0;
            this._tooltip.show();

            let [stageX, stageY] = this.get_transformed_position();
            
            let itemWidth = this.allocation.x2 - this.allocation.x1;
            let tooltipWidth = this._tooltip.get_width();
            
            let y = stageY + 40;
            let x = Math.floor(stageX + itemWidth / 2 - tooltipWidth / 2);

            let parent = this._tooltip.get_parent();
            let parentWidth = parent.allocation.x2 - parent.allocation.x1;

            if (Clutter.get_default_text_direction() === Clutter.TextDirection.LTR) {
                // stop long tooltips falling off the right of the screen
                x = Math.min(x, parentWidth - tooltipWidth - 6);
                // but whatever happens don't let them fall of the left
                x = Math.max(x, 6);
            }
            else {
                x = Math.max(x, 6);
                x = Math.min(x, parentWidth - tooltipWidth - 6);
            }

            this._tooltip.set_position(x, y);
            this._tooltip.remove_all_transitions();
            this._tooltip.ease({
                opacity: 255,
                duration: 500,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD
            });
        }
        hideTooltip() {
            if (this._tooltip === null)
                return;
            this._tooltip.opacity = 255;

            this._tooltip.remove_all_transitions();
            this._tooltip.ease({
                opacity: 0,
                duration: 500,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => this._tooltip.hide()
            });
        }
        getShellversion() {
            const [major] = Config.PACKAGE_VERSION.split('.');
            return Number.parseInt(major);
        }        
        async _buildMenu() { }
    },
);