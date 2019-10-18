const cheerio = require('cheerio')
const axios = require('axios')
const moment = require('moment')

const descDate = (a, b) => {
    return (a.startDate < b.startDate) ? -1 : ((a.startDate > b.startDate) ? 1 : 0);
}

class Meetup {

    fetchAllOrganizationEvents(organizationSlugs) {
        const promises = organizationSlugs.map(slug => this.fetchOrganizationEvents(slug))
        return Promise.all(promises).then(results => { 
            return results
            .reduce((acc, val) => {
                return acc.concat(val)
            }, [])
            .filter((event) => {
                return moment(event.startDate).isBetween(moment(), moment().add(45, 'days'))
            })
            .sort(descDate)
            .map(event => {
                const startMoment = moment(event.startDate)
                event.startDate = moment(event.startDate).format('LL')
                return event
            })
        })
    }

    fetchOrganizationEvents(organizationSlug) {
        return axios.request({
            method: 'get',
            url: `https://www.meetup.com/${organizationSlug}/`
          })
          .then((response) => {
              const html = response.data
              const $ = cheerio.load(html)
              let events = []
              let organization = {}
              let parseData = (data) => {
                if(data["@type"] === "Event") {
                    events.push(data)
                } else if (data["@type"] === "Organization") {
                    organization = data
                }
              };

              $('script[data-react-helmet]').each((index, el) => {
                  try {
                    const data = JSON.parse(el.children[0].data)
                    if(Array.isArray(data)) {
                        data.forEach(parseData)
                    } else {
                        parseData(data)
                    }
                  } catch {
                    // json parse error, ignore data
                  }
              })
              events.forEach(event => { 
                  event.organization = organization
              })
              return events
          })
    }

}

module.exports = Meetup;