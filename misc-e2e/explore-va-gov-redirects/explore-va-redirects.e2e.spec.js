/* USAGE:
* Download and save this file to your local vets-website repo-root.
* IF you have not yet downloaded the helpers file, do that too:
* https://gist.github.com/tlei123/64bb0d81487768da36ec4294cbef7f94
* In Mac Terminal, cd to repo-root, then run:
* yarn test:e2e ./explore-va-redirects.e2e.spec.js
*/
const E2eHelpers = require('platform/testing/e2e/helpers');
const Timeouts = require('platform/testing/e2e/timeouts.js');

const EvrHelpers = require('./evr-helpers.js');

module.exports = E2eHelpers.createE2eTest(client => {
  const evOrigin = 'https://explore.va.gov';
  const vaDestination = 'https://www.va.gov';
  const modalSelector = '#modal-announcement';

  // Test redirects to va.gov.
  EvrHelpers.redirects.forEach((value, key) => {
    client.openUrl(`${evOrigin}${key}`).waitForElementVisible(
      modalSelector,
      Timeouts.slow,
      false,
      result => {
        /* eslint-disable no-console */
        console.log(
          `TESTING REDIRECT from ${evOrigin}${key} ===========================`,
        );
        // console.log('waitForElement result: ', result);
        /* eslint-enable no-console */
        if (result.value) {
          client.verify
            .urlEquals(`${vaDestination}${value}`)
            .verify.containsText(
              `${modalSelector} .announcement-title`,
              'ExploreVA is now part of VA.gov',
            );
          client
            .axeCheck(modalSelector)
            .click(`${modalSelector} [role=document] button`)
            .waitForElementNotPresent(modalSelector, Timeouts.normal);
        } else {
          /* eslint-disable no-console */
          console.log(
            `  FAILED: Redirect to ${vaDestination}${value} ==================`,
          );
          /* eslint-enable no-console */
        }
      },
      'Looking for brand-consolidation modal',
    );
  });

  client.end();
});
