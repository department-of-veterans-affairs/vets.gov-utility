# Collection of scripts used to pull and investigate mvi requests and responses
# that were recorded via the logging middleware to the PersonalInformationLog table
# This was built in iterations with no emphasis on effeciency as it was exploratory
# in nature. I mainly want to save this work for future reference if we need to dig in
# again in the future


# for use in rails console
# parses and classifies responses into success and failures
# failures occur for various reasons but we were mostly interested
# in lack of subject and patient structure

bad_apples = {
  nodoc: [],
  nobody: [],
  fail: { ar: [], ae: [], other: [] },
  notfound: { nosubject: [], nopatient: [] }
}
good_apples = []
other = []

PersonalInformationLog.where(error_class:'MVIRequest').each{ |pii|
  doc = Ox.parse(pii.decoded_data['response_body'])
  unless doc
    bad_apples[:nodoc] << pii
    next
  end
  body = doc.locate('env:Envelope/env:Body/idm:PRPA_IN201306UV02')&.first
  unless body
    bad_apples[:nobody] << pii
    next
  end
  code = body.locate('acknowledgement/typeCode/@code')&.first
  if code == 'AR'
    bad_apples[:fail][:ar] << pii
  elsif code == 'AE'
    bad_apples[:fail][:ae] << pii
  elsif code != 'AA'
    bad_apples[:fail][:other] << pii
  end
  subject = body.locate('controlActProcess/subject')&.first
  unless subject
    bad_apples[:notfound][:nosubject] << pii
    next
  end
  patient = subject.locate('registrationEvent/subject1/patient')&.first
  unless patient
    bad_apples[:notfound][:nopatient] << pii
    next
  end
  if code == 'AA' && doc && body && subject && patient
    good_apples << pii
  end
  other << pii
}.size

# walks through AR coded failures to pull out the detail message
# unrelated to RecordNotFound scenario we are interested in
bad_apples[:fail][:ar].map do |item|
  doc = Ox.parse(item.decoded_data['response_body'])
  body = doc.locate('env:Envelope/env:Body/idm:PRPA_IN201306UV02')&.first
  # code = body.locate('acknowledgement/acknowledgementDetail/code/@displayName').first
  code = body.locate('acknowledgement/acknowledgementDetail/text/').first.text
end.uniq

# once we have classified the failures this walks through the results and writes a summary
# txt file with the request and response pretty printed so we can pull them from the host
bad_apples[:notfound][:nosubject].each do |pii|
  File.open("pii_data/#{pii.id}.txt",'w') do |file|
    data = pii.decoded_data
    file.puts "url: #{data['url']}"
    file.puts "method: #{data['method']}"
    file.puts "created_at: #{pii.created_at}"
    file.puts 'REQUEST:'
    file.puts data['request_body'].force_encoding('utf-8')
    file.puts ''
    file.puts 'RESPONSE:'
    response = Ox.load(data['response_body'])
    file.puts Ox.dump response
  end
end.size

# similarly walks through the success and writes a summary txt file with the request and
# response pretty printed so we can pull them from the host
good_apples.each do |pii|
  File.open("pii_success/#{pii.id}.txt",'w') do |file|
    data = pii.decoded_data
    file.puts "url: #{data['url']}"
    file.puts "method: #{data['method']}"
    file.puts "created_at: #{pii.created_at}"
    file.puts 'REQUEST:'
    file.puts data['request_body'].force_encoding('utf-8')
    file.puts ''
    file.puts 'RESPONSE:'
    response = Ox.load(data['response_body'])
    file.puts Ox.dump response
  end
end.size

# chooses 100 samples from the directory as a random subset
Dir['*.txt'].sample(100).each do |file_name|
  `cp #{file_name} 100_sample_success/`
end

# walks the directory (full or subset) and builds a summary csv of the parsed
# params used to build the request allowing us a high level view that points back
# to the full xml request and response

require 'ox'
File.open('requests.csv','w') do |file|
  file.puts "file_name, ssn, dob, family_name, given_names, gender"
  Dir['*.txt'].each do |file_name|
    txt = File.open(file_name).readlines
    request_index = txt.find_index("REQUEST:\n")
    response_index = txt.find_index("RESPONSE:\n")
    # response = txt[response_index + 1..-1].join
    parsed_request = Ox.load(txt[request_index + 1..response_index - 1].join)

    ssn = parsed_request.locate('*/livingSubjectId/value/@extension').first
    if ssn
      dob = parsed_request.locate('*/livingSubjectBirthTime/value/@value').first
      family_name = parsed_request.locate('*/livingSubjectName/value/family').first.text
      given_names = parsed_request.locate('*/livingSubjectName/value/given').map(&:text).join('|')
      gender = parsed_request.locate('*/livingSubjectAdministrativeGender/value/@code').first
      file.puts [file_name, ssn, dob, family_name, given_names, gender].join(', ')
    else
      icn = parsed_request.locate('*/parameterList/id/@extension').first
      file.puts "--- request was made via icn: #{icn} ---"
    end
  end
end.size
