# frozen_string_literal: true
require 'rspec/expectations'
require './gis_helper'

describe 'VBA Data' do
  let(:general_attrs) do
    %w(Facility_Number Facility_Name Facility_Type
       Website_URL Lat Long Other_Services)
  end
  let(:addr_attrs) { %w(Address_1 Address_2 City State Zip) }
  let(:phone_attrs) { %w(Phone Fax) }
  let(:hours_attrs) { %w(Monday Tuesday Wednesday Thursday Friday Saturday Sunday) }
  VBA_APPROVED_SERVICE_ATTRS = %w(
    Applying_for_Benefits
    Burial_Claim_assistance
    Disability_Claim_assistance
    eBenefits_Registration
    Education_and_Career_Counseling
    Education_Claim_Assistance
    Family_Member_Claim_Assistance
    Homeless_Assistance
    VA_Home_Loan_Assistance
    Insurance_Claim_Assistance
    IDES
    Pre_Discharge_Claim_Assistance
    Transition_Assistance
    Updating_Direct_Deposit_Informa
    Vocational_Rehabilitation_Emplo
  ).freeze

  let(:mapped_attributes) do
    general_attrs + addr_attrs + phone_attrs + hours_attrs +
      VBA_APPROVED_SERVICE_ATTRS
  end

  let(:unmapped_attributes) { %w(OBJECTID Comments Organization) }

  before(:all) do
    layer_url = GISHelper.get_layer_url(:vba)
    query_url = [layer_url, 'query'].join('/')

    @metadata = GISHelper.get_metadata(layer_url)
    @data = GISHelper.get_all(query_url, @metadata['maxRecordCount'])
  end

  describe 'station numbers' do
    it 'have no duplicates' do
      ids = Hash.new(0)
      @data['features'].each do |f|
        sn = f['attributes']['Facility_Number']
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
          missing << f['attributes']['Facility_Number']
        end
      end
      expect(missing.length).to eq(0), "missing geometry: #{missing}"
    end

    it 'all stations have lat/long attributes' do
      missing = []
      @data['features'].each do |f|
        if f['attributes']['Lat'].nil? || f['attributes']['Long'].nil?
          missing << f['attributes']['Facility_Number']
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

  describe 'service attributes' do
    VBA_APPROVED_SERVICE_ATTRS.each do |svc|
      it "approved service #{svc} is fully populated" do
        unpop = @data['features'].select { |f| !%w(YES NO).include?(f['attributes'][svc]) }
        unpop_ids = unpop.map { |f| f['attributes']['Facility_Number'] }
        expect(unpop.length).to eq(0), "approved service had #{unpop.length} unpopulated facilities: #{unpop_ids}"
      end
    end
  end
end
