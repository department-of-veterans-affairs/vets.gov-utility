# frozen_string_literal: true
require 'rspec/expectations'
require './gis_helper'

describe 'VHA Data' do
  let(:general_attrs) do
    %w(StationNumber StationName CocClassification FacilityDataDate
       Website_URL Latitude Longitude)
  end
  let(:addr_attrs) { %w(Street Building Suite City State Zip Zip4) }
  let(:phone_attrs) do
    %w(MainPhone MainFax AfterHoursPhone PatientAdvocatePhone
       EnrollmentCoordinatorPhone PharmacyPhone MHPhone Extension)
  end
  let(:hours_attrs) { %w(Monday Tuesday Wednesday Thursday Friday Saturday Sunday) }
  let(:care_attrs) do
    %w(SHEP_Primary_Care_Routine SHEP_Primary_Care_Urgent
       SHEP_Specialty_Care_Routine SHEP_Specialty_Care_Urgent
       SHEP_ScoreDateRange)
  end
  VHA_APPROVED_SERVICE_ATTRS = %w(
    PrimaryCare
    MentalHealthCare
    DentalServices
  ).freeze
  VHA_UNAPPROVED_SERVICE_ATTRS = %w(
    Audiology
    ComplementaryAlternativeMed
    DiagnosticServices
    ImagingAndRadiology
    LabServices
    EmergencyDept
    EyeCare
    OutpatientMHCare
    OutpatientSpecMHCare
    VocationalAssistance
    OutpatientMedicalSpecialty
    AllergyAndImmunology
    CardiologyCareServices
    DermatologyCareServices
    Diabetes
    Dialysis
    Endocrinology
    Gastroenterology
    Hematology
    InfectiousDisease
    InternalMedicine
    Nephrology
    Neurology
    Oncology
    PulmonaryRespiratoryDisease
    Rheumatology
    SleepMedicine
    OutpatientSurgicalSpecialty
    CardiacSurgery
    ColoRectalSurgery
    ENT
    GeneralSurgery
    Gynecology
    Neurosurgery
    Orthopedics
    PainManagement
    PlasticSurgery
    Podiatry
    ThoracicSurgery
    Urology
    VascularSurgery
    Rehabilitation
    UrgentCare
    WellnessAndPreventativeCare
  ).freeze

  let(:mapped_attributes) do
    general_attrs + addr_attrs + phone_attrs + hours_attrs +
      care_attrs +
      VHA_APPROVED_SERVICE_ATTRS + VHA_UNAPPROVED_SERVICE_ATTRS
  end
  let(:unmapped_attributes) do
    %w(OBJECTID StationID VisnID CommonStationName CocClassificationAttribute DirectPatientSchedulingFlag)
  end

  before(:all) do
    layer_url = GISHelper.get_layer_url(:vha)
    query_url = [layer_url, 'query'].join('/')

    @metadata = GISHelper.get_metadata(layer_url)
    @data = GISHelper.get_all(query_url, @metadata['maxRecordCount'])
  end

  describe 'station numbers' do
    it 'have no duplicates' do
      ids = Hash.new(0)
      @data['features'].each do |f|
        sn = f['attributes']['StationNumber']
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
          missing << f['attributes']['StationNumber']
        end
      end
      expect(missing.length).to eq(0), "missing geometry: #{missing}"
    end

    it 'all stations have lat/long attributes' do
      missing = []
      @data['features'].each do |f|
        if f['attributes']['Latitude'].nil? || f['attributes']['Longitude'].nil?
          missing << f['attributes']['StationNumber']
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
    VHA_APPROVED_SERVICE_ATTRS.each do |svc|
      it "approved service #{svc} is fully populated" do
        unpop = @data['features'].select { |f| !%w(YES NO).include?(f['attributes'][svc]) }
        expect(unpop.length).to eq(0), "approved service had #{unpop.length} unpopulated facilities"
      end
    end

    VHA_UNAPPROVED_SERVICE_ATTRS.each do |svc|
      it "unapproved service #{svc} is not populated" do
        pop = @data['features'].select { |f| !(f['attributes'][svc].nil? || f['attributes'][svc].empty?) }
        expect(pop.length).to eq(0), "unapproved service had #{pop.length} populated facilities"
      end
    end

    VHA_APPROVED_SERVICE_ATTRS.each do |svc|
      it "approved service #{svc} is not all YES or all NO" do
        svc_vals = @data['features'].map { |f| f['attributes'][svc] }
        svc_vals = svc_vals.uniq
        expect(svc_vals).to include('YES'), 'service had zero YES values, possible ETL problem'
        expect(svc_vals).to include('NO'), 'service had zero NO values, possible ETL problem'
      end
    end
  end
end
