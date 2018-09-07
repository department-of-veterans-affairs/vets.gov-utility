const fs = require('fs')
const path = require('path')
const find = require('find')
const mkdirp = require('mkdirp')
const dateFns = require('date-fns')

const {
  findAndReplaceAll
} = require('../../url-fixer')

const NOT_AVAILABLE = 'N/A'

const VETS_DOT_GOV = 'www.vets.gov'
const VETS_WEBSITE_PROJECT_ROOT = '../../../vets-website';

function getRelativeProjectPath(...pieces) {
  return path.join(__dirname, VETS_WEBSITE_PROJECT_ROOT, ...pieces)
}

function getCsvFileNameFromCommandArgs() {
  const csv = process.argv[2];
  if (!csv) {
    console.log('Please pass the name of the CSV located in the spreadsheets directory to be processed as the first argument. Example: node redirect-processor/index.js "My CSV.csv"');
    process.exit();
  }
  return path.join(__dirname, './spreadsheets', csv)
}

function addTrailingSlash(str) {
  return str.endsWith('/') ? str : (str + '/')
}

function getApplicationEntryPoints() {
  const appsDir = getRelativeProjectPath('src/applications')
  return find
    .fileSync(/manifest\.json$/, appsDir)
    .map(file => {
      const manifest = require(file);
      return manifest.rootUrl
    })
}

function parseRow([ existingVetsGovUrl, existingVaGovUrl, newUrl, notes ], appEntryPoints = []) {
  if (existingVetsGovUrl === NOT_AVAILABLE) return null

  let replacee = existingVetsGovUrl.replace(VETS_DOT_GOV, '')
  replacee = addTrailingSlash(replacee)

  let replacement = addTrailingSlash(newUrl)

  // React entry points cannot contain a trailing slash, so we remove the slash if so
  const replaceeWithoutTrailingSlash = replacee.slice(0, -1)
  const isReactApp = appEntryPoints.includes(replaceeWithoutTrailingSlash)

  if (isReactApp) {
    replacee = replaceeWithoutTrailingSlash
    replacement = replacement.slice(0, -1)
  }

  if (replacee === replacement) return null

  return {
    replacee,
    replacement,
    isReactApp,
    foundInFiles: [],
    counter: 0
  }
}

async function parseCsv(csv, appEntryPoints){
  const file = await fs.promises.readFile(csv)
  return file
    .toString()
    .split('\n')
    .map(row => row.split(','))
    .slice(1)
    .map(row => parseRow(row, appEntryPoints))
    .filter(record => !!record)
}

function isValidFile(filePath) {
  try {
    fs.accessSync(filePath)
    return true
  } catch (err) {
    return false
  }
}

function writeError(data) {
  console.error(data)
  const log = path.join(__dirname, 'logs/errors.log')
  fs.appendFileSync(log, data + '\n')
}

function moveMarkdownFile(link) {
  let newFileName = null
  let oldFileName = getRelativeProjectPath('content/pages', link.replacee, '../', path.basename(link.replacee) + '.md')

  if (isValidFile(oldFileName)) {
    newFileName = getRelativeProjectPath('va-gov/pages', link.replacement, '../', path.basename(link.replacement) + '.md')
  } else {
    let indexFile = getRelativeProjectPath('content/pages', link.replacee, 'index.md')
    if (isValidFile(indexFile)) {
      oldFileName = indexFile
      newFileName = getRelativeProjectPath('va-gov/pages', link.replacement, 'index.md')
    } else {
      writeError(`Failed to find Vets.gov content file: ${link.replacee}`)
      return
    }
  }

  console.log(`Old file name: ${oldFileName}`)
  console.log(`New location: ${newFileName}`)

  if (fs.existsSync(newFileName)) {
    writeError(`File already written: ${newFileName}`)
    return
  }

  mkdirp.sync(path.join(newFileName, '../'))
  fs.copyFileSync(oldFileName, newFileName)
}

async function writeHistory(links, csv) {
  const date = dateFns.format(new Date(), 'MMMM D, YYYY')
  const spreadsheetName = path.relative(__dirname, csv)
  const header = `# ${date}: Changes generated by spreadsheet: ${spreadsheetName}\n`

  const redirects = links
    .sort(({ replacee: a }, { replacee: b }) => {
      if (a < b) return 1
      if (a > b) return -1
      return 0
    })
    .map(link => `- src: ${link.replacee}\n` + `  dest: ${link.replacement}\n` + `  is-react-app: ${link.isReactApp}`)
    .join('\n')

  const yaml = header + redirects + '\n'

  const filePath = path.join(__dirname, 'logs/redirects.yaml')
  await fs.promises.appendFile(filePath, yaml)
}

function convertUrlToGlob(url) {
  const withoutLeadingSlash = url.slice(1)
  const withTrailing = withoutLeadingSlash.endsWith('/') ? withoutLeadingSlash : addTrailingSlash(withoutLeadingSlash)
  return withTrailing + '*.md'
}

async function updateBuildScript(links) {
  const collectionPatterns = links.map(link => {
    return {
      replacee: convertUrlToGlob(link.replacee),
      replacement: convertUrlToGlob(link.replacement),
      foundInFiles: [],
      counter: 0
    }
  })

  await findAndReplaceAll(getRelativeProjectPath('./script'), collectionPatterns)
}

async function replaceUrlsThroughoutVetsWebsite(links) {
  const targetDirectories = ['va-gov']

  const nonAppLinks = links.filter(l => !l.isReactApp)
  const appLinks = links.filter(l => l.isReactApp)
  const appLinksWithSlash = appLinks.map(link => {
    return {
      ...link,
      replacee: link.replacee + '/'
    }
  })

  const allLinks = [...nonAppLinks, ...appLinks, ...appLinksWithSlash]

  for (const dir of targetDirectories) {
    await findAndReplaceAll(getRelativeProjectPath(dir), allLinks)
  }
}

async function main(){
  const appEntryPoints = getApplicationEntryPoints()

  const csv = getCsvFileNameFromCommandArgs()
  let links = await parseCsv(csv, appEntryPoints)

  links = links.filter(l => !l.isReactApp)

  links.forEach(link => moveMarkdownFile(link))
  // links.forEach(link => moveMarkdownFile(link, 'content/pages'))

  await replaceUrlsThroughoutVetsWebsite(links)
  await updateBuildScript(links)
  await writeHistory(links, csv)

  console.warn('Because the paths may be dynamic, this script does not update child routes of React applications! Check applications to be sure, and update any missed links to instead rely on the manifest.json rootUrl')
}

main()
