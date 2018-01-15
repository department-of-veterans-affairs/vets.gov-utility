const fs = require('fs');
const puppeteer = require('puppeteer');
const PDFMerge = require('pdf-merge');

const timer = ms => new Promise( res => setTimeout(res, ms));

async function create_pdf(team, dashes) {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1600, height: 1200});
  await page.emulateMedia('screen')
  for (let dash of dashes) {
    await page.goto(dash['url'], {waitUntil: ['load','networkidle0']});
    // Wait for 5 seconds to be sure everything rendered
    await timer(5000);
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

const dashes = {"kudos": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1Jtp5YJsxzdRgApBIbcDMx5420U1VsKVt/page/IBLI", file: "kudos-1.pdf"},
                          {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1Jtp5YJsxzdRgApBIbcDMx5420U1VsKVt/page/GELI", file: "kudos-2.pdf"}],
                "rainbows": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1OfD78MumK5roK7iBByiQv2mv271sKeac/page/IBLI", file: "rainbows-1.pdf"},
                             {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1OfD78MumK5roK7iBByiQv2mv271sKeac/page/GELI", file: "rainbows-2.pdf"}],
                "unicorns": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/14Gv0B2uVXgK8_U4IPnuHP43ZMDA0qJft/page/GELI", file: "unicorns.pdf"}],
                "nebula": [{url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1xsr2zq9vG8LNw0qwCG7bXX2L6APtGIR-/page/9mgG", file: "nebula-1.pdf"},
                           {url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1xsr2zq9vG8LNw0qwCG7bXX2L6APtGIR-/page/ueaI", file: "nebula-2.pdf"}],
                "exec": [{ url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/9mgG", file: "exec-1.pdf"},
                         { url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/X94K", file: "exec-2.pdf"},
                         { url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/XajK", file: "exec-3.pdf"},
                         { url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/ueaI", file: "exec-4.pdf"},
                         { url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/j24K", file: "exec-5.pdf"},
                         { url: "https://datastudio.google.com/org/oXPY3GFFQwaHnjNHpFLyFg/reporting/1GX0vKX93p84bqLK3sL5Bv7JusOay6jl7/page/TXxK", file: "exec-6.pdf"}]
};

(async () => { for (let team in dashes) {
                  await create_pdf(team, dashes[team])
                }})();
