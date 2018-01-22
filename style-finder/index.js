/**
 * Naive selector finder
 *
 * This script will take an scss or css file and find all the possible selectors. It's a dumb
 *  script, so it won't keep relative positioning of DOM elements. That is, the following CSS
 *
 *    .parent .child
 *
 *  will be split into two separate selectors: parent and child. It won't make any distinction
 *  that 1) they were class names, or 2) .child is a child of .parent.
 *
 * The goal of this program is to get a usable output to pipe into `xargs` and feed into `grep`.
 * Ultimately, you should be able to use this to help find what styles are being used in a
 *  project. It's just quick and dirty.
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length <= 2) {
  console.log(`Usage: node ${path.basename(__filename)} path/to/file.css`);
  process.exit(0);
}



// --- Setup --- //

// NOTE: For `[prop="value"]` selectors, the output from this script is just `prop=`
//  to facilitate piping into `grep`
// This can probably be fixed later.

// Before a selector will be any number of the following:
//  Newline, carriage return, space, curly braces, semicolon
const beforeSelectors = '\r\n\s{};';
const afterSelectors = '{';

// Using what we know about selectors, construct a regex that'll capture them all
const allSelectorsRE = new RegExp(`[${beforeSelectors}]+(.+)${afterSelectors}`, 'g');

// When we get a blob of selectors, split them up with the following to get individual "naive"
//  selectors--that is, just the selector names with no context of relative position or anything
const selectorDelimiters= /[\[\].#,>+\s&{};]+/g;

// Inside a single "naive" selector, we can't have the following (because we can't search for
//  them in the code)
const invalidSelectorCharacters = /[\$@]/g;

// This is where we'll hold all the unique naive selectors when we're done
const allSelectors = new Set();



// --- Do stuff --- //

// argv[0]: node, argv[1]: script name; ignore these
const [,, ...args] = process.argv;

let cssFileName;
let ignoreList = [];
let ignoreTagNames = false;
for (let i = 0; i < args.length; i++) {
  switch(args[i]) {
    case '--ignore-tagnames':
      ignoreTagNames = true;
      break;
    case '--source':
      cssFileName = args[i + 1];
      i++;
      break;
    case '--ignore':
      ignoreList = args[i + 1].split(/[,\s]+/g);
      i++;
      break;
    default:
      // Assume the first unnamed parameter is source and the second is the ignore list
      if (!cssFileName) {
        cssFileName = args[i];
      } else if (!ignoreList) {
        ignoreList = args[i].split(/[,\s]+/g);
      }
  }
};

// Ignore common tag names
if (ignoreTagNames) {
  ignoreList = ignoreList.concat([
    'p', 'div', 'input', 'select', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5',
    'a', 'legend', 'fieldset', 'ul', 'li',
    'dl', 'dd', 'dt', 'form', 'label'
  ]);
}

const cssString = fs.readFileSync(cssFileName, 'utf-8');

const match = cssString
  // Remove comments so they don't mess things up
  .replace(/\/\/.*$/gm, '')
  .replace(/\/\*[^]*\*\//g, '')
  .match(allSelectorsRE);

if (match === null) {
  console.log('No selectors found.');
  process.exit(0);
}

const [, ...selectorGlobs] = match;

selectorGlobs.forEach((glob) => {
  glob = glob.replace(/[\r\n]/g, ' ');
  // Ignore selectors we can't search for in the code base
  if (invalidSelectorCharacters.test(glob)) {
    return;
  }

  // Split the glob into naive selectors
  const naiveSelectors = glob.split(selectorDelimiters);

  // Add to the allSelectors set (ignoring pseudo elements);
  naiveSelectors.forEach((sel) => {
    // Ignore empty strings and pseudo elements
    if (sel === '' || sel.includes(':')) {
      return;
    }

    // Ignore certain element tags because they're too prolific and are probably included with
    //  other selectors. This is to increase the signal to noise ratio.
    if (ignoreList.includes(sel)) {
      return;
    }

    // Turn prop="value" into prop= to make `grep`ing easier
    // Note: This keeps prop=false as prop=false which may or may not be desired
    allSelectors.add(sel.replace(/".*$/m, ''));
  });
});


// Finally, print!
Array.from(allSelectors).forEach((sel) => {
  console.log(sel);
});

