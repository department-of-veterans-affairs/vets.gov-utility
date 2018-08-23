const fs = require('fs')
const path = require('path')
const vetsGovProject = getVetsProjectLocation()
const website = 'https://www.vets.gov'
const validExtensions = ['md', 'html', 'js', 'jsx', 'json']
const filePaths = {
  internal: path.normalize('./documents/302 vets.gov internal links-Table 1.csv'),
  external: path.normalize('./documents/302 links to other .gov-Table 1.csv'),
  thirdParty: path.normalize('./documents/302 links 3rd party-Table 1.csv'),
  vetsGovProjectContent: path.join(vetsGovProject, '/content'),
  vetsGovProjectSrc: path.join(vetsGovProject, '/src')
}

function getVetsProjectLocation(){
  const vetsGovProject = process.argv[2]
  if (!vetsGovProject){
    console.log('You forgot to pass in the location of the vets-website. For example, "node index.js ../../vets-website"')
    process.exit()
  }
  return vetsGovProject
}

function readFile(file){
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, res) => resolve(res))
  })
}

function writeFile(file, contents){
  return new Promise((resolve, reject) => {
    fs.writeFile(file, contents, (err) => resolve())
  })
}

async function csvParse(filePath, type='internal'){
  const file = await readFile(filePath)
  return file
    .toString()
    .split('\n')
    .map(row => row.split(','))
    .slice(1)
    .map(([ url, statusCode, status, affectedLinksCount, redirectUri ]) => {

      if (type == 'internal'){
        url = url.replace(website, '')
        redirectUri = redirectUri.replace(website, '')
      }

      if (redirectUri.endsWith('\r')){
        redirectUri = redirectUri.slice(0, -1)
      }

      return {
        type,
        affectedLinksCount: parseInt(affectedLinksCount),
        replacee: url,
        replacement: redirectUri,
        foundInFiles: [],
        counter: 0
      }
    })
}

async function generateUrlMap(){
  const [internalParsed, externalParsed, thirdParsed] = await Promise.all([
    csvParse(filePaths.internal),
    csvParse(filePaths.external, 'otherGov'),
    csvParse(filePaths.thirdParty, 'thirdParty')
  ])
  return [ ...internalParsed, ...externalParsed, ...thirdParsed ]
}

function isValidFileType(fileName){
  for (let extension of validExtensions){
    if (fileName.endsWith(extension)){
      return true
    }
  }
}

function getFileList(directory){
  const files = fs.readdirSync(directory)
  const validExtensions = ['md', 'html', 'js', 'jsx']
  const fileList = []

  for (let file of files){
    const fullPath = path.join(directory, file)
    const pathStatus = fs.statSync(fullPath)

    if (pathStatus.isDirectory()) {
      let withSlash = path.join(fullPath, '/')
      let subdirectoryFiles = getFileList(withSlash, fileList)
      fileList.push(...subdirectoryFiles)
    } else if (!isValidFileType(file)){
      continue
    } else {
      fileList.push(fullPath)
    }
  }
  return fileList
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

async function findAndReplace(fileName, urlMap){
  const file = await readFile(fileName)
  const contents = file.toString()

  // Check for a hash
  const regex = new RegExp('(\\s|"|\'|\\(|https:\\/\\/www\\.vets\\.gov)(' + escapeRegExp(urlMap.replacee) + ')(#|\\s|"|\'|\\))', 'g')

  let counter = 0
  const newContents = contents.replace(regex, (match, p1, p2, p3) => {
    counter++
    return p1 + urlMap.replacement + p3
  })

  if (newContents != contents){
    urlMap.foundInFiles.push(fileName)
    urlMap.counter += counter
    return writeFile(fileName, newContents)
  }
}

// For each URL, loop through all of the files doing the find and replace.
// We can't do all of the find URL's at once without the risk of overwriting changes
// from the previous find-and-replace.
async function findAndReplaceAll(directory, urlList){
  const fileList = getFileList(directory)
  for (let urlMap of urlList){
    let processes = []
    for (let fileName of fileList){
      let process = findAndReplace(fileName, urlMap)
      processes.push(process)
    }
    await Promise.all(processes)
  }
}

function generateMarkdown(){
  let stats = '# Results\n'

  stats += links.map((linkMap, index) =>
`${index+1}. **${linkMap.replacee}**
  - ${linkMap.affectedLinksCount} occurrences reported, ${linkMap.counter} found
  - New Link: ${linkMap.replacement}
  - Files: ${linkMap.foundInFiles.join()}`).join('')

    return writeFile('./output/stats.md', stats)
}

function generateCsv(){
  let stats = 'Target,Replacement,Affected Links,Total Files,File List\n'
  for (let linkMap of links) {
    stats += `${linkMap.replacee},${linkMap.replacement},${linkMap.affectedLinksCount},${linkMap.counter},"${linkMap.foundInFiles.join('|')}" \n`
  }

  return writeFile('./output/stats.csv', stats)
}

async function main(){
  const links = await generateUrlMap()
  await findAndReplaceAll(filePaths.vetsGovProjectContent, links)
  await findAndReplaceAll(filePaths.vetsGovProjectSrc, links)
  await generateCsv(links)
}

module.exports = {
  readFile,
  writeFile,
  findAndReplaceAll
}

if (process.main === module) main()
