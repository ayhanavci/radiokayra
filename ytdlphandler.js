import GLib from "gi://GLib";
import Gio from "gi://Gio";
import * as Constants from "./constants.js";

export async function getShortChannelJson(channelBox, clientObject) {
  try {    
    //yt-dlp -x -O "{\"url\":\"%(urls)s\", \"thumbnail\":\"%(thumbnail)s\", \"is_live\":\"%(is_live)s\"}" https://www.youtube.com/watch?v=yZzBmNEZ1zw
    const proc = Gio.Subprocess.new(
      ["yt-dlp", "-x", "-O", "{\"url\":\"%(urls)s\", \"thumbnail\":\"%(thumbnail)s\", \"is_live\":\"%(is_live)s\", \"duration\":\"%(duration_string)s\"}", channelBox._channelInfo.uri],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    );

    const [stdout, stderr] = await proc.communicate_utf8_async(null, null);
    
    if (proc.get_successful()) {
      console.info("getShortChannelJson Wait Success:[" + stdout + "]");
      let jsonData = JSON.parse(stdout);
      clientObject.onShortChannelJsonSuccess(channelBox, jsonData);
    } else throw new Error(stderr);

    return stdout;
  } catch (error) {
    console.warn(`${Constants.LOG_PREFIX_YOUTUBE_HANDLER} ${Constants.LOG_ERROR_GET_SHORTJSON}:[${error}]`);
    clientObject.onShortChannelJsonError(error);
    return "";
  }
}

export async function getFullChannelJson(id, uri, clientObject) {
  try {
    //yt-dlp --dump-single-json --flat-playlist URI
    const proc = Gio.Subprocess.new(
      ["yt-dlpa", "--dump-single-json", "--flat-playlist", uri],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    );

    const [stdout, stderr] = await proc.communicate_utf8_async(null, null);

    if (proc.get_successful()) {
      let channelData = JSON.parse(stdout);
      
      clientObject.onFullChannelJsonReceived(id, channelData, null);
    } else throw new Error(stderr);

    return stdout;
  } catch (error) {    
    clientObject.onFullChannelJsonReceived(id, null, error);
    return null;
  }  
}

//Gio.Subprocess read each line
export async function searchYoutube(searchString, clientObject) {
  try {
    //yt-dlp ytsearch10:"Rammstein" -j
    //yt-dlp ytsearch2:"Lofi Girl" -O "{\"channel\":\"%(channel)s\", \"url\":\"%(original_url)s\", \"title\":\"%(fulltitle)s\",\"thumbnail\":\"%(thumbnail)s\", \"is_live\":\"%(is_live)s\", \"duration\":\"%(duration_string)s\"}" --skip-download
    //yt-dlp ytsearch2:"Rammstein" -O "{\"channel\":\"%(channel)s\", \"url\":\"%(original_url)s\", \"title\":\"%(fulltitle)s\",\"thumbnail\":\"%(thumbnail)s\", \"is_live\":\"%(is_live)s\", \"duration\":\"%(duration_string)s\"}" --skip-download
    //yt-dlp ytsearch2:"Rammstein" -O "{\"channel:\":\"%(channel)s\", \"url:\":\"%(original_url)s\", \"title\":\"%(fulltitle)s\",\"thumbnail\":\"%(thumbnail)s\", \"is_live\":%(is_live)s, \"duration\":\"%(duration_string)s\", \"like_count\":%(like_count)d}" --skip-download --convert-thumbnails jpg    
    //{"channel:":"Rammstein Official", "url:":"https://www.youtube.com/watch?v=StZcUAPRRac", "title":"Rammstein - Sonne (Official Video)","thumbnail":"https://i.ytimg.com/vi_webp/StZcUAPRRac/maxresdefault.webp", "is_live":False, "duration":"4:13", "like_count":2167768}

    clientObject.proc = Gio.Subprocess.new(
      [
        "yt-dlp",
        "ytsearch10:" + "'" + searchString + "'",
        "-O",
        "{\"channel\":\"%(channel)s\", \"url\":\"%(original_url)s\", \"title\":\"%(fulltitle)s\",\"thumbnail\":\"%(thumbnail)s\", \"is_live\":\"%(is_live)s\", \"duration\":\"%(duration_string)s\", \"like_count\":%(like_count)d}",
        "--skip-download"
      ],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    );
        
    const stdoutStream = new Gio.DataInputStream({ base_stream: clientObject.proc.get_stdout_pipe(), close_base_stream: true });
    readOutput(searchString, stdoutStream, clientObject);    

  } catch (error) {
    console.error(`${Constants.LOG_PREFIX_YOUTUBE_HANDLER} ${Constants.LOG_ERROR_SEARCH_YOUTUBE}:[${error}]`);
  }
}

function readOutput(searchString, stdoutStream, clientObject) {
  stdoutStream.read_line_async(GLib.PRIORITY_LOW, null, (stream, result) => {
    try {
      const [line] = stream.read_line_finish_utf8(result);
      if (line !== null) {
        clientObject.callBackSearchResultLine(searchString, line);
        readOutput(searchString, stdoutStream, clientObject);
      }
      else { console.log(`${Constants.LOG_PREFIX_YOUTUBE_HANDLER} ${Constants.LOG_ERROR_READ_OUTPUT}:[DONE]`); }
    } catch (error) { console.warn(`${Constants.LOG_PREFIX_YOUTUBE_HANDLER} ${Constants.LOG_ERROR_READ_OUTPUT}:[${error}]`); }
  });
}
