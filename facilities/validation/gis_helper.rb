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
    additional_data = {'features' => []}
    collection_data = nil
    loop do
      response = conn.get(url, params.merge(resultOffset:(query_count * max_record_count)))
      collection_data = JSON.parse(response.body)
      break if collection_data['features'].length < max_record_count
      byebug
      additional_data['features'] += collection_data['features']
      query_count += 1
    end

    collection_data['features'] = additional_data['features'] if additional_data.any?
    collection_data
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

  def self.params
    {
      where: '1=1',
      inSR: 4326,
      outSR: 4326,
      returnGeometry: true,
      outFields: '*',
      f: 'json'
    }
  end
end
