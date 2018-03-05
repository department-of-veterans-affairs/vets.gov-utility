# frozen_string_literal: true
require 'rspec/expectations'
require './gis_helper'

describe 'VetCenter Data' do
  let(:general_attrs) do
    %w(stationno stationname lat lon)
  end
  let(:addr_attrs) { %w(address2 address3 city st zip) }
  let(:phone_attrs) do
    %w(sta_phone)
  end
  let(:hours_attrs) { %w(monday tuesday wednesday thursday friday saturday sunday) }

  let(:mapped_attributes) do
    general_attrs + addr_attrs + phone_attrs + hours_attrs
  end
  let(:unmapped_attributes) do
    %w(address1 extractdate s_abbr OBJECTID)
  end

  before(:all) do
    layer_url = GISHelper.get_layer_url(:vc)
    query_url = [layer_url, 'query'].join('/')

    @metadata = GISHelper.get_metadata(layer_url)
    @data = GISHelper.get_all(query_url, @metadata['maxRecordCount'])
  end

  describe 'station numbers' do
    it 'have no duplicates' do
      ids = Hash.new(0)
      @data['features'].each do |f|
        sn = f['attributes']['stationno']
        ids[sn] += 1
      end
      dups = ids.select { |_k, v| v > 1 }
      expect(dups.length).to eq(0), "duplicates: #{dups}"
    end
  end

  describe 'geometry' do
    it 'all stations have geometry' do
      missing = []
      @data['features'].each do |f|
        if f['geometry'].nil? || f['geometry']['x'].nil? || f['geometry']['y'].nil?
          missing << f['attributes']['stationno']
        end
      end
      expect(missing.length).to eq(0), "missing geometry: #{missing}"
    end

    it 'all stations have lat/long attributes' do
      missing = []
      @data['features'].each do |f|
        if f['attributes']['lat'].nil? || f['attributes']['lon'].nil?
          missing << f['attributes']['stationno']
        end
      end
      expect(missing.length).to eq(0), "missing lat or long: #{missing}"
    end
  end

  describe 'attributes' do
    it 'contain all mapped attributes' do
      fields = @metadata['fields'].map { |f| f['name'] }
      missing = mapped_attributes - fields
      expect(missing.length).to eq(0), "missing mapped attributes: #{missing}"
    end

    it 'contain all known unmapped attributes' do
      fields = @metadata['fields'].map { |f| f['name'] }
      missing = unmapped_attributes - fields
      expect(missing.length).to eq(0), "missing unmapped attributes: #{missing}"
    end

    it 'contain no unexpected attributes' do
      fields = @metadata['fields'].map { |f| f['name'] }
      unexpected = fields - (mapped_attributes + unmapped_attributes)
      expect(unexpected.length).to eq(0), "unexpected attributes: #{unexpected}"
    end
  end
end
