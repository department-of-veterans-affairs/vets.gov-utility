# script used on 5/7/2018 to export known list of emergency_care and urgent_care facilities
# as indicated by presence of 'wait time' data
# target use was rails console of vets-api but I'm adding it to utilities for reference

redis_store = Common::RedisStore.redis_store('facility-access-wait-time')
facility_ids = redis_store.keys
File.open('emergency_and_urgent.csv','w') do |file|
  file.puts "facility_id,facility_name,emergency_care,urgent_care"
  facility_ids.each do |facility_id|
    facility_wait_time = FacilityWaitTime.find(facility_id)
    vha_facility = Facilities::VHAFacility.find(facility_id)
    file.puts "#{facility_id},\"#{vha_facility&.name}\",#{facility_wait_time&.emergency_care&.any? ? 'Yes': 'No'},#{facility_wait_time&.urgent_care&.any? ? 'Yes': 'No'}"
  end
end
