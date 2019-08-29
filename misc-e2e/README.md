# Miscellaneous e2e tests
A place for e2e tests that do NOT belong in the [vets-website](https://github.com/department-of-veterans-affairs/vets-website) repo -- i.e., do not test actual applications’ functionality.

These can be temporarily added to vets-website repo \[but do NOT commit them], and run on top of the already-installed test-packages.

## Example
For example, the [explore.va.gov subdomain retirement e2e-test files](explore-va-gov-redirects/) here test all the explore.va.gov redirects to va.gov.  Add them to your local vets-website repo-root to run them \[change your directory-path to suit your local setup]:
```
cd ~/dev/vets-website && yarn test:e2e ./explore-va-redirects.e2e.spec.js
```
Be sure to also include usage instructions as code-comments inside your test-files:
```
/* USAGE:
* Download and save this file to your local vets-website repo-root.
* IF you have not yet downloaded the helpers file, do that too:
* https://gist.github.com/tlei123/64bb0d81487768da36ec4294cbef7f94
* In Mac Terminal, cd to repo-root, then run:
* yarn test:e2e ./explore-va-redirects.e2e.spec.js
*/
```



