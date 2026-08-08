import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyListing } from '../../types';
import { saveListing } from '../../lib/storage';
import { parsePropertyDetailsWithAi } from '../../lib/aiParser';
import { ImageUploader } from './ImageUploader';
import { AmenitiesSelector } from './AmenitiesSelector';
import { ListingPreviewModal } from './ListingPreviewModal';
import {
  Building2,
  DollarSign,
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Plus,
  Trash2,
  User,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  FileText,
  Sparkles,
  Save,
  Globe,
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  Wand2,
  Check,
  AlertCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PropertyFormProps {
  initialData?: Partial<PropertyListing>;
  isEdit?: boolean;
}

const EXAMPLE_WHATSAPP_TEXT = `3 BHK Floor
138 Gaj
Gated Society
45ft RCC Roads
Ground Floor - 65.90
1st Floor - 64.90
2nd Floor - 63.90
5 Years Wooden Work Warranty
1 Year After Sales Service
Near Chandigarh Kharar Highway
Phone: 7973318763`;

export const PropertyForm: React.FC<PropertyFormProps> = ({
  initialData,
  isEdit = false,
}) => {
  const navigate = useNavigate();

  // Step Wizard State (1: Photos, 2: WhatsApp Text, 3: Magic Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(isEdit ? 3 : 1);
  const [showAdvancedForm, setShowAdvancedForm] = useState<boolean>(isEdit);

  // Form & System States
  const [saving, setSaving] = useState(false);
  const [parsingAi, setParsingAi] = useState(false);
  const [rawText, setRawText] = useState('');
  const [extractedStatus, setExtractedStatus] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Preview Workflow State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<PropertyListing | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Listing Form Fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [propertyType, setPropertyType] = useState(
    initialData?.specs?.propertyType || 'Residential Floor'
  );
  const [price, setPrice] = useState<number | ''>(
    initialData?.price !== undefined ? initialData.price : ''
  );
  const [currency, setCurrency] = useState(initialData?.currency || '₹');
  const [priceFormatted, setPriceFormatted] = useState<string>('');

  // Specs
  const [bedrooms, setBedrooms] = useState<number | ''>(
    initialData?.specs?.bedrooms !== undefined ? initialData.specs.bedrooms : ''
  );
  const [bathrooms, setBathrooms] = useState<number | ''>(
    initialData?.specs?.bathrooms !== undefined ? initialData.specs.bathrooms : ''
  );
  const [squareFeet, setSquareFeet] = useState<number | ''>(
    initialData?.specs?.squareFeet !== undefined ? initialData.specs.squareFeet : ''
  );
  const [areaText, setAreaText] = useState<string>('');
  const [yearBuilt, setYearBuilt] = useState<number | ''>(
    initialData?.specs?.yearBuilt !== undefined ? initialData.specs.yearBuilt : new Date().getFullYear()
  );
  const [parkingSpaces, setParkingSpaces] = useState<number | ''>(
    initialData?.specs?.parkingSpaces !== undefined ? initialData.specs.parkingSpaces : 1
  );

  // Location
  const [address, setAddress] = useState(initialData?.location?.address || '');
  const [neighborhood, setNeighborhood] = useState(initialData?.location?.neighborhood || '');
  const [city, setCity] = useState(initialData?.location?.city || '');
  const [state, setState] = useState(initialData?.location?.state || '');
  const [country, setCountry] = useState(initialData?.location?.country || 'India');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialData?.location?.googleMapsUrl || '');

  // Content
  const [description, setDescription] = useState(initialData?.description || '');
  const [highlights, setHighlights] = useState<string[]>(
    initialData?.highlights || []
  );
  const [amenities, setAmenities] = useState<string[]>(
    initialData?.amenities || []
  );

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');

  // Images
  const [images, setImages] = useState(initialData?.images || []);

  // Contact
  const [agentName, setAgentName] = useState(
    initialData?.contact?.agentName || 'Property Representative'
  );
  const [agentRole, setAgentRole] = useState(
    initialData?.contact?.agentRole || 'Real Estate Agent'
  );
  const [phone, setPhone] = useState(initialData?.contact?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialData?.contact?.whatsappNumber || ''
  );
  const [email, setEmail] = useState(
    initialData?.contact?.email || 'contact@propertyestates.com'
  );
  const [agencyName, setAgencyName] = useState(
    initialData?.contact?.agencyName || 'Property Advisory Group'
  );

  // Handle Description Extraction
  const handleExtractWithGemini = async () => {
    if (!rawText.trim()) {
      alert('Please paste the property details first.');
      return;
    }

    setParsingAi(true);
    try {
      const result = await parsePropertyDetailsWithAi(rawText);

      if (result.success && result.data) {
        const data = result.data;

        // Auto-fill extracted values
        if (data.title) setTitle(data.title);
        if (data.tagline) setTagline(data.tagline);
        if (data.propertyType) setPropertyType(data.propertyType);
        if (data.currency) setCurrency(data.currency);
        if (data.price !== null && data.price !== undefined) {
          setPrice(data.price);
        }
        if (data.priceFormatted) setPriceFormatted(data.priceFormatted);
        if (data.bedrooms !== null && data.bedrooms !== undefined) {
          setBedrooms(data.bedrooms);
        }
        if (data.bathrooms !== null && data.bathrooms !== undefined) {
          setBathrooms(data.bathrooms);
        }
        if (data.squareFeet !== null && data.squareFeet !== undefined) {
          setSquareFeet(data.squareFeet);
        }
        if (data.areaText) setAreaText(data.areaText);
        if (data.address) setAddress(data.address);
        if (data.city) setCity(data.city);
        if (data.neighborhood) setNeighborhood(data.neighborhood);
        if (data.description) setDescription(data.description);

        if (data.highlights && Array.isArray(data.highlights)) {
          setHighlights(data.highlights);
        }
        if (data.amenities && Array.isArray(data.amenities)) {
          setAmenities(data.amenities);
        }
        if (data.seoTitle) setSeoTitle(data.seoTitle);
        if (data.metaDescription) setMetaDescription(data.metaDescription);

        if (data.contactPhone) {
          setPhone(data.contactPhone);
          setWhatsappNumber(data.contactPhone.replace(/\D/g, ''));
        }

        setMissingFields(data.missingFields || []);
        setExtractedStatus('Details extracted successfully');
        setCurrentStep(3); // Advance to Preview Step
      } else {
        alert(result.error || 'Failed to process property details. Please try again.');
      }
    } catch (err) {
      console.error('Property details parsing error:', err);
      alert('Error processing property details. Please check connection.');
    } finally {
      setParsingAi(false);
    }
  };

  // Helper function to generate url slug from title
  const generateSlug = (rawTitle: string): string => {
    return (
      rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `listing-${Date.now()}`
    );
  };

  // Highlights handlers
  const addHighlight = () => setHighlights([...highlights, '']);
  const updateHighlight = (index: number, val: string) => {
    const copy = [...highlights];
    copy[index] = val;
    setHighlights(copy);
  };
  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, idx) => idx !== index));
  };

  // Construct complete listing object
  const buildListingObject = (targetStatus: 'draft' | 'published'): PropertyListing => {
    const generatedSlug = initialData?.slug || generateSlug(title || 'property-listing');
    const listingId = initialData?.id || `listing-${Date.now()}`;

    return {
      id: listingId,
      slug: generatedSlug,
      title: title.trim() || 'Property Listing',
      tagline: tagline.trim() || undefined,
      price: typeof price === 'number' ? price : 0,
      currency: currency || '₹',
      specs: {
        bedrooms: typeof bedrooms === 'number' ? bedrooms : 0,
        bathrooms: typeof bathrooms === 'number' ? bathrooms : 0,
        squareFeet: typeof squareFeet === 'number' ? squareFeet : 0,
        propertyType: propertyType || 'Independent Floor',
        yearBuilt: typeof yearBuilt === 'number' ? yearBuilt : undefined,
        parkingSpaces: typeof parkingSpaces === 'number' ? parkingSpaces : undefined,
      },
      location: {
        address: address.trim() || 'Chandigarh Kharar Highway',
        neighborhood: neighborhood.trim() || 'Gated Society',
        city: city.trim() || 'Chandigarh',
        state: state.trim() || undefined,
        country: country.trim() || 'India',
        googleMapsUrl: googleMapsUrl.trim() || undefined,
      },
      description: description.trim() || 'Well-built 3 BHK property featuring quality interior woodwork, modern layout, and gated society security.',
      highlights: highlights.filter((h) => h.trim() !== ''),
      amenities: amenities.length > 0 ? amenities : ['Gated Society', '45ft RCC Roads', '5 Years Warranty'],
      images,
      contact: {
        agentName: agentName.trim(),
        agentRole: agentRole.trim(),
        phone: phone.trim() || '+91 7973318763',
        whatsappNumber: whatsappNumber.trim() || '7973318763',
        email: email.trim(),
        agencyName: agencyName.trim(),
      },
      status: targetStatus,
      seoTitle: seoTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Open Preview Modal
  const handleGeneratePreview = () => {
    const draftListing = buildListingObject('draft');
    setPreviewListing(draftListing);
    setIsPreviewOpen(true);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const draftListing = buildListingObject('draft');
      await saveListing(draftListing);
      alert('Listing saved as Draft successfully!');
      navigate('/admin');
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraftFromPreview = async () => {
    if (!previewListing) return;
    setSaving(true);
    try {
      const draftData = { ...previewListing, status: 'draft' as const };
      await saveListing(draftData);
      alert('Listing saved as Draft!');
      setIsPreviewOpen(false);
      navigate('/admin');
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishFromPreview = async () => {
    if (!previewListing) return;
    setSaving(true);
    try {
      const publishedListing: PropertyListing = {
        ...previewListing,
        status: 'published',
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveListing(publishedListing);
      const url = `${window.location.origin}/p/${saved.slug}`;

      setPublishedUrl(url);
      setPreviewListing(saved);
    } catch (err) {
      console.error('Error publishing listing:', err);
      alert('Failed to publish listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Wizard Header */}
      {!isEdit && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2.5 p-3 rounded-xl transition-all text-left ${
                currentStep === 1
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                  : 'hover:bg-zinc-800/60 text-zinc-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 1
                    ? 'bg-amber-500 text-zinc-950'
                    : images.length > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {images.length > 0 && currentStep !== 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold leading-none">Photos</p>
                <p className="text-[11px] text-zinc-500 mt-1 hidden sm:block">
                  {images.length > 0 ? `${images.length} selected` : 'Upload property media'}
                </p>
              </div>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2.5 p-3 rounded-xl transition-all text-left ${
                currentStep === 2
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                  : 'hover:bg-zinc-800/60 text-zinc-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 2
                    ? 'bg-amber-500 text-zinc-950'
                    : rawText.trim()
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {rawText.trim() && currentStep !== 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold leading-none">Property Details</p>
                <p className="text-[11px] text-zinc-500 mt-1 hidden sm:block">
                  Paste client notes
                </p>
              </div>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2.5 p-3 rounded-xl transition-all text-left ${
                currentStep === 3
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                  : 'hover:bg-zinc-800/60 text-zinc-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStep === 3
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold leading-none">Preview</p>
                <p className="text-[11px] text-zinc-500 mt-1 hidden sm:block">
                  Review & publish
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: UPLOAD PROPERTY PHOTOS */}
      {currentStep === 1 && !isEdit && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Photos</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Upload high-resolution property photos or select from existing media.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {images.length} Photos Selected
            </span>
          </div>

          <ImageUploader
            images={images}
            onChange={(newImages) => setImages(newImages)}
            maxImages={20}
          />

          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Photos can be rearranged or updated later.
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <span>Next: Property Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PASTE PROPERTY DETAILS */}
      {currentStep === 2 && !isEdit && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Property Details
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paste the property details exactly as received from the client.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Property Details
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste the property details exactly as received from the client...\n\nExample:\n3 BHK Floor\n138 Gaj\nGated Society\n45ft RCC Roads\nGround Floor - 65.90 Lakhs\n5 Years Wooden Work Warranty\nPhone: 7973318763`}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto border border-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={parsingAi || !rawText.trim()}
              onClick={handleExtractWithGemini}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
            >
              {parsingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Listing...</span>
                </>
              ) : (
                <>
                  <span>Generate Listing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & CONFIRMATION */}
      {(currentStep === 3 || isEdit) && (
        <div className="space-y-6">
          {/* Status Banner */}
          {extractedStatus && !isEdit && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-200">
                    Listing Details Extracted
                  </h3>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    Property information has been formatted and prepared for review.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-emerald-300 hover:underline shrink-0"
              >
                Edit Details
              </button>
            </div>
          )}

          {/* Missing Fields Prompt */}
          {missingFields.length > 0 && !isEdit && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Confirm Required Details ({missingFields.length})
                </h4>
              </div>
              <p className="text-xs text-amber-200/80">
                Please confirm the following details before publishing:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {missingFields.includes('price') && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200 mb-1">
                      Property Price ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 6590000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {missingFields.includes('bathrooms') && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-200 mb-1">
                      Number of Bathrooms
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extracted Listing Summary Card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase">
                    Property Overview
                  </span>
                  <span className="text-xs text-zinc-400">Ready for Preview</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mt-2">
                  {title || 'Untitled Property Listing'}
                </h2>
                {tagline && <p className="text-xs text-zinc-400 mt-1">{tagline}</p>}
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {currency}
                  {typeof price === 'number'
                    ? price >= 10000000
                      ? `${(price / 10000000).toFixed(2)} Cr`
                      : price >= 100000
                      ? `${(price / 100000).toFixed(2)} Lakhs`
                      : price.toLocaleString()
                    : 'Price on Request'}
                </p>
                {priceFormatted && <p className="text-[11px] text-zinc-400 font-mono">{priceFormatted}</p>}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Property Type</p>
                <p className="text-xs font-bold text-zinc-200 mt-0.5">{propertyType}</p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Bedrooms / BHK</p>
                <p className="text-xs font-bold text-zinc-200 mt-0.5">
                  {bedrooms ? `${bedrooms} BHK` : 'Not specified'}
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Area</p>
                <p className="text-xs font-bold text-zinc-200 mt-0.5">
                  {areaText || (squareFeet ? `${squareFeet} Sq. Ft.` : 'Not specified')}
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Contact Phone</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5 font-mono">
                  {phone || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Story Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Property Description
              </h3>
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                {description || 'No description available.'}
              </div>
            </div>

            {/* Key Amenities & Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Highlights ({highlights.length})
                </h4>
                <div className="space-y-1">
                  {highlights.map((h, i) => (
                    <div key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Amenities ({amenities.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle Full Form Customizer */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {showAdvancedForm ? 'Hide Manual Form' : 'Edit Details Manually'}
                </span>
                {showAdvancedForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Globe className="w-4 h-4 stroke-[2.5]" />
                  <span>Preview & Publish</span>
                </button>
              </div>
            </div>
          </div>

          {/* ADVANCED FULL MANUAL FORM (ACCORDION / EDIT MODE) */}
          {showAdvancedForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGeneratePreview();
              }}
              className="space-y-8 pt-4 border-t border-zinc-800"
            >
              {/* 1. Basic Info & Pricing */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Property Overview</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3 BHK Independent Floor in Gated Society"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Modern Architecture Near Chandigarh Kharar Highway"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Property Type
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Residential Floor">Residential Floor</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Plot">Plot</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Office">Office</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Retail Shop">Retail Shop</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Farm House">Farm House</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="₹">₹ (INR)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                        <option value="£">£ (GBP)</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Price
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 6590000"
                          value={price}
                          onChange={(e) =>
                            setPrice(e.target.value ? Number(e.target.value) : '')
                          }
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors pl-8"
                        />
                        <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-bold">
                          {currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Specs */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <Maximize2 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Property Specifications</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Bedrooms
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) =>
                          setBedrooms(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors pl-8"
                      />
                      <Bed className="w-4 h-4 text-zinc-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Bathrooms
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={bathrooms}
                        onChange={(e) =>
                          setBathrooms(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors pl-8"
                      />
                      <Bath className="w-4 h-4 text-zinc-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Area (Sq. Ft.)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1242"
                      value={squareFeet}
                      onChange={(e) =>
                        setSquareFeet(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Year Built
                    </label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={yearBuilt}
                      onChange={(e) =>
                        setYearBuilt(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Location */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Location & Address</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Chandigarh Kharar Highway"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Neighborhood / Society
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gated Society"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chandigarh / Mohali / Kharar"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Story & Highlights */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Property Story & Highlights</h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Story Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Feature Highlights
                    </label>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Highlight</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => updateHighlight(idx, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeHighlight(idx)}
                          className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Amenities */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Amenities</h2>
                </div>

                <AmenitiesSelector
                  selectedAmenities={amenities}
                  onChange={(newAmenities) => setAmenities(newAmenities)}
                />
              </div>

              {/* 6. Contact Details */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/80">
                  <User className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-zinc-100">Contact Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Preview & Publish</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Preview Modal Screen */}
      {isPreviewOpen && previewListing && (
        <ListingPreviewModal
          listing={previewListing}
          onBackToEdit={() => setIsPreviewOpen(false)}
          onSaveDraft={handleSaveDraftFromPreview}
          onPublish={handlePublishFromPreview}
          saving={saving}
          publishedUrl={publishedUrl}
          onCloseSuccessModal={() => {
            setPublishedUrl(null);
            setIsPreviewOpen(false);
            navigate('/admin');
          }}
        />
      )}
    </div>
  );
};
