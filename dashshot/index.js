const fs = require('fs');
const puppeteer = require('puppeteer');
const PDFMerge = require('pdf-merge');

async function create_pdf(dashes) {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1600, height: 1200});
  await page.emulateMedia('screen')
  for (let dash of dashes) {
    await page.goto(dash['url'], {waitUntil: 'networkidle', networkIdleTimeout: 8000});
    await page.pdf({path: dash['file'], printBackground: true, width: 1600, height: 1200});
  }

  const files = dashes.map((x)=> x['file']);
  await PDFMerge(files, {output: 'kudos.pdf'});

  for (let file of files) {
    fs.unlinkSync(file)
  }

  await browser.close();
}

const dashes = [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbcUNSbTlnWjZaVzA/page/IBLI", file: "kudos-1.pdf"},
                {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbcUNSbTlnWjZaVzA/page/GELI", file: "kudos-2.pdf"}];

(async () => { await create_pdf(dashes)})();
