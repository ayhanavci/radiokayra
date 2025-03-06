import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Constants from "./constants.js";
import { gettext as _, } from "resource:///org/gnome/shell/extensions/extension.js";


export const ControlsPopup = GObject.registerClass(
    {
        GTypeName: "ControlsPopup",
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(shellVersion) {
            super({
                hover: false,
                activate: false,
                can_focus: true,
            });
            this._play_click_handler = null;
            this._controlsLayout = new St.BoxLayout({                
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                //width: Constants.DEFAULT_PANEL_WIDTH,                                
            });  
            //Gnome 48 or below? //Alternative: this._controlsLayout.orientation === undefined
            if (shellVersion < 48) this._controlsLayout.vertical = false;                                            
            else this._controlsLayout.orientation = Clutter.Orientation.HORIZONTAL;                      
                        
            this.add_child(this._controlsLayout);
            
            this._previousbutton = new St.Icon({
                icon_name: Constants.ICON_BACKWARD,
                reactive: true,
                icon_size: Constants.PLAY_PREV_ICON_SIZE,
                x_align: Clutter.ActorAlign.START,
                x_expand: false,
            });

            this._controlsLayout.add_child(this._previousbutton);
            
            this._playbutton = new St.Icon({
                icon_name: Constants.ICON_PLAY,
                reactive: true,
                icon_size: Constants.PLAY_ICON_SIZE,
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: false,
            });

            this._controlsLayout.add_child(this._playbutton);

            this._nextbutton = new St.Icon({
                icon_name: Constants.ICON_FORWARD,
                reactive: true,
                icon_size: Constants.PLAY_NEXT_ICON_SIZE,
                x_align: Clutter.ActorAlign.END,
                x_expand: false,
            });
            
            this._controlsLayout.add_child(this._nextbutton);

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
            /*this._play_click_handler = this.connect("button-press-event", () => {
                onPlayClicked();
            });*/
            //Uncomment to make only the button clickable
            this._playbutton.connect("button-press-event", () => onPlayClicked());
        }
        setOnPlayNextClicked(onPlayNextClicked) {            
            this._nextbutton.connect("button-press-event", () => onPlayNextClicked());
        }
        setOnPlayPrevClicked(onPlayPrevClicked) {            
            this._previousbutton.connect("button-press-event", () => onPlayPrevClicked());
        }
    },
);