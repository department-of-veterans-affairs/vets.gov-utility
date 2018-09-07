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
  if (existingVetsGovUrl === NOT_AVAILABLE || !newUrl) return null

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
  fs.appendFileSync(log, data)
}

function writeToYml(link) {
  const date = dateFns.format(new Date(), 'MMMM D, YYYY')
  const header = `# ${date}`
  const content = `- src: ${link.replacee}\n` + `  dest: ${link.replacement}\n` + `  is-react-app: ${link.isReactApp}`
  const filePath = path.join(__dirname, 'logs/redirects.yaml')

  fs.appendFileSync(filePath, header + '\n' + content + '\n')
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
      writeError(`Failed to find Vets.gov content file: ${link.replacee}\n`)
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

  const file = fs.readFileSync(newFileName)
  const contents = file.toString().split('\n')
  const frontMatterEndingIndex = contents
    .slice(1) // Frontmatter begins with "---", and the next occurrence is the ending
    .findIndex(row => row.trim() === '---')

  const aliasProperty = `aliases:\n  - ${link.replacee}`
  contents.splice(frontMatterEndingIndex + 1, 0, aliasProperty)

  const newContents = contents.join('\n')

  fs.writeFileSync(newFileName, newContents)
  writeToYml(link)
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

  await findAndReplaceAll(getRelativeProjectPath('./script/collections/'), collectionPatterns)
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
  const spreadsheetsDir = path.join(__dirname, '/spreadsheets')
  const spreadsheets = fs.readdirSync(spreadsheetsDir)

  let links = []

  for (const spreadsheetName of spreadsheets) {
    const csv = path.join(spreadsheetsDir, spreadsheetName)
    let nextLinks = await parseCsv(csv, appEntryPoints)
    links.push(...nextLinks)
  }

  links = links.filter(l => !!l)

  // links = links.filter(l => !l.isReactApp)
  // links.forEach(moveMarkdownFile)

  await replaceUrlsThroughoutVetsWebsite(links)
  // await updateBuildScript(links)
}

main()
