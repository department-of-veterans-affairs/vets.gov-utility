# Style Finder
The purpose of this utility is to aid in finding what styles are used in a project. It was originally designed to help extracting unneeded `@import`s by going through everything in the imported scss file and finding what bits are being used in an entire directory.

Later, we can even write another script to show which selectors aren't being used.

## Command
```
./find-styles.sh source_file target_directory [--ignore <comma separated list>]
```


## What this does
`index.js` is a a node script that finds and outputs all words used in selectors in a given `.css` or `.scss` file. It might work with `.sass` files as well, but that's untested.

**Note:** This finds all "words used in selectors", not all selectors. This means that the selector `div.class-name` will get broken up into `div` and `class-name`. We'll then `grep` for them separately.

`find-styles.sh` takes the output from `index.js` and pipes it to `grep` with some helpful formatting.

Because this script makes no attempts at determining what _kind_ of selectors are being used, it's prone to a lot of false positives. It's recommended you take an iterative approach to find styles you need to replace.

**Example:**
Start with:
```
./find-styles.sh ../vets-website/src/sass/modules/_m-schemaform.scss ../vets-website/src/js/letters/ --ignore p,div
```

After running that command, you find that it matches the line
```js
let content = (
```

This clearly isn't a line containing style used in `js/claims-status/`, so you search in `_m-schemaform.scss` for `content` and find its only used in the following line:
```css
#content .panel.saved-success-container {
```

Since it's only used in conjunction with `.panel.saved-success-container`, you add it to your ignore list:
```
./find-styles.sh ../vets-website/src/sass/modules/_m-schemaform.scss ../vets-website/src/js/claims-status/ --ignore p,div,content
```

Rinse and repeat.

## Gotchas
- If your selectors contain valid regex symbols that aren't parsed out in `index.js`, they'll be passed to `grep` as regex
- When using `find-styles.sh`, the `ignore` list can only be separated by commas
  - `index.js` allows for spaces, but they'll be interpreted as a separate argument in `find-styles.sh`
- If your style file has `p` as a selector, you're going to get a _lot_ of false positives
  - It's recommended you ignore it from the beginning
- The `grep` command uses word boundaries (`\<` and `\>`), so `content` will also match `main-content` because `-` is considered a word boundary
- Sass's handy `&` can sometimes get garbled for nested properties
  - If you have `&-highlighted` for instance, rather than `something-highlighted`, it'd search for `-highlighted`
- Searching for element properties is sketchy at best
  - `[type="number"]` turns into `type=` because of all the ways that could get messed up
  - Could lead to a lot of false positives as well; be careful

