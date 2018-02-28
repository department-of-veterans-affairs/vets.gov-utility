# frozen_string_literal: true
require 'faraday'
require 'json'
require 'byebug'

# Spec helper to fetch GIS data and metadata
class GISHelper

  METADATA_PARAMS = {
    f: 'json'
  }.freeze

  FACILITY_TYPES = { nca: 'NCA_Facilities',
                     vba: 'VBA_Facilities',
                     vha: 'VHA_Facilities',
                     vc: 'VHA_VetCenters'
                    }.freeze

  def self.get_all(url,max_record_count)
    conn = Faraday.new(url: url) do |c|
      # c.response :logger
      c.adapter Faraday.default_adapter
    end

    query_count = 0
    data_collector = {'features' => []}
    response_data = nil
    loop do
      response = conn.get(url, params(query_count * max_record_count))
      response_data = JSON.parse(response.body)
      data_collector['features'] += response_data['features']
      break if response_data['features'].length < max_record_count
      query_count += 1
    end

    response_data['features'] = data_collector['features']
    response_data
  end

  def self.get_metadata(url)
    conn = Faraday.new(url: url) do |c|
      # c.response :logger
      c.adapter Faraday.default_adapter
    end
    response = conn.get url, METADATA_PARAMS
    JSON.parse(response.body)
  end

  def self.get_layer_url(type)
    stage = ENV['USE_PROD_GIS'] ? nil : '_stage'
    "https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/#{FACILITY_TYPES[type]}#{stage}/FeatureServer/0"
  end

  def self.params(offset)
    {
      where: '1=1',
      inSR: 4326,
      outSR: 4326,
      returnGeometry: true,
      outFields: '*',
      f: 'json',
      resultOffset: offset
    }
  end
end
