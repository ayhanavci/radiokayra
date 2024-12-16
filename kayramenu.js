import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";

import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import * as YtdlpHandler from "./ytdlphandler.js";
import * as Utils from "./utils.js";
import * as Popups from "./popups.js";
import * as Channels from "./channels.js";
import * as Constants from "./constants.js";
import * as RadioKayra from "./radiokayra.js";

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
        this._loadingInfoPopup.clear();
        this._volumeControlPopup.clear();
        this._streamInfoPopup.clear();
        this._settingsMenuItem?.destroy();
  
        this._controlsPopup = null;
        this._loadingInfoPopup = null;
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
        this._lastClickedChannelId = "";
        this._kayraExtension = extension;                
        this._settings = extension.getSettings();
        this._path = extension.path;        
        this._activeChannel = null;
        
        let volume = this._settings.get_double(Constants.SCHEMA_VOLUME_LEVEL);
        this._player = new RadioKayra.RadioPlayer(volume);

        this._settings_changed_handler = this._settings.connect("changed::" + Constants.SCHEMA_CHANNEL_EVENT, () => {
          console.info(`EXT: ${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNELS_JSON_CHANGED}`);
          this._channelSection.removeAll();
          this._channelScrollView.set_height(Constants.PER_CHANNEL_PANEL_HEIGHT);
          this.addChannels();
        });
  
        this._iconStopped = Gio.icon_new_for_string(this._path + Constants.ICON_RADIO_OFF_PATH);
        this._iconPlaying = Gio.icon_new_for_string(this._path + Constants.ICON_RADIO_ON_PATH);
        this._trayIcon = new St.Icon({
          gicon: this._iconStopped,
          style_class: "system-status-icon",        
        });
  
        this.add_child(this._trayIcon);        
        this.initRadioCallbacks();
  
        //Controls Section
        this._controlsPopup = new Popups.ControlsPopup(this._player);
        this.menu.addMenuItem(this._controlsPopup);
        //Controls Section END
        this._loadingInfoPopup = new Popups.LoadingInfoPopup(this._player);
  
        //Volume Section
        this._volumeControlPopup = new Popups.VolumeControlPopup(this._player, this._settings);
        this.menu.addMenuItem(this._volumeControlPopup);
        this.menu.addMenuItem(this._loadingInfoPopup);
        //Volume Section END
  
        //Stream Info Section
        this._streamInfoPopup = new Popups.StreamInfoPopup(this._player, this._path);
        this.menu.addMenuItem(this._streamInfoPopup);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        //Stream Info Section END
  
        //Channels Header Section
        this._settingsMenuItem = new PopupMenu.PopupImageMenuItem(
          _("Edit Channels"),
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
  
        this._channelScrollView = new St.ScrollView({overlay_scrollbars: true,});
        
        this._channelScrollView.add_child(this._channelSection.actor);
        this._scrollViewMenuSection.actor.add_child(this._channelScrollView);
        this.menu.addMenuItem(this._scrollViewMenuSection);
        this.addChannels();

        //If there is no previously played channel, pick the first one on the list (if any)
        if (this._activeChannel == null && this.channelBoxList != null && this.channelBoxList.length > 0) 
            this._activeChannel = this.channelBoxList[0];
        
        
        //Channels Section END
        this._controlsPopup.setOnPlayClicked(this.onPlayClicked);
        
        //Menu Icon mouse clicks
        this._icon_mouse_click_handler = this.connect('button-press-event', (actor, event) => {        
          if (event.get_button() === 2 && radiokayraPanel._activeChannel !== null) { //Middle click
            this.menu.close();        
            radiokayraPanel.onPlayClicked();
          }
          else if (event.get_button() === 3) { //Right click
            this.menu.close();        
            radiokayraPanel.openPreferences();                
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
          let channelBox = new Popups.ChannelBox(channelInfo, this);
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
        let panelLength = this.channelBoxList.length * Constants.PER_CHANNEL_PANEL_HEIGHT;
        this._channelScrollView.set_height(panelLength > Constants.MAX_PANEL_HEIGHT ? Constants.MAX_PANEL_HEIGHT : panelLength);
        this._channelSection.addMenuItem(channelBox); 
      }
      enable() { }    
   
      addMainLayout() {
        this.mainLayout = new St.BoxLayout({
          vertical: true,
          width: Constants.DEFAULT_PANEL_WIDTH,
        });
        this.addMenuItem();
      }
      initRadioCallbacks() {
        this._player.setOnError((type, message) => { this.onPlayerError(type, message); });
        this._player.setOnStreamStarted(() => { this.onPlayerStreamStarted(); });
        this._player.setOnStreamEnded(() => { this.onPlayerStreamEnded(); });
        this._player.setOnTagChanged((artist, title) => { this.onPlayerTagChanged(artist, title); });
      }
      onPlayerStreamStarted() {      
        if (radiokayraPanel._activeChannel == null) {
            console.warn("Active Channel is null. This shouldn't happen.")
            return;
        }
        radiokayraPanel.setTrayIconPlaying();
        radiokayraPanel._loadingInfoPopup.statePlaying();
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
      onPlayerTagChanged(artist, title) { radiokayraPanel._streamInfoPopup.onNewTag(artist, title); }      
      onChannelChanged(channel) {            
        if (radiokayraPanel._activeChannel == null) console.info(`${Constants.LOG_PREFIX_EXTENSION} ${Constants.LOG_INFO_CHANNEL_CHANGED}:[] -> [${channel._channelInfo.getId()}]`);            
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
        radiokayraPanel._player.changeChannel(radiokayraPanel._activeChannel.getResolvedUrl());  
        radiokayraPanel._player.play();            
      }
      stateReady() {
        radiokayraPanel._controlsPopup.stateReady();
        radiokayraPanel._loadingInfoPopup.stateReady();
        radiokayraPanel._streamInfoPopup.resetTags();
      }
      stateLoadingChannel() {
        radiokayraPanel._streamInfoPopup.hide();
        radiokayraPanel._loadingInfoPopup.stateLoading();
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
      async _buildMenu() {}
    },
  );