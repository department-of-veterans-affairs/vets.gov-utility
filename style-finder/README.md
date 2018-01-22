## Command
```
./find-styles.sh source_file target_directory [--ignore <comma separated list>]
```


## Usage
`index.js` is a a node script that finds and outputs all words used in selectors in a given `.css` or `.scss` file. It might work with `.sass` files as well, but that's untested.

**Note:** This finds all "words used in selectors", not all selectors. This means that the selector `div.class-name` will get broken up into `div` and `class-name`. We'll then `grep` for them separately.

`find-styles.sh` takes the output from `index.js` and pipes it to `grep` with some helpful formatting.

Because this script makes no attempts at determining what _kind_ of selectors are being used, it's prone to a lot of false positives. It's recommended you take an iterative approach to find styles you need to replace.

**Example:**
Start with:
```
./find-styles.sh ../vets-website/src/sass/modules/_m-schemaform.scss ../vets-website/src/js/claims-status/ --ignore p,div
```

After running that command, you find that it matches the line
```js
let content = (
```

This clearly isn't a line containing style used in `js/claims-status/`, so you issue the following command to find every instance of `content` in the directory:
```
grep -F content ../vets-website/src/js/claims-status/ -R
```

After going through that list and finding all the instances where the `.content` class is being used, you add it to your ignore list and continue searching:

```
./find-styles.sh ../vets-website/src/sass/modules/_m-schemaform.scss ../vets-website/src/js/claims-status/ --ignore p,div,content
```

## Gotchas
- If your selectors contain valid regex symbols that aren't parsed out in `index.js`, they'll be passed to `grep` as regex
- When using `find-styles.sh`, the `ignore` list can only be separated by commas
  - `index.js` allows for spaces, but they'll be interpreted as a separate argument in `find-styles.sh`
- If your style file has `p` as a selector, you're going to get a _lot_ of false positives
  - It's recommended you ignore it from the beginning
- The `grep` command uses word boundaries (`\<` and `\>`), so `content` will also match `main-content` because `-` is considered a word boundary

