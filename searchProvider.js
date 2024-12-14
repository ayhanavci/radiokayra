import St from "gi://St";
import Gio from "gi://Gio";
import * as Channels from "./channels.js";
import * as Utils from "./utils.js";
import GdkPixbuf from "gi://GdkPixbuf";
import * as Constants from "./constants.js";

export class SearchProvider {
    constructor(extension, menuButton) { this._extension = extension; this._menu = menuButton; }

    /**
     * The application of the provider.
     *
     * Applications will return a `Gio.AppInfo` representing themselves.
     * Extensions will usually return `null`.
     *
     * @type {Gio.AppInfo}
     */
    get appInfo() {
        return null;
    }

    /**
     * Whether the provider offers detailed results.
     *
     * Applications will return `true` if they have a way to display more
     * detailed or complete results. Extensions will usually return `false`.
     *
     * @type {boolean}
     */
    get canLaunchSearch() {
        return false;
    }

    /**
     * The unique ID of the provider.
     *
     * Applications will return their application ID. Extensions will usually
     * return their UUID.
     *
     * @type {string}
     */
    get id() {
        return this._extension.uuid;
    }

    /**
     * Launch the search result.
     *
     * This method is called when a search provider result is activated.
     *
     * @param {string} result - The result identifier
     * @param {string[]} terms - The search terms
     */
    activateResult(result, terms) {
        console.debug(`activateResult(${result}, [${terms}])`);
        console.warn(`activateResult(${result}, [${terms}])`);
        
        let channelBox = this._menu.findChannelBox(result);
        if (channelBox !== null) this._menu.onChannelChanged(channelBox);
    }

    /**
     * Launch the search provider.
     *
     * This method is called when a search provider is activated. A provider can
     * only be activated if the `appInfo` property holds a valid `Gio.AppInfo`
     * and the `canLaunchSearch` property is `true`.
     *
     * Applications will typically open a window to display more detailed or
     * complete results.
     *
     * @param {string[]} terms - The search terms
     */
    launchSearch(terms) {
        console.debug(`launchSearch([${terms}])`);
        console.warn(`launchSearch([${terms}])`);
    }

    /**
     * Create a result object.
     *
     * This method is called to create an actor to represent a search result.
     *
     * Implementations may return any `Clutter.Actor` to serve as the display
     * result, or `null` for the default implementation.
     *
     * @param {ResultMeta} meta - A result metadata object
     * @returns {Clutter.Actor|null} An actor for the result
     */
    createResultObject(meta) {
        console.debug(`createResultObject(${meta.id})`);
        console.warn(`createResultObject(${meta.id})`);

        return null;
    }

