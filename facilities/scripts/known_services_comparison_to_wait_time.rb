# script used on 5/22/2018 to compare primary care and mental health (known services)
# to what we see inferring via 'wait time' data
# target use was rails console of vets-api but I'm adding it to utilities for reference

redis_store = Common::RedisStore.redis_store('facility-access-wait-time')
facility_ids = redis_store.keys
primary_mismatch_count = 0
mental_mismatch_count = 0
facility_count = 0
File.open('comparison_known_with_wait_time.csv','w') do |file|
  file.puts "facility_id,facility_name,primary_known,primary_wait,primary_mismatch,mental_known,mental_wait,mental_mismatch"
  facility_ids.each do |facility_id|
    facility_wait_time = FacilityWaitTime.find(facility_id)
    vha_facility = Facilities::VHAFacility.find(facility_id)
    next unless vha_facility
    facility_count += 1
    metric_keys = facility_wait_time&.metrics&.keys || []
    primary_known = vha_facility&.services['health'].any?{|entry|entry['sl1'].include?('PrimaryCare')}
    primary_wait = metric_keys.include?('primary_care')
    primary_match = primary_known == primary_wait
    primary_mismatch_count += 1 unless primary_match
    mental_known = vha_facility&.services['health'].any?{|entry|entry['sl1'].include?('MentalHealthCare')}
    mental_wait = metric_keys.include?('mental_health')
    mental_match = mental_wait == mental_known
    mental_mismatch_count += 1 unless mental_match
    file.puts "#{facility_id},\"#{vha_facility&.name}\",#{primary_known},#{primary_wait},#{'MISMATCH' unless primary_match},#{mental_known},#{mental_wait},#{'MISMATCH' unless mental_match}"
  end
end
puts "primary_mismatch_count: #{primary_mismatch_count} ( #{(((facility_count - primary_mismatch_count)/facility_count.to_f) * 100).round(2)}% accuracy)"
puts "mental_mismatch_count: #{mental_mismatch_count} ( #{(((facility_count - mental_mismatch_count)/facility_count.to_f) * 100).round(2)}% accuracy)"
puts "facility_count: #{facility_count}"
