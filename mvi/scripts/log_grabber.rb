# utility script to pull logs from cloudwatch
# and parse for mvi failures
# requires the awslogs utility https://github.com/jorgebastida/awslogs

# frozen_string_literal: true

require 'json'
require 'pp'
require 'set'
require 'time'
require 'byebug'

stats = {}

ranges = [['2018-11-24', '2018-11-25'],
          ['2018-11-25', '2018-11-26']]

ranges.each do |range|
  command = %(awslogs get "dsva-vetsgov-prod/srv/vets-api/src/log/vets-api-server.log" --start "#{range[0]}T00:00:00Z" --end "#{range[1]}T00:00:00" -f "{ $.message = \\"Performed MVI Query*\\" }" > #{range[0]}-mvi-query.log)
  puts command
  puts range
  system command
end

Dir['*.log'].each do |path|
  puts path

  File.open(path).each_line do |line|
    group, stream, body = line.split(' ', 3)
    message = JSON.parse(body)
    requests = Set.new

    if message['message'] =~ /^Performed MVI Query/
      date = message['timestamp'][0..9]
      time = Time.parse(message['timestamp'])

      breakdown = stats[date] ||= {
        earliest: time,
        latest: time,
        total: 0,
        total_by_authn_context: {},
        failed: 0,
        total_by_failure: {},
        total_by_failure_by_authn_context: {},
        multiple_requests: 0
      }

      breakdown[:multiple_requests] += 1 if requests.include? message['request_id']

      requests << message['request_id']

      breakdown[:earliest] = time if breakdown[:earliest] > time
      breakdown[:latest] = time if breakdown[:latest] < time

      breakdown[:total] += 1

      authn_context = message['payload']['authn_context']
      breakdown[:total_by_authn_context][authn_context] ||= 0
      breakdown[:total_by_authn_context][authn_context] += 1

      failure_type = message['message'].split('Exception: ')[1]
      breakdown[:failed] += 1 unless failure_type.nil?
      breakdown[:total_by_failure][failure_type] ||= 0
      breakdown[:total_by_failure][failure_type] += 1

      breakdown[:total_by_failure_by_authn_context] ||= {}
      breakdown[:total_by_failure_by_authn_context][failure_type] ||= {}
      breakdown[:total_by_failure_by_authn_context][failure_type][authn_context] ||= 0
      breakdown[:total_by_failure_by_authn_context][failure_type][authn_context] += 1
    end
  end
end

pp stats

MVI_RNF = 'MVI::Errors::RecordNotFound: MVI::Errors::RecordNotFound'
MVI_FRE = 'MVI::Errors::FailedRequestError: MVI::Errors::FailedRequestError'
MVI_GTO = 'Common::Exceptions::GatewayTimeout: Gateway timeout'
MVI_DUP = 'MVI::Errors::DuplicateRecords: MVI::Errors::DuplicateRecords'
MVI_ISE = 'Common::Client::Errors::HTTPError: SOAP service returned internal server error'
MVI_EOF = 'Common::Client::Errors::ClientError: end of file reached'
MVI_SHE = 'Common::Client::Errors::HTTPError: SOAP HTTP call failed'
BREAKER = 'Breakers::Outage'

def pad(content,num)
  content ||= 0
  content = content.to_s
  content += ' ' * (num - content.size)
end

authn_context_list = {
  'DSLogon' => 'dslogon',
  'MyHealtheVet' => 'myhealthevet',
  'ID.me' => nil
}.each do |authn_name,authn_value|

  puts "| Authn context: #{pad(authn_name,123)}|"
  puts '| Date       | Total  | RecordNotFound | GatewayTimeout | FailedRequest | DupRecords | ServerError | ClientErr | Breakers | Total Failed    |'
  puts '| ---        | ---    | ---            | ---            | ---           | ---        | ---         | ---       | ---      | ---             |'
  stats.keys.sort.each do |day|
    daily = stats[day]
    total_failed = daily[:total_by_failure_by_authn_context].reject{|k|k.nil?}.map{|k,v| v[authn_value]}.compact.reduce(:+) || 0
    total_failed_percentage = ((total_failed / daily[:total_by_authn_context][authn_value].to_f) * 100).round(2)
    total_failed_message = "#{total_failed} (#{total_failed_percentage}%)"
    client_errors = daily[:total_by_failure_by_authn_context].fetch(MVI_SHE, {})[authn_value].to_i +
                    daily[:total_by_failure_by_authn_context].fetch(MVI_EOF, {})[authn_value].to_i
    puts '| ' +
      "#{pad( day, 10)}" + ' | ' +
      "#{pad( daily[:total_by_authn_context][authn_value], 6)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(MVI_RNF, {})[authn_value], 14)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(MVI_GTO, {})[authn_value], 14)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(MVI_FRE, {})[authn_value], 13)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(MVI_DUP, {})[authn_value], 10)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(MVI_ISE, {})[authn_value], 11)}" + ' | ' +
      "#{pad( client_errors, 9)}" + ' | ' +
      "#{pad( daily[:total_by_failure_by_authn_context].fetch(BREAKER, {})[authn_value], 8)}" + ' | ' +
      "#{pad( total_failed_message, 15)}" + ' |'
  end
  puts ''
end