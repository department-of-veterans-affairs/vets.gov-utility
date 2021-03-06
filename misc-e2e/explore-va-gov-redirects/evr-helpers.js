/* USAGE:
*  Download & save this file to your local vets-website repo-root.
*  IF you have not yet downloaded explore-va-redirects.e2e.spec.js, do that too:
*  https://gist.github.com/tlei123/2b93b1938e4b2a32c787e6598daf8955
*  Test command details are at the top that spec-file.
*/

const redirects = new Map(); // Map of origin paths to destination paths.

// Keep key and value on separate lines for better scanning/legibility.
/* eslint-disable prettier/prettier */
redirects
  .set(
    '/Benefits/EmploymentResource',
    '/careers-employment/?from=explore.va.gov',
  )
  .set(
    '/employment-services/vocational-rehabilitation',
    '/careers-employment/vocational-rehabilitation/?from=explore.va.gov',
  )
  .set(
    '/assistance',
    '/?from=explore.va.gov',
  )
  .set(
    '/benefits-navigator',
    '/?from=explore.va.gov',
  )
  .set(
    '/disability-compensation/disability-rating-and-rates',
    '/disability/about-disability-ratings/?from=explore.va.gov',
  )
  .set(
    '/disability-compensation/spouses-dependents-survivors',
    '/burials-memorials/dependency-indemnity-compensation/?from=explore.va.gov',
  )
  .set(
    '/disability-compensation',
    '/disability/?from=explore.va.gov',
  )
  .set(
    '/education-training/gi-bill',
    '/education/about-gi-bill-benefits/?from=explore.va.gov',
  )
  .set(
    '/education-training/job-training',
    '/education/about-gi-bill-benefits/how-to-use-benefits/on-the-job-training-apprenticeships/?from=explore.va.gov',
  )
  .set(
    '/education-training/montgomery-gi-bill',
    '/education/about-gi-bill-benefits/?from=explore.va.gov',
  )
  .set(
    '/education-training/scholarships-grants',
    '/education/?from=explore.va.gov',
  )
  .set(
    '/education-training/spouses-dependents-survivors',
    '/education/survivor-dependent-benefits/?from=explore.va.gov',
  )
  .set(
    '/education-training',
    '/education/?from=explore.va.gov',
  )
  .set(
    '/employment-services/counseling',
    '/careers-employment/education-and-career-counseling/?from=explore.va.gov',
  )
  .set(
    '/employment-services/employment-benefits',
    '/careers-employment/vocational-rehabilitation/?from=explore.va.gov',
  )
  .set(
    '/employment-services/spouses-dependents-survivors',
    '/careers-employment/dependent-benefits/?from=explore.va.gov',
  )
  .set(
    '/employment-services',
    '/careers-employment/?from=explore.va.gov',
  )
  .set(
    '/events',
    '/outreach-and-events/events/?from=explore.va.gov',
  )
  .set(
    '/file-claim',
    '/disability/how-to-file-claim/?from=explore.va.gov',
  )
  .set(
    '/file-disagreement',
    '/decision-reviews/?from=explore.va.gov',
  )
  .set(
    '/forms/VBA-21-0958',
    '/decision-reviews/?from=explore.va.gov',
  )
  .set(
    '/forms/VBA-21-0966',
    '/disability/how-to-file-claim/?from=explore.va.gov',
  )
  .set(
    '/forms/VBA-21-526EZ',
    '/disability/how-to-file-claim/?from=explore.va.gov',
  )
  .set(
    '/health-care/assisted-living',
    '/health-care/about-va-health-benefits/long-term-care/?from=explore.va.gov',
  )
  .set(
    '/health-care/dental',
    '/health-care/about-va-health-benefits/dental-care/?from=explore.va.gov',
  )
  .set(
    '/health-care/family-health-care',
    '/health-care/family-caregiver-benefits/?from=explore.va.gov',
  )
  .set(
    '/health-care/mental-health',
    '/health-care/health-needs-conditions/mental-health/?from=explore.va.gov',
  )
  .set(
    '/health-care/spouses-dependents-survivors',
    '/health-care/family-caregiver-benefits/?from=explore.va.gov',
  )
  // .set(
  //   '/health-care/vet-center-services',
  //   'https://www.vetcenter.va.gov',
  // )
  .set(
    '/health-care/vision',
    '/health-care/about-va-health-benefits/vision-care/?from=explore.va.gov',
  )
  .set(
    '/health-care-affordable-care-act',
    '/health-care/about-affordable-care-act/?from=explore.va.gov',
  )
  .set(
    '/health-care',
    '/health-care/?from=explore.va.gov',
  )
  .set(
    '/home-loans-and-housing/adaptive-home-and-vehicle',
    '/housing-assistance/disability-housing-grants/?from=explore.va.gov',
  )
  .set(
    '/home-loans-and-housing/refinancing',
    '/housing-assistance/home-loans/loan-types/?from=explore.va.gov',
  )
  .set(
    '/home-loans-and-housing/spouses-dependents-survivors',
    '/housing-assistance/home-loans/surviving-spouse/?from=explore.va.gov',
  )
  .set(
    '/home-loans-and-housing',
    '/housing-assistance/?from=explore.va.gov',
  )
  .set(
    '/intent-to-file',
    '/disability/how-to-file-claim/?from=explore.va.gov',
  )
  .set(
    '/life-insurance/spouses-dependents-survivors',
    '/life-insurance/?from=explore.va.gov',
  )
  .set(
    '/life-insurance',
    '/life-insurance/?from=explore.va.gov',
  )
  .set(
    '/memorial-benefits/funeral-services',
    '/burials-memorials/?from=explore.va.gov',
  )
  .set(
    '/memorial-benefits/spouses-dependents-survivors',
    '/burials-memorials/?from=explore.va.gov',
  )
  .set(
    '/memorial-benefits',
    '/burials-memorials/?from=explore.va.gov',
  )
  .set(
    '/outreach-materials',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/outreach-sharing',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/pension/spouses-dependents-survivors',
    '/pension/survivors-pension/?from=explore.va.gov',
  )
  .set(
    '/pension',
    '/pension/?from=explore.va.gov',
  )
  .set(
    '/share/benefits-for-veterans',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/did-you-know-health-care',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/did-you-know-memorial-benefits',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/help-the-veterans-in-your-life',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/honor-veterans',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/now-that-you-are-home',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/spread-the-word-va-home-loans',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/share/transition-to-life-after-the-military',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/spouses-dependents-survivors',
    '/family-member-benefits/?from=explore.va.gov',
  )
  .set(
    '/video/compensation-greg',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/compensation-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/education-chris',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/education-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/employment-jason',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/employment-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/explore-va-benefits-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/health-care-jackie',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/health-care-natasha',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/health-care-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/health-care-pete',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/home-loans-eiler',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/home-loans-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/housing-grant',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/how-to-share',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/life-insurance-josh',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/life-insurance-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/memorial-winnie',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/pension-jim',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/pension-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/spouses-dependents-survivors-overview',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video/vet-center-comp',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/video-gallery',
    '/outreach-and-events/outreach-materials/?from=explore.va.gov',
  )
  .set(
    '/',
    '/?from=explore.va.gov',
  );
/* eslint-enable prettier/prettier */

module.exports = {
  redirects,
};
