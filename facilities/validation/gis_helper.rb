# frozen_string_literal: true
require 'faraday'
require 'json'

# Spec helper to fetch GIS data and metadata
class GISHelper
  ALL_PARAMS = {
    where: '1=1',
    inSR: 4326,
    outSR: 4326,
    returnGeometry: true,
    outFields: '*',
    f: 'json'
  }.freeze

  METADATA_PARAMS = {
    f: 'json'
  }.freeze

  def self.get_all(url)
    conn = Faraday.new(url: url) do |c|
      # c.response :logger
      c.adapter Faraday.default_adapter
    end
    response = conn.get url, ALL_PARAMS
    JSON.parse(response.body)
  end

  def self.get_metadata(url)
    conn = Faraday.new(url: url) do |c|
      # c.response :logger
      c.adapter Faraday.default_adapter
    end
    response = conn.get url, METADATA_PARAMS
    JSON.parse(response.body)
  end
end
