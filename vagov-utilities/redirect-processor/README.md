This script is used to process URL redirects as required by the brand consolidation of Vets.gov and VA.gov.

The index.js script:

Ultimately:
- Moves and renames .md files in the `vets-website/va-gov/pages` directory
- Updates references in the `vets-website/va-gov`, `vets-website/src`, and `vets-website/script` directories

# How to run
1. Make sure you're using the right version of Node - `nvm use`
2. Install dependencies: `npm install`
3. Make sure this repo is a sibling directory of `vets-website`, and and that `vets-website` is on the `brand-consolidation` branch
4. Execute the index script, supplying a spreadsheet as a build command: `node index.js "URL Mapping - Health.csv"`

The vagovRedirects.js script:

- Creates a vagovRedirects.json file with all the redirects from the www.va.gov domain
- Creates an otherDomainsRedirects.json file with all the redirects from non www.va.gov domains

The first will be used in the client JS code (and hopefully in nginx later).

The second will need to be used in the code that is injected into Teamsite pages.
