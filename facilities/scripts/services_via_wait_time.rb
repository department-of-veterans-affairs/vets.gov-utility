# script used on 5/9/2018 to export known list of facilities and available services
# as indicated by presence of 'wait time' data
# target use was rails console of vets-api but I'm adding it to utilities for reference
redis_store = Common::RedisStore.redis_store('facility-access-wait-time')
facility_ids = redis_store.keys

possible_services = []
facility_ids.each do |facility_id|
  facility_wait_time = FacilityWaitTime.find(facility_id)
  possible_services += facility_wait_time&.metrics&.keys || []
end
possible_services = possible_services.uniq.sort
File.open('services.csv','w') do |file|
  file.puts "facility_id,facility_name,#{possible_services.join(',')}"
  facility_ids.each do |facility_id|
    facility_wait_time = FacilityWaitTime.find(facility_id)
    vha_facility = Facilities::VHAFacility.find(facility_id)
    services = facility_wait_time&.metrics&.keys || []
    entry = "#{facility_id},\"#{vha_facility&.name}\","
    possible_services.each do |service|
      entry << (services.include?(service) ? 'Yes,' : 'No,')
    end
    file.puts entry.chop
  end
end
