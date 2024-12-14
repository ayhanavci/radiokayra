export const DEFAULT_PANEL_WIDTH = 300;
export const PER_CHANNEL_PANEL_HEIGHT = 40;
export const MAX_PANEL_HEIGHT = 300;
export const VOLUME_LEVEL_MUTED = 0;
export const VOLUME_LEVEL_LOW = 0.3;
export const VOLUME_LEVEL_MEDIUM = 0.6;
export const SEARCH_PIXEL_SIZE = 150;

export const SETTINGS_FILE_NAME = "channels.json";
export const CONFIG_FOLDER_NAME = "radio-kayra";
export const RADIO_SEARCH_SERVER_URL = 'all.api.radio-browser.info';
export const VOLUME_POWER = 2;

export const SCHEMA_CHANNEL_EVENT = "channelschangedevent";
export const SCHEMA_LAST_PLAYED = "lastplayed";
export const SCHEMA_VOLUME_LEVEL = "volumelevel";

export const CSS_SETTINGS_POPUP = "settings-menu-item";
export const CSS_CHANNEL_LIST_THUMBNAIL = "channel-list-item";
export const CSS_LOADING_LAYOUT = "radiokayra-popup-loading-box";
export const CSS_ICON_PLAY_BUTTON = "play-button-icon";
export const CSS_CHANNEL_NAME_LABEL = "channel-name-label";

export const ICON_RADIO_ON_PATH = "/images/radio-icon-on.svg";
export const ICON_RADIO_OFF_PATH = "/images/radio-icon-off.svg";
export const ICON_RADIO_ON_AIR = "/images/radio-live-symbolic.svg";
export const ICON_CHANNEL_THUMB_PLACEHOLDER = "audio-x-generic-symbolic";
export const ICON_VOLUME_MUTED = "audio-volume-muted-symbolic";
export const ICON_VOLUME_LOW = "audio-volume-low-symbolic";
export const ICON_VOLUME_MEDIUM = "audio-volume-medium-symbolic";
export const ICON_VOLUME_HIGH = "audio-volume-high-symbolic";
export const ICON_PLAY = "media-playback-start-symbolic";
export const ICON_STOP = "media-playback-stop-symbolic";
export const ICON_ADD_CHANNEL = "list-add-symbolic";
export const ICON_MOVE_DOWN = "go-down-symbolic";
export const ICON_MOVE_UP = "go-up-symbolic";
export const ICON_RADIO_SEARCH_PAGE = "system-search-symbolic";
export const ICON_YOUTUBE_SEARCH_PAGE = "system-search-symbolic";
export const ICON_BUTTON_SEARCH_ADD = "list-add-symbolic";
export const ICON_SETTINGS = "document-properties-symbolic";
export const ICON_STATIONS_PAGE = "view-list-symbolic";
export const ICON_DELETE_CHANNEL = "user-trash-symbolic";
export const ICON_EDIT_CHANNEL = "document-edit-symbolic";

export const LOG_PREFIX_CHANNELS = "Channels";
export const LOG_FAILED_TO_LOAD_JSON = "Failed to load channels.json.";
export const LOG_FAILED_TO_PARSE_JSON = "Failed to parse channels.json.";
export const LOG_FAILED_TO_UPDATE_JSON = "Failed to update channels.json.";
export const LOG_FAILED_TO_CREATE_JSON = "Failed to create json file.";
export const LOG_FAILED_TO_CREATE_CONFIG_FOLDER = "Failed to create config folder.";

export const LOG_PREFIX_EXTENSION = "Extension";
export const LOG_INFO_CHANNELS_JSON_CHANGED = "Channels json changed.";
export const LOG_INFO_CHANNEL_CHANGED = "Channels json changed.";
export const LOG_INFO_PROCESSED_URL_SUCCESS = "Url process success.";
export const LOG_PLAYER_ERROR = "Player error.";
export const LOG_PROCESSED_URL_ERROR = "Processed url error.";

export const LOG_PREFIX_POPUPS = "Popups";
export const LOG_SHOW_THUMBNAIL_ERROR = "Show Thumbnail error.";
export const LOG_ADD_THUMBNAIL_ERROR = "Add Thumbnail error.";
export const LOG_INFO_SONG_LABEL_SHOW = "Song label show.";

export const LOG_PREFIX_PREPS = "Prefs";
export const LOG_FAILED_TO_FIND_CHANNEL = "Failed to find channel."

export const LOG_PREFIX_RADIO_PLAYER = "Radio";
export const LOG_GST_MESSAGE_RECEIVED = "Gst message.";
export const LOG_GST_STATE_CHANGED = "Gst state changed.";
export const LOG_GST_NEW_TAG = "Gst new tag received.";
export const LOG_GST_STREAM_STARTED = "Stream started.";
export const LOG_GST_STREAM_ENDED = "Stream ended.";
export const LOG_GST_PLUGIN_ERROR = "Gstreamer plugin missing.";

export const LOG_PREFIX_RADIO_SEARCH = "Radio search";
export const LOG_ERROR_ADD_SEARCH_ROW = "Add search row error.";
export const LOG_ERROR_LOAD_THUMBNAIL = "Load thumbnail error.";
export const LOG_ERROR_SAVE_THUMBNAIL = "Save thumbnail error.";
export const LOG_ERROR_JSON_EMPTY = "Json empty!";

export const LOG_PREFIX_YOUTUBE_SEARCH = "Youtube search";
export const LOG_ERROR_CREATE_SEARCH_RESULTS = "Create search results exception.";
export const LOG_ERROR_CALLBACK_RESULTS = "Create search results exception.";

export const LOG_PREFIX_YOUTUBE_HANDLER = "Youtube handler";
export const LOG_ERROR_GET_SHORTJSON = "Get short json error.";
export const LOG_ERROR_GET_FULL_JSON = "Get full json error.";
export const LOG_ERROR_SEARCH_YOUTUBE = "Search youtube error.";