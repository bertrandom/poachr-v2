const cheerio = require('cheerio');
const fs = require('fs');
const rp = require('request-promise-native');

(async () => {

var aboutInitial = fs.readFileSync('./about.html');
const $ = cheerio.load(aboutInitial);

var staff = [];

var nsidFound = false;

var rows = $('#about-main table tr td').each(async function (i, el) {
    var link = $(el).find($('a'));
    var photostream = link.attr('href');
    var name = $(el).find('small').text();
    var icon = $(link).find('img').attr('src');

    var matches = icon.match(/.*\.jpg/);
    if (matches && matches[0]) {
        icon = matches[0];
    }

    var nsid = null;
    matches = icon.match(/buddyicons\/([0-9]+@N[0-9]+)_/);

    if (matches && matches[1]) {
        nsid = matches[1];
    } else {

        const body = await rp({
            uri: `https://www.flickr.com/services/oembed/?format=json&url=https://www.flickr.com${photostream}`,
            json: true
        });

        matches = body.html.match(/https:\/\/www.flickr.com\/photos\/([0-9]+@N[0-9]+)'/);
        if (matches && matches[1]) {
            nsid = matches[1];
        }

    }

    if (nsid == null) {
        return;
    }

    var person = {
        "photostream": "https://www.flickr.com" + photostream,
        "name": name,
        "icon": icon,
    };

    if (nsid) {
        person.id = nsid;
        nsidFound = true;
    }

    staff.push(person);

});

if (nsidFound && staff.length > 0) {
    fs.writeFileSync('./about.json', JSON.stringify(staff, null, "\t"), 'utf8');
}

})();