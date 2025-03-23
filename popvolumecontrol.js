import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Slider from "resource:///org/gnome/shell/ui/slider.js";

import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";

export const VolumeControlPopup = GObject.registerClass(
    {
        GTypeName: "VolumeControlPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(player, settings, shellVersion) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._player = player;
            this._settings = settings;
            this._volume = this._settings.get_double(Constants.SCHEMA_VOLUME_LEVEL);
            this._saved_volume = this._volume;
            this._volumeLayout = new St.BoxLayout(); 
            this._volumeLayout.style_class = "layout-box";
            //Gnome 48 or below?
            if (shellVersion < 48) this._volumeLayout.vertical = false;            
            else this._volumeLayout.orientation = Clutter.Orientation.HORIZONTAL;
                     
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
            if (this._volume === Constants.VOLUME_LEVEL_MUTED) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_MUTED);
            else if (this._volume < Constants.VOLUME_LEVEL_LOW) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_LOW);
            else if (this._volume < Constants.VOLUME_LEVEL_MEDIUM) this._mute_icon.set_icon_name(Constants.ICON_VOLUME_MEDIUM);
            else this._mute_icon.set_icon_name(Constants.ICON_VOLUME_HIGH);
        }
    },
);