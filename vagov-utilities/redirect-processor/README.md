This script is used to process URL redirects as required by the brand consolidation of Vets.gov and VA.gov.

Ultimately:
- Moves and renames .md files in the `vets-website/va-gov/pages` directory
- Updates references in the `vets-website/va-gov`, `vets-website/src`, and `vets-website/script` directories

# How to run
1. Make sure you're using the right version of Node - `nvm use`
2. Install dependencies: `npm install`
3. Make sure this repo is a sibling directory of `vets-website`, and and that `vets-website` is on the `brand-consolidation` branch
4. Execute the index script, supplying a spreadsheet as a build command: `node index.js "URL Mapping - Health.csv"`
