# script used on 7/11/2018 to export vba fax numbers for verification
# target use was rails console of vets-api but I'm adding it to utilities for reference

File.open('vba_fax_numbers.csv','w') do |file|
  file.puts('unique_id,name,fax')
  Facilities::VBAFacility.all.order(:unique_id).pluck(:unique_id,:name,:phone).each do |facility_info|
    file.puts("#{facility_info[0]},\"#{facility_info[1]}\",#{facility_info[2]['fax']}")
  end
end
