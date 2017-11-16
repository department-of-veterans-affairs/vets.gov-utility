const fs = require('fs');
const puppeteer = require('puppeteer');
const PDFMerge = require('pdf-merge');

async function create_pdf(team, dashes) {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1600, height: 1200});
  await page.emulateMedia('screen')
  for (let dash of dashes) {
    await page.goto(dash['url'], {waitUntil: 'networkidle', networkIdleTimeout: 8000});
    await page.pdf({path: dash['file'], printBackground: true, width: 1600, height: 1200});
  }

  const files = dashes.map((x)=> x['file']);

  if (files.length > 1) {
    await PDFMerge(files, {output: `${team}.pdf`});

    for (let file of files) {
      fs.unlinkSync(file)
    }
  }

  await browser.close();
}

const dashes = {"kudos": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbcUNSbTlnWjZaVzA/page/IBLI", file: "kudos-1.pdf"},
                          {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbcUNSbTlnWjZaVzA/page/GELI", file: "kudos-2.pdf"}],
                "rainbows": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbR3o4bDBfLTZFSmM/page/IBLI", file: "rainbows-1.pdf"},
                             {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/0B-eryOVvbpHbR3o4bDBfLTZFSmM/page/GELI", file: "rainbows-2.pdf"}],
                "unicorns": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/13_08yLsP1ncNgyWr5Ug__-fXEBCVjRs2/page/GELI", file: "unicorns.pdf"}],
                "nebula": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1hg4NB2RGJl4Hu-4ZUro6v2fdPgndpJDA/page/9mgG", file: "nebula-1.pdf"},
                           {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1hg4NB2RGJl4Hu-4ZUro6v2fdPgndpJDA/page/ueaI", file: "nebula-2.pdf"}]
};

(async () => { for (let team in dashes) {
                  await create_pdf(team, dashes[team])
                }})();
