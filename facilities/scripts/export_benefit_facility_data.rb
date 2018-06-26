# script used on 6/25/2018 to export known list of VBA (benefits) facilities
# to pass along to VBA for validation
# target use was rails console of vets-api but I'm adding it to utilities for reference

attrs = %i[unique_id name classification website lat long address phone hours services]
address_attrs = %i[address_1 address_2 city state zip]
phone_attrs = %i[main fax]
services_attrs = %i[standard_benefits other_benefits]
list = Facilities::VBAFacility.pluck(*attrs)

File.open('benefit_facilities.csv','w') do |file|
  headers = attrs[0..5]
  headers << address_attrs
  headers << phone_attrs
  headers << attrs[8]
  headers << services_attrs
  file.puts(headers.join(','))
  list.each do |facility_info|
    data = facility_info[0..5].map{|item|"\"#{item}\""}
    data << address_attrs.map{|item| "\"#{facility_info[6]['physical'][item.to_s]}\""}
    data << phone_attrs.map{|item| "\"#{facility_info[7][item.to_s]}\""}
    data << "\"#{facility_info[8].map{|day,hours|"#{day}:#{hours}"}.join('|')}\""
    data << "\"#{facility_info[9]['benefits']['standard'].join('|')}\""
    data << "\"#{facility_info[9]['benefits']['other']}\""
    file.puts(data.join(','))
  end
end
