import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Home,
  CheckCircle,
  Wifi,
  Wind,
  Car,
  Shield,
  Coffee,
  Sparkles,
  Send,
  LoaderCircle,
  Clock,
  User as UserIcon,
  Trash2,
  Share2,
} from 'lucide-react'
import api from '../api'
import type { Property } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser, openAuthModal } = useAuth()
  const { showToast } = useToast()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Inquiry form
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [sendingInquiry, setSendingInquiry] = useState(false)
  const [inquirySent, setInquirySent] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/v1/properties/${id}`)
        setProperty(res.data)
      } catch (err: unknown) {
        const errorObj = err as { response?: { status?: number } }
        if (errorObj.response?.status === 404) {
          setError('Property not found or may have been removed.')
        } else {
          setError('Could not load property details. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      openAuthModal('login')
      return
    }

    if (!property) return
    setSendingInquiry(true)
    try {
      await api.post('/api/v1/inquiries', {
        propertyId: property.id,
        message: message.trim(),
        phone: phone.trim() || undefined,
      })
      setInquirySent(true)
      showToast('Inquiry sent successfully to the owner!', 'success')
      setMessage('')
      setPhone('')
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      showToast(errorObj.response?.data?.message || 'Failed to send inquiry.', 'error')
    } finally {
      setSendingInquiry(false)
    }
  }

  const handleDelete = async () => {
    if (!property || !window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await api.delete(`/api/v1/properties/${property.id}`)
      showToast('Property deleted successfully.', 'info')
      navigate('/')
    } catch {
      showToast('Could not delete property.', 'error')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('Listing URL copied to clipboard!', 'success')
  }

  if (loading) {
    return (
      <div className="detail-loading-state">
        <LoaderCircle className="spinner gold-spinner" size={40} />
        <p>Loading residence details...</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="detail-error-state">
        <h2>Residence Unavailable</h2>
        <p>{error || 'Could not locate this property.'}</p>
        <Link to="/" className="btn-dark">
          <ArrowLeft size={16} /> Back to Explore
        </Link>
      </div>
    )
  }

  const formattedPrice = Number(property.rentAmount).toLocaleString('en-IN')
  const deposit = Number(property.rentAmount * 2).toLocaleString('en-IN')
  const isOwner = currentUser?.userId === property.ownerId

  return (
    <div className="property-detail-page animate-fade-in">
      <div className="detail-container">
        {/* Breadcrumb & Actions */}
        <div className="detail-top-nav">
          <Link to="/" className="btn-back">
            <ArrowLeft size={16} /> Back to Explore
          </Link>

          <div className="top-nav-actions">
            <button className="btn-icon" onClick={handleShare} title="Share listing">
              <Share2 size={16} /> Share
            </button>
            {isOwner && (
              <button className="btn-outline-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={15} /> Delete Listing
              </button>
            )}
          </div>
        </div>

        {/* Hero Media Showcase */}
        <div className="detail-hero-media">
          {property.imageUrl ? (
            <div className="hero-image-wrapper">
              <img
                src={property.imageUrl}
                alt={property.title}
                className="hero-detail-image"
              />
              <span className="photo-badge">
                <Sparkles size={14} /> Verified Photo
              </span>
            </div>
          ) : (
            <div className="hero-no-image">
              <Home size={54} className="no-media-icon" />
              <span>No photograph uploaded by owner</span>
            </div>
          )}
        </div>

        {/* Detail Content Grid */}
        <div className="detail-layout">
          {/* Main Info Column */}
          <div className="detail-main-info">
            <div className="detail-header-tags">
              <span className="badge-type-lg">{property.propertyType}</span>
              <span
                className={`badge-status-lg ${
                  property.available ? 'status-available' : 'status-rented'
                }`}
              >
                {property.available ? 'Available Now' : 'Currently Rented'}
              </span>
            </div>

            <h1 className="detail-title">{property.title}</h1>

            <div className="detail-location-bar">
              <MapPin size={18} className="gold-icon" />
              <span>
                {property.address ? `${property.address}, ` : ''}
                {property.city}
              </span>
            </div>

            {/* Quick Specs */}
            <div className="specs-card-row">
              <div className="spec-card">
                <Bed size={22} className="gold-icon" />
                <span className="spec-val">{property.bedrooms}</span>
                <span className="spec-lbl">{property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
              </div>
              <div className="spec-card">
                <Bath size={22} className="gold-icon" />
                <span className="spec-val">{property.bathrooms}</span>
                <span className="spec-lbl">{property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
              </div>
              <div className="spec-card">
                <Home size={22} className="gold-icon" />
                <span className="spec-val">{property.propertyType}</span>
                <span className="spec-lbl">Property Type</span>
              </div>
              <div className="spec-card">
                <Clock size={22} className="gold-icon" />
                <span className="spec-val">Immediate</span>
                <span className="spec-lbl">Move-in Ready</span>
              </div>
            </div>

            {/* Description */}
            <section className="detail-section">
              <h2>About this Residence</h2>
              <p className="detail-description">
                {property.description ||
                  'No detailed description provided. Contact the owner below for complete residence specifications, lease duration options, and move-in dates.'}
              </p>
            </section>

            {/* Amenities Grid */}
            <section className="detail-section">
              <h2>Residence Amenities</h2>
              <div className="amenities-grid">
                <div className="amenity-item">
                  <Wifi size={18} className="gold-icon" />
                  <span>High-Speed Fiber Ready</span>
                </div>
                <div className="amenity-item">
                  <Wind size={18} className="gold-icon" />
                  <span>Air Conditioning</span>
                </div>
                <div className="amenity-item">
                  <Car size={18} className="gold-icon" />
                  <span>Dedicated Parking</span>
                </div>
                <div className="amenity-item">
                  <Shield size={18} className="gold-icon" />
                  <span>24/7 Gated Security</span>
                </div>
                <div className="amenity-item">
                  <Coffee size={18} className="gold-icon" />
                  <span>Modern Kitchen</span>
                </div>
                <div className="amenity-item">
                  <CheckCircle size={18} className="gold-icon" />
                  <span>Power Backup</span>
                </div>
              </div>
            </section>

            {/* Owner Profile Card */}
            <section className="owner-card">
              <div className="owner-avatar">
                <UserIcon size={24} />
              </div>
              <div className="owner-info">
                <span className="owner-eyebrow">LISTED BY VERIFIED OWNER</span>
                <h3 className="owner-name">{property.ownerName || 'Verified Host'}</h3>
                <p className="owner-sub">Zero brokerage • Direct communication</p>
              </div>
            </section>
          </div>

          {/* Sticky Inquiry / Rent Breakdown Sidebar */}
          <aside className="detail-sidebar">
            <div className="sidebar-sticky-card">
              <div className="sidebar-price-header">
                <div className="price-tag-lg">
                  <span className="currency">₹</span>
                  <span className="amount">{formattedPrice}</span>
                  <span className="period">/ month</span>
                </div>
                <span className="brokerage-badge">0% Commission</span>
              </div>

              {/* Financial Breakdown */}
              <div className="financial-breakdown">
                <div className="calc-row">
                  <span>Monthly Rent</span>
                  <span>₹{formattedPrice}</span>
                </div>
                <div className="calc-row">
                  <span>Security Deposit (Refundable)</span>
                  <span>₹{deposit}</span>
                </div>
                <div className="calc-row">
                  <span>Brokerage / Agent Fee</span>
                  <span className="free-tag">₹0 (Free)</span>
                </div>
                <div className="calc-divider" />
                <div className="calc-row total-row">
                  <span>Due at Move-In</span>
                  <span>
                    ₹{(Number(property.rentAmount) * 3).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Direct Inquiry Form */}
              <div className="inquiry-box">
                <h4>Send Direct Inquiry</h4>
                {inquirySent ? (
                  <div className="inquiry-success-message animate-fade-in">
                    <CheckCircle size={28} className="gold-icon" />
                    <h5>Inquiry Dispatched!</h5>
                    <p>The owner has received your request and will review your contact details.</p>
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => setInquirySent(false)}
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendInquiry}>
                    <div className="input-group">
                      <label htmlFor="inq-phone">Contact Phone (Optional)</label>
                      <input
                        id="inq-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="inq-msg">Message</label>
                      <textarea
                        id="inq-msg"
                        rows={4}
                        required
                        placeholder="Hello, I'm interested in renting this residence. Could we arrange a walkthrough?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-gold-glow btn-full"
                      disabled={sendingInquiry}
                    >
                      {sendingInquiry ? (
                        <LoaderCircle className="spinner" size={18} />
                      ) : (
                        <>
                          <Send size={16} /> Contact Owner
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
