# frozen_string_literal: true
require 'rspec/expectations'
require './gis_helper'

describe 'NCA Data' do

  let(:general_attrs) { %w(SITE_ID FULL_NAME SITE_TYPE Website_URL) }
  let(:addr_attrs) do
    %w(SITE_ADDRESS1 SITE_ADDRESS2 SITE_CITY SITE_STATE SITE_ZIP
       MAIL_ADDRESS1 MAIL_ADDRESS2 MAIL_CITY MAIL_STATE MAIL_ZIP)
  end
  let(:phone_attrs) { %w(PHONE FAX) }
  let(:hours_attrs) { %w(VISITATION_HOURS_WEEKDAY VISITATION_HOURS_WEEKEND) }

  let(:mapped_attributes) { general_attrs + addr_attrs + phone_attrs + hours_attrs }

  let(:unmapped_attributes) do
    %w(OBJECTID CEMETERY_I SHORT_NAME SITE_STATUS SITE_OWNER SITE_COUNTRY
       MAIL_COUNTRY VISITATION_HOURS_COMMENT OFFICE_HOURS_WEEKDAY
       OFFICE_HOURS_WEEKEND OFFICE_HOURS_COMMENT SITE_SQFT
       GOVERNING_SITE_ID DISTRICT LATITUDE_DD LONGITUDE_DD
       POSITION_SRC COMMENT ACTIVE GlobalID created_user created_date
       last_edited_user last_edited_date)
  end

  before(:all) do
    # prod
    layer_url = 'https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/NCA_Facilities/FeatureServer/0'
    # stage
    #layer_url = 'https://services3.arcgis.com/aqgBd3l68G8hEFFE/ArcGIS/rest/services/NCA_Facilities_stage/FeatureServer/0'
    query_url = [layer_url, 'query'].join('/')

    @metadata = GISHelper.get_metadata(layer_url)
    @data = GISHelper.get_all(query_url)
  end

  describe 'count' do
    it 'returns less than maxRecordCount results' do
      max = @metadata['maxRecordCount']
      expect(@data['features'].length).to be < max, 'Max record count reached, spec needs to fetch in batches'
    end
  end

  describe 'station numbers' do
    it 'have no duplicates' do
      ids = Hash.new(0)
      @data['features'].each do |f|
        sn = f['attributes']['CEMETERY_I']
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
          missing << f['attributes']['CEMETERY_I']
        end
      end
      expect(missing.length).to eq(0), "missing geometry: #{missing}"
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
