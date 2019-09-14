const axios = require('axios');
require('dotenv').config()

const authorization = Buffer.from(`${process.env.VIMEO_CLIENT_ID}:${process.env.VIMEO_CLIENT_SECRET}`).toString('base64');

class Vimeo {

    getAlbums() {
        return axios.request({
            method: 'get',
            headers: {'Authorization': `Basic ${authorization}`},
            url: 'https://api.vimeo.com/users/101960035/albums'
          })
          .then((response) => {
              const albums = response.data.data
              return albums
          })
    }

    getAlbumVideos(albumId) {
        return axios.request({
            method: 'get',
            headers: {'Authorization': `Basic ${authorization}`},
            url: `https://api.vimeo.com/users/101960035/albums/${albumId}/videos?sort=manual`
          })
          .then((response) => {
              const videos = response.data.data
              return videos
          })
    }

    getWebsiteVideoDataFromAlbum(albumId) {
        return this.getAlbumVideos(albumId)
        .then((videos) => {
            let videoData = videos.map(v => { 
                const image = v.pictures.sizes.filter(size => size.width >= 640)[0]
                const titleParts = v.name.split("-");
                return {
                    name: titleParts[0].trim(),
                    author: titleParts[1].trim(),
                    description: v.description,
                    url: v.link,
                    html: v.embed.html,
                    duration: v.duration.toHHMMSS(),
                    thumbnail: image.link,
                    thmbnailPlayButton: image.link_with_play_button
                } 
            });
            return videoData;
        });
    }
};

Number.prototype.toHHMMSS = function () {
    const sec_num = parseInt(this, 10); // don't forget the second param
    const hours   = Math.floor(sec_num / 3600);
    const minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    const seconds = sec_num - (hours * 3600) - (minutes * 60);

    let hoursString = hours + ":";
    let minutesString = minutes + ":";
    let secondsString = seconds;

    if (hours < 10 && hours >= 1) { 
        hoursString  = "0" + hours + ":"; 
    } 
    else if (hours < 1) { 
        hoursString = "" 
    }
    if (minutes < 10) { minutesString = "0" + minutes + ":"; }
    if (seconds < 10) { secondsString = "0" + seconds; }

    return hoursString + minutesString + secondsString;
}

module.exports = Vimeo;