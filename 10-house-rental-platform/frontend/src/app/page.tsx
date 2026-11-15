'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, Home, Calendar, ShieldCheck, CheckCircle2, 
  MapPin, DollarSign, Bed, Bath, Maximize2, AlertCircle, FileText, PawPrint 
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'TOWNHOUSE' | 'CONDO' | 'STUDIO';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  securityDeposit: number;
  availableDate: string;
  minLeaseMonths: number;
  petPolicy: 'ALLOWED' | 'CATS_ONLY' | 'DOGS_ONLY' | 'NO_PETS';
  utilitiesIncluded: string[];
  amenities: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'OFF_MARKET';
  imageUrls: string[];
}

export default function RentalHomePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [propertyType, setPropertyType] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [petPolicy, setPetPolicy] = useState('');

  // Selected property for viewing / applying
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeModal, setActiveModal] = useState<'NONE' | 'TOUR' | 'APPLY'>('NONE');

  // Tour form state
  const [tourDate, setTourDate] = useState('2026-12-05T14:00');
  const [tourNotes, setTourNotes] = useState('');
  const [tourMessage, setTourMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingTour, setSubmittingTour] = useState(false);

  // Application form state
  const [appIncome, setAppIncome] = useState('8500');
  const [appCredit, setAppCredit] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'>('EXCELLENT');
  const [appEmployer, setAppEmployer] = useState('Acme Corporation');
  const [appMoveIn, setAppMoveIn] = useState('2026-12-01');
  const [appMessage, setAppMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [propertyType, maxRent, bedrooms, petPolicy]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (propertyType) query.append('propertyType', propertyType);
      if (maxRent) query.append('maxRent', maxRent);
      if (bedrooms) query.append('bedrooms', bedrooms);
      if (petPolicy) query.append('petPolicy', petPolicy);

      const data = await apiRequest(`/properties?${query.toString()}`);
      setProperties(data);
    } catch (err) {
      console.error('Failed to load rental listings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setSubmittingTour(true);
    setTourMessage(null);

    try {
      const isoSlot = new Date(tourDate).toISOString();
      await apiRequest('/viewings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          slotTime: isoSlot,
          notes: tourNotes
        })
      });

      setTourMessage({
        type: 'success',
        text: 'Tour scheduled successfully! The property manager has reserved your 30-min window.'
      });
      setTimeout(() => {
        setActiveModal('NONE');
        setTourMessage(null);
      }, 2000);
    } catch (err: any) {
      setTourMessage({
        type: 'error',
        text: err.message || 'Slot conflict or error booking tour.'
      });
    } finally {
      setSubmittingTour(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setSubmittingApp(true);
    setAppMessage(null);

    try {
      await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          monthlyIncome: parseFloat(appIncome),
          creditScoreBracket: appCredit,
          employmentStatus: 'FULL_TIME',
          employerName: appEmployer,
          idDocumentName: 'tenant_government_id.pdf',
          incomeProofName: 'recent_paystub_verified.pdf',
          proposedMoveInDate: appMoveIn,
          proposedLeaseMonths: selectedProperty.minLeaseMonths || 12
        })
      });

      setAppMessage({
        type: 'success',
        text: 'Rental application submitted! Landlord screening is in progress.'
      });
      setTimeout(() => {
        setActiveModal('NONE');
        setAppMessage(null);
      }, 2000);
    } catch (err: any) {
      setAppMessage({
        type: 'error',
        text: err.message || 'Error submitting application.'
      });
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 mb-8 shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Residential Listings & Confidential Background Screening
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Find Your Next Long-Term Home
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Direct lease management between verified tenants and property owners. Schedule on-site viewings, submit secure background applications, sign official leases, and manage ongoing rent payments in one unified platform.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="STUDIO">Studio</option>
            <option value="HOUSE">Single-Family House</option>
            <option value="CONDO">Condo</option>
            <option value="APARTMENT">Apartment</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Max Monthly Rent</label>
          <select
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Any Budget</option>
            <option value="2000">Up to $2,000/mo</option>
            <option value="2500">Up to $2,500/mo</option>
            <option value="3000">Up to $3,000/mo</option>
            <option value="3500">Up to $3,500/mo</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bedrooms</label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Bedrooms</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Pet Policy</label>
          <select
            value={petPolicy}
            onChange={(e) => setPetPolicy(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Any Pet Policy</option>
            <option value="PETS_ALLOWED">Pets Welcome</option>
            <option value="CATS_ONLY">Cats Only</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading residential listings...</div>
      ) : properties.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600 font-medium">No properties match your filter criteria.</p>
          <button
            onClick={() => { setPropertyType(''); setMaxRent(''); setBedrooms(''); setPetPolicy(''); }}
            className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition"
            >
              <div className="relative h-48 bg-slate-200">
                <img
                  src={property.imageUrls[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded">
                  {property.propertyType}
                </div>
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow">
                  ${property.monthlyRent.toLocaleString()}/mo
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">{property.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pb-3 mb-3 border-b border-slate-100">
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-slate-400" /> {property.bedrooms} Beds</span>
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" /> {property.bathrooms} Baths</span>
                    <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5 text-slate-400" /> {property.squareFeet} sq ft</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {property.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4 text-[11px] text-slate-500">
                    <PawPrint className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pet Policy: <strong className="text-slate-700">{property.petPolicy.replace('_', ' ')}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setActiveModal('TOUR');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book Tour
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setActiveModal('APPLY');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tour Booking Modal */}
      {activeModal === 'TOUR' && selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Schedule Viewing Tour</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedProperty.title}</p>

            {tourMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2 ${
                tourMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {tourMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {tourMessage.text}
              </div>
            )}

            <form onSubmit={handleBookTour} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date & Time Window</label>
                <input
                  type="datetime-local"
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
                <span className="text-[11px] text-slate-400 block mt-1">30-minute escorted appointment with property manager.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Inquiries or Questions</label>
                <textarea
                  rows={2}
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  placeholder="e.g. Inquiring about parking spots or move-in timeline..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveModal('NONE'); setTourMessage(null); }}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTour}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingTour ? 'Reserving...' : 'Confirm Tour Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {activeModal === 'APPLY' && selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Residential Lease Application</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedProperty.title} &bull; ${selectedProperty.monthlyRent}/mo</p>

            {appMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2 ${
                appMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {appMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {appMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Gross Income ($)</label>
                  <input
                    type="number"
                    value={appIncome}
                    onChange={(e) => setAppIncome(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <span className="text-[10px] text-slate-400">Must satisfy 2.5x - 3x rent ratio</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Score Bracket</label>
                  <select
                    value={appCredit}
                    onChange={(e) => setAppCredit(e.target.value as any)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="EXCELLENT">Excellent (750+)</option>
                    <option value="GOOD">Good (680 - 749)</option>
                    <option value="FAIR">Fair (600 - 679)</option>
                    <option value="POOR">Poor (&lt; 600)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Employer / Source of Income</label>
                <input
                  type="text"
                  value={appEmployer}
                  onChange={(e) => setAppEmployer(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Move-In Date</label>
                  <input
                    type="date"
                    value={appMoveIn}
                    onChange={(e) => setAppMoveIn(e.target.value)}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lease Term</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedProperty.minLeaseMonths} Months`}
                    className="w-full text-sm border border-slate-200 bg-slate-100 rounded-lg px-3 py-2 text-slate-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-semibold text-slate-700 block">Uploaded Confidential Verification Documents:</span>
                <div className="flex items-center justify-between text-slate-600 bg-white p-2 rounded border border-slate-200">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> tenant_government_id.pdf</span>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">Encrypted</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 bg-white p-2 rounded border border-slate-200">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> recent_paystub_verified.pdf</span>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">Verified</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveModal('NONE'); setAppMessage(null); }}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingApp ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
