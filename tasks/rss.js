const RssParser = require('rss-parser');
const moment = require('moment');

const descDate = (a, b) => {
	return (a.isoDate > b.isoDate) ? -1 : ((a.isoDate < b.isoDate) ? 1 : 0);
};

const truncateString = (str, num) => {
	if (str.length <= num) {
  		return str
	}
	return str.slice(0, num) + '...'
}
      
class RSS {

    fetchFeeds(rssFeeds) {
        let parser = new RssParser();
        let blogs = [];
        return Promise.all(rssFeeds.map(feedUrl => parser.parseURL(feedUrl)))
        .then(feeds => {
            feeds.forEach(feed => {
                const feedHostname = new URL(feed.link).hostname;
                feed.items.forEach(item => {
                    console.log(item.title + ' - ' + feedHostname);
                    const entry = {
                      siteTitle: feed.title,
                      hostName: feedHostname,
                      postTitle: item.title,
                      isoDate: item.isoDate,
                      date: moment(item.isoDate).format('LL'),
                      url: item.link,
                      excerpt: truncateString(item.contentSnippet, 300),
                      author: item.creator || feed.title
                    };
                    blogs.push(entry);
                  });
            });
            return blogs.sort(descDate).slice(0, 20);
        });
    }
}

module.exports = RSS

