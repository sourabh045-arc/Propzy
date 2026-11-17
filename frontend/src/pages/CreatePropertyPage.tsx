import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  UploadCloud,
  ImageIcon,
  X,
  PlusCircle,
  LoaderCircle,
  Home,
  MapPin,
  IndianRupee,
  Bed,
  Bath,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Studio', 'Condo', 'Independent Floor']

export default function CreatePropertyPage() {
  const { currentUser, openAuthModal } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [propertyType, setPropertyType] = useState('Apartment')
  const [rentAmount, setRentAmount] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [bedrooms, setBedrooms] = useState('2')
  const [bathrooms, setBathrooms] = useState('2')
  const [imageUrl, setImageUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  // Client-side image upload handler with canvas compression
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setImageUrl(dataUrl)
          showToast('Photo attached and optimized successfully!', 'success')
        }
      }
      img.src = loadEvent.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      openAuthModal('login')
      return
    }

    if (!title.trim() || !rentAmount || !city.trim() || !address.trim()) {
      showToast('Please fill in all mandatory fields.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/v1/properties', {
        title: title.trim(),
        description: description.trim() || undefined,
        rentAmount: parseFloat(rentAmount),
        propertyType,
        address: address.trim(),
        city: city.trim(),
        bedrooms: parseInt(bedrooms, 10),
        bathrooms: parseInt(bathrooms, 10),
        available: true,
        imageUrl: imageUrl.trim() || undefined,
      })

      showToast('Residence listed successfully!', 'success')
      navigate(`/property/${res.data.id}`)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      showToast(errorObj.response?.data?.message || 'Failed to create property.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="auth-gate-container animate-fade-in">
        <Home size={48} className="gold-icon" />
        <h2>Sign In to List Residences</h2>
        <p>You need an active Property Owner account to publish properties on Propzy.</p>
        <div className="gate-actions">
          <button className="btn-dark" onClick={() => openAuthModal('login')}>
            Log In
          </button>
          <button className="btn-outline" onClick={() => openAuthModal('register')}>
            Create Owner Account
          </button>
        </div>
      </div>
    )
  }

  if (currentUser.role !== 'OWNER') {
    return (
      <div className="auth-gate-container animate-fade-in">
        <Home size={48} className="gold-icon" />
        <h2>Owner Account Required</h2>
        <p>
          You are currently signed in as a <strong>Tenant</strong>. To list properties, please sign
          in with a Property Owner account.
        </p>
        <Link to="/" className="btn-dark">
          Back to Explore
        </Link>
      </div>
    )
  }

  return (
    <div className="create-page animate-fade-in">
      <div className="create-wizard-container">
        {/* Progress Header */}
        <div className="wizard-header">
          <span className="eyebrow">PROPERTY ONBOARDING</span>
          <h1 className="wizard-title">List Your Residence</h1>
          <p className="wizard-subtitle">
            Connect directly with verified tenants. No broker cuts, no listing fees.
          </p>

          <div className="wizard-stepper">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-circle">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
              <span>Basics</span>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-circle">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
              <span>Pricing & Specs</span>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span>Media & Finish</span>
            </div>
          </div>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="wizard-form-card">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="wizard-step-content animate-fade-in">
              <h2 className="step-heading">Step 1: Essential Details</h2>

              <div className="input-group">
                <label htmlFor="prop-title">Listing Headline *</label>
                <input
                  id="prop-title"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Modern Sea-Facing Penthouse with Private Terrace"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Property Architecture / Type *</label>
                <div className="type-pills-selector">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`type-selector-pill ${propertyType === t ? 'selected' : ''}`}
                      onClick={() => setPropertyType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="prop-desc">Residence Description</label>
                <textarea
                  id="prop-desc"
                  rows={4}
                  placeholder="Highlight key features, natural light, recent renovations, neighborhood vibe, and lease terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="wizard-actions">
                <div />
                <button
                  type="button"
                  className="btn-dark"
                  disabled={!title.trim()}
                  onClick={() => setStep(2)}
                >
                  Continue to Pricing <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing, Location & Specs */}
          {step === 2 && (
            <div className="wizard-step-content animate-fade-in">
              <h2 className="step-heading">Step 2: Pricing & Location</h2>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="prop-rent">Monthly Rent (₹) *</label>
                  <div className="input-with-icon">
                    <IndianRupee size={16} className="input-icon" />
                    <input
                      id="prop-rent"
                      type="number"
                      required
                      min={100}
                      step={100}
                      placeholder="e.g. 45000"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="prop-city">City *</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      id="prop-city"
                      type="text"
                      required
                      placeholder="e.g. Mumbai, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="prop-address">Complete Address / Locality *</label>
                <input
                  id="prop-address"
                  type="text"
                  required
                  placeholder="e.g. Flat 1402, Signature Heights, Bandra West"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="prop-beds">Bedrooms</label>
                  <div className="input-with-icon">
                    <Bed size={16} className="input-icon" />
                    <select
                      id="prop-beds"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Bedroom' : 'Bedrooms'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="prop-baths">Bathrooms</label>
                  <div className="input-with-icon">
                    <Bath size={16} className="input-icon" />
                    <select
                      id="prop-baths"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Bathroom' : 'Bathrooms'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="btn-dark"
                  disabled={!rentAmount || !city.trim() || !address.trim()}
                  onClick={() => setStep(3)}
                >
                  Continue to Media <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Media & Publishing */}
          {step === 3 && (
            <div className="wizard-step-content animate-fade-in">
              <h2 className="step-heading">Step 3: Property Photograph</h2>
              <p className="step-subheading">
                Upload a genuine photo of your residence to attract serious inquiries.
              </p>

              {/* Photo Upload Dropzone */}
              <div className="image-upload-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageFileUpload}
                />

                <div
                  className={`image-upload-dropzone ${imageUrl ? 'has-preview' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload property photograph from your computer"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  {imageUrl ? (
                    <div className="image-preview-box">
                      <img src={imageUrl} alt="Property Preview" className="uploaded-image-preview" />
                      <div className="image-preview-overlay">
                        <span className="badge-attached">Photo Attached</span>
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={(e) => {
                            e.stopPropagation()
                            setImageUrl('')
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          <X size={14} /> Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="dropzone-prompt">
                      <div className="dropzone-icon-circle">
                        <UploadCloud size={32} />
                      </div>
                      <span className="dropzone-title">Click to choose picture from your device</span>
                      <span className="dropzone-hint">
                        Upload PNG, JPG, or WEBP photo directly from your computer or phone.
                        Images are automatically compressed.
                      </span>
                    </div>
                  )}
                </div>

                <div className="image-url-toggle">
                  <button
                    type="button"
                    className="link-btn-sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    <ImageIcon size={14} /> {showUrlInput ? 'Hide direct URL input' : 'Or enter direct image URL (optional)'}
                  </button>
                  {showUrlInput && (
                    <input
                      type="url"
                      placeholder="https://example.com/property-photo.jpg"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="url-text-input animate-fade-in"
                    />
                  )}
                </div>
              </div>

              {/* Review summary */}
              <div className="listing-summary-box">
                <h4>Listing Overview</h4>
                <div className="summary-grid">
                  <div>
                    <span className="sum-lbl">Title:</span> {title}
                  </div>
                  <div>
                    <span className="sum-lbl">Rent:</span> ₹{Number(rentAmount || 0).toLocaleString('en-IN')}/mo
                  </div>
                  <div>
                    <span className="sum-lbl">Location:</span> {address}, {city}
                  </div>
                  <div>
                    <span className="sum-lbl">Specs:</span> {bedrooms} BHK, {bathrooms} Bath • {propertyType}
                  </div>
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="btn-gold-glow btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="spinner" size={18} />
                  ) : (
                    <>
                      <PlusCircle size={18} /> Publish Residence
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
