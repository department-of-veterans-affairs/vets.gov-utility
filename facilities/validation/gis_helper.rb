# frozen_string_literal: true
require 'faraday'
require 'json'

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
    data = JSON.parse conn.get(url, params).body
    count = data['features'].length
    query_count = 1

    #fetch additional pages when applicable
    while count == max_record_count
      response = conn.get(url, params.merge(resultOffset:(query_count * max_record_count)))
      additional_data = JSON.parse(response.body)
      data['features'] += additional_data['features']
      count = additional_data['features'].length
      query_count += 1
    end
    data
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
