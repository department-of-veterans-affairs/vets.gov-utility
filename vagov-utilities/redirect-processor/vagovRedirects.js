/*
 * This file generates a list of the pages on a va.gov teamsite page that
 * should redirect to a new va.gov page
 */


const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml');

const NOT_AVAILABLE = new Set(['N/A', 'NO CHANGE']);

function parseRow([ existingVetsGovUrl, existingVaGovUrl, newUrl, notes ]) {
  if (existingVaGovUrl && !NOT_AVAILABLE.has(existingVaGovUrl) && newUrl && !NOT_AVAILABLE.has(newUrl)) {
    const firstSlash = existingVaGovUrl.indexOf('/');

    return {
      domain: existingVaGovUrl.substr(0, firstSlash),
      src: existingVaGovUrl.substr(firstSlash),
      dest: newUrl
    };
  }

  return null;
}

function parseCsv(csv, appEntryPoints){
  const file = fs.readFileSync(csv)
  return file
    .toString()
    .split('\n')
    .map(row => row.split(','))
    .slice(1)
    .map(parseRow)
    .filter(record => !!record)
}

function main() {
  const spreadsheetsDir = path.join(__dirname, '/spreadsheets')
  const spreadsheets = fs.readdirSync(spreadsheetsDir)

  let links = []

  for (const spreadsheetName of spreadsheets) {
    const csv = path.join(spreadsheetsDir, spreadsheetName)
    let nextLinks = parseCsv(csv)
    links.push(...nextLinks)
  }

  const indexLinks = links
    .filter(link => link.src.endsWith('/index.asp'))
    .map(link => ({
      ...link,
      src: link.src.replace('/index.asp', '/')
    }))
    .filter(link => link.src !== link.dest);

  links.push(...indexLinks);

  const vagovRedirects = links.filter(link => link.domain === 'www.va.gov');
  const otherDomainRedirects = links.filter(link => link.domain !== 'www.va.gov');

  fs.writeFileSync('./logs/vagovRedirects.json', JSON.stringify(vagovRedirects, null, 2));
  fs.writeFileSync('./logs/otherDomainRedirects.json', JSON.stringify(otherDomainRedirects, null, 2));
}

main();
