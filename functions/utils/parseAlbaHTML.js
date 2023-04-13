const cheerio = require('cheerio');

const parseAlbaHTML = (html) => {
  const $ = cheerio.load(`<table>${html}</table>`);

  const results = [];

  $('tr').each((index, element) => {
    const id = $(element).attr('id');
    const territory = $(element).find('.territory b').text().trim();
    const city = $(element)
      .find('.territory br')[0]
      .nextSibling.nodeValue.trim();
    const status = $(element).find('.badge-success').text().trim();
    const details = [];

    $(element)
      .find('.dropdown-menu li a')
      .each((index, element) => {
        const url = $(element).attr('rel');
        const text = $(element).text().trim();
        details.push({ url, text });
      });

    const row = { id, territory, city, status, details };
    results.push(row);
  });

  return results;
};

module.exports = parseAlbaHTML;
