# Validating ArcGIS stage data

The ArcGIS data is updated in staging on a regular basis (currently weekly) and needs to be validated before it moves to the prod environment. This repo contains a collection of specs that will verify basics regarding the schema and check for duplicate entries.

## Running specs
The specs default to the staging environment so running the specs against staging can be done with

    rspec .

To run the specs against the prod environment (useful for comparison or troubleshooting) you can specify the `USE_PROD_GIS` environment variable like this

    USE_PROD_GIS=1 rspec .

There are test runners for convenience as well

    ./test_stage
    ./test_prod

## Additional validation
It is advisable to do local end to end testing against stage data as well. Assuming you have the vets-api and vets-website running on your local machine, this can be accomplished by modifying the ArcGIS endpoints located in the `vets-api/config/settings.yml` file

    vha: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VHA_Facilities/FeatureServer/0
    nca: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/NCA_Facilities/FeatureServer/0
    vba: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VBA_Facilities/FeatureServer/0
    vc: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VHA_VetCenters/FeatureServer/0

to (note the ***_stage*** as part of the facility type)

    vha: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VHA_Facilities_stage/FeatureServer/0
    nca: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/NCA_Facilities_stage/FeatureServer/0
    vba: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VBA_Facilities_stage/FeatureServer/0
    vc: https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/VHA_VetCenters_stage/FeatureServer/0

Start vets-api e.g. `make up` and start the vets-website e.g. `yarn watch` and navigate to

    http://localhost:3001/facilities/

Ensure that you are able to search for and view each type of facility. Verify in logs that the stage urls are being used.

## Failing specs or data issues
It's not uncommon for there to be a duplicate facility in the data. This needs to be corrected from the source of the data and is typically not something GeoBISL team can help with directly. Aside from source data quality problems, reach out to Eddie Heath (Eddie.Heath@va.gov) when there are problems with the staging data.

### Common problems
* Endpoint returns 'token required' message -- This is a misconfiguration by GeoBISL team, contact Eddie.Heath@va.gov