    /**
     * Get result metadata.
     *
     * This method is called to get a `ResultMeta` for each identifier.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} results - The result identifiers
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<ResultMeta[]>} A list of result metadata objects
     */
    getResultMetas(results, cancellable) {
        console.debug(`getResultMetas([${results}])`);
        console.warn(`getResultMetas([${results}])`);
        const {scaleFactor} = St.ThemeContext.get_for_stage(global.stage);

        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(() => reject(Error('Operation Cancelled')));
            const resultMetas = [];

            let channelsReadWrite = new Channels.ChannelsReadWrite(this._extension.path);            
            let channels = channelsReadWrite.getChannels();
            for (let i = 0; i < results.length; ++i) {                
                for (let j = 0; j < channels.length; ++j) {
                    let channelData = channels[j];                                        
                    if (results[i] !== channelData.id) continue;

                    let decodedUri = Utils.processSpecialCharacters(channelData.uri, false);
                    let decodedName = Utils.processSpecialCharacters(channelData.name, false);  
                                      
                    const meta = {
                        id: channelData.id,
                        name: decodedName,
                        description: decodedUri,
                        clipboardText: decodedUri,
                        createIcon: size => { 
                            return this.getChannelThumbnail(scaleFactor, size, channelData.id); 
                        },
                    };
                    resultMetas.push(meta);              
                }
            }

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled())
                resolve(resultMetas);
        });
    }
    getChannelThumbnail(scaleFactor, size, id) {  
        let thumbNailPath = Utils.getConfigPath() + "/" + id;
        let thumbNailIcon = Gio.icon_new_for_string(thumbNailPath);

        let thumbNailFile = Gio.file_new_for_path(thumbNailPath);
        let trueWidth = size;
        let trueHeight = size;
        let scaledWidth = size;
        let scaledHeight = size;
        let fileExists = thumbNailFile.query_exists(null);
        if (fileExists) {
            thumbNailIcon = Gio.icon_new_for_string(thumbNailPath);
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file(thumbNailPath);
            trueWidth = pixbuf.get_width();
            trueHeight = pixbuf.get_height();

            if (trueWidth >= trueHeight) {
                scaledHeight = size;
                scaledWidth = trueWidth / (trueHeight / size);
            }
            else {
                scaledWidth = size;
                scaledHeight = trueHeight / (trueWidth / size);
            }
        }        
        let thumbnail = new St.Icon({
            width: scaledWidth * scaleFactor,
            height: scaledHeight * scaleFactor,
        });
        //console.info(`SCALE FACTOR: ${scaleFactor} W:${trueWidth} H:${trueHeight} S:${size} SW:${scaledWidth} SH:${scaledHeight}`);
        thumbnail.set_scale(trueWidth / trueHeight, 1);
        thumbnail.set_pivot_point(0.5, 0.5);
        if (fileExists) thumbnail.gicon = thumbNailIcon;
        else thumbnail.set_icon_name(Constants.ICON_CHANNEL_THUMB_PLACEHOLDER);
        return thumbnail; 
    }
    /**
     * Initiate a new search.
     *
     * This method is called to start a new search and should return a list of
     * unique identifiers for the results.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} terms - The search terms
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<string[]>} A list of result identifiers
     */
    getInitialResultSet(terms, cancellable) {
        console.debug(`getInitialResultSet([${terms}])`);
        console.warn(`getInitialResultSet([${terms}])`);
        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(() => reject(Error('Search Cancelled')));
            let search = terms.join(" ").toLowerCase();

            let identifiers = [];
            let channelsReadWrite = new Channels.ChannelsReadWrite(this._extension.path);            
            let channels = channelsReadWrite.getChannels();

            for (let i = 0; i < channels.length; ++i) {
                let channelData = channels[i];
                if (channelData.name.toLowerCase().includes(search)) identifiers.push(channelData.id);                
            }

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled()) resolve(identifiers);
        });       
    }

    /**
     * Refine the current search.
     *
     * This method is called to refine the current search results with
     * expanded terms and should return a subset of the original result set.
     *
     * Implementations may use this method to refine the search results more
     * efficiently than running a new search, or simply pass the terms to the
     * implementation of `getInitialResultSet()`.
     *
     * If @cancellable is triggered, this method should throw an error.
     *
     * @async
     * @param {string[]} results - The original result set
     * @param {string[]} terms - The search terms
     * @param {Gio.Cancellable} cancellable - A cancellable for the operation
     * @returns {Promise<string[]>}
     */
    getSubsearchResultSet(results, terms, cancellable) {
        console.debug(`getSubsearchResultSet([${results}], [${terms}])`);
        console.warn(`getSubsearchResultSet([${results}], [${terms}])`);
        if (cancellable.is_cancelled())
            throw Error('Search Cancelled');
        
        return this.getInitialResultSet(terms, cancellable);
    }

    /**
     * Filter the current search.
     *
     * This method is called to truncate the number of search results.
     *
     * Implementations may use their own criteria for discarding results, or
     * simply return the first n-items.
     *
     * @param {string[]} results - The original result set
     * @param {number} maxResults - The maximum amount of results
     * @returns {string[]} The filtered results
     */
    filterResults(results, maxResults) {
        console.debug(`filterResults([${results}], ${maxResults})`);        
        if (results.length <= maxResults)
            return results;

        return results.slice(0, maxResults);
    }
}