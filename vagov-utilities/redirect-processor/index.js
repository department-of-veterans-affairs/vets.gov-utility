const fs = require('fs')
const path = require('path')
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

function parseRow([ existingVetsGovUrl, existingVaGovUrl, newUrl, notes ]) {
  if (existingVetsGovUrl === NOT_AVAILABLE) return null

  const replacee = existingVetsGovUrl.replace(VETS_DOT_GOV, '')
  const replacement = addTrailingSlash(newUrl)

  if (replacee === replacement) return null

  return {
    replacee,
    replacement,
    foundInFiles: [],
    counter: 0
  }
}

async function parseCsv(csv){
  const file = await fs.promises.readFile(csv)
  return file
    .toString()
    .split('\n')
    .map(row => row.split(','))
    .slice(1)
    .map(parseRow)
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

function moveMarkdownFile(link) {
  const pagesDirectory = 'content/pages'

  const oldUrl = link.replacee
  const linkWithSlash = oldUrl.endsWith('/') ? oldUrl : (oldUrl + '/')

  let markdownFile = getRelativeProjectPath(pagesDirectory, linkWithSlash + 'index.md')

  if (!isValidFile(markdownFile)) {
    let linkWithoutSlash = linkWithSlash.slice(0, -1)
    markdownFile = getRelativeProjectPath(pagesDirectory, linkWithoutSlash + '.md')
    if (!isValidFile(markdownFile)) {
      console.error('Failed to find file: ' + markdownFile)
    }
  }

  const newDirectory = getRelativeProjectPath(pagesDirectory, link.replacement)
  const newMarkdownFile = path.join(newDirectory, 'index.md')

  mkdirp.sync(newDirectory)
  fs.renameSync(markdownFile, newMarkdownFile)
}

async function writeHistory(links) {
  const date = dateFns.format(new Date(), 'MMMM D, YYYY')
  const yaml = links.map(
    link => {
      return `# ${date}\n` +
        `- src: ${link.replacee}\n` +
        `  dest: ${link.replacement}\n`
      })
    .join('\n')

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

async function main(){
  const csv = getCsvFileNameFromCommandArgs()
  const links = await parseCsv(csv)

  links.forEach(moveMarkdownFile)

  const targetDirectories = ['/va-gov', '/src', '/script']

  for (const dir of targetDirectories) await findAndReplaceAll(getRelativeProjectPath(dir), links)

  await updateBuildScript(links)
  await writeHistory(links)
}

main()