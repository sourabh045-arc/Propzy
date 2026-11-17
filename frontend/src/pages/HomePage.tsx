import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  PlusCircle,
  SlidersHorizontal,
  RotateCcw,
  MessageSquare,
  X,
  Send,
  LoaderCircle,
} from 'lucide-react'
import api from '../api'
import type { Property } from '../types'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const PROPERTY_TYPES = ['All', 'Apartment', 'Villa', 'Penthouse', 'Studio', 'Condo']

export default function HomePage() {
  const { currentUser, openAuthModal } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [cityQuery, setCityQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [minRent, setMinRent] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 12

  // Quick inquiry modal state
  const [inquiryProperty, setInquiryProperty] = useState<Property | null>(null)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquiryPhone, setInquiryPhone] = useState('')
  const [sendingInquiry, setSendingInquiry] = useState(false)

  const fetchListings = async (targetPage = 0) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(targetPage),
        size: String(pageSize),
        sortBy: 'createdAt',
        direction: 'desc',
      }

      if (cityQuery.trim()) params.city = cityQuery.trim()
      if (minRent.trim()) params.minRent = minRent.trim()
      if (maxRent.trim()) params.maxRent = maxRent.trim()

      const res = await api.get('/api/v1/properties', { params })
      const data = res.data
      const list: Property[] = Array.isArray(data) ? data : data.content || []

      // Filter by propertyType client-side if specific type selected
      const filtered =
        selectedType === 'All'
          ? list
          : list.filter((p) => p.propertyType?.toLowerCase() === selectedType.toLowerCase())

      setProperties(filtered)

      const total = Array.isArray(data)
        ? filtered.length
        : (data.page?.totalElements ?? data.totalElements ?? filtered.length)
      const pages = Array.isArray(data)
        ? 1
        : (data.page?.totalPages ?? data.totalPages ?? Math.max(1, Math.ceil(total / pageSize)))

      setTotalElements(total)
      setTotalPages(pages)
      setPage(targetPage)
    } catch {
      showToast('Could not load properties. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings(0)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings(0)
  }

  const handleResetFilters = () => {
    setCityQuery('')
    setSelectedType('All')
    setMinRent('')
    setMaxRent('')
    fetchListings(0)
  }

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      openAuthModal('login')
      return
    }

    if (!inquiryProperty) return
    setSendingInquiry(true)
    try {
      await api.post('/api/v1/inquiries', {
        propertyId: inquiryProperty.id,
        message: inquiryMessage.trim(),
        phone: inquiryPhone.trim() || undefined,
      })
      showToast('Inquiry sent successfully to the owner!', 'success')
      setInquiryProperty(null)
      setInquiryMessage('')
      setInquiryPhone('')
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      showToast(errorObj.response?.data?.message || 'Failed to send inquiry.', 'error')
    } finally {
      setSendingInquiry(false)
    }
  }

  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-orb hero-orb-left" />
        <div className="hero-glow-orb hero-orb-right" />

        <div className="hero-container">
          <div className="hero-badge animate-float">
            <Sparkles size={14} className="gold-icon" />
            <span>RENTING, REIMAGINED</span>
          </div>

          <h1 className="hero-title">
            Find a place <br />
            <span className="hero-title-accent">that feels like yours.</span>
          </h1>

          <p className="hero-subtitle">
            Direct connections between verified owners and discerning tenants.
            <br className="desktop-break" /> Zero brokerage, total transparency, modern living.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hero-search-bar animate-fade-in-up">
            <div className="search-input-field">
              <Search size={20} className="search-field-icon" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Search by city (e.g. Mumbai, Bengaluru, Delhi) or location..."
                aria-label="Search properties by city"
              />
            </div>

            <button
              type="button"
              className={`btn-filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Filter price & criteria"
            >
              <SlidersHorizontal size={18} />
              <span className="desktop-text">Filters</span>
            </button>

            <button type="submit" className="btn-search-hero">
              Find Stays <ArrowRight size={16} />
            </button>
          </form>

          {/* Expandable Price & Criteria Filter Drawer */}
          {showFilters && (
            <div className="filters-drawer animate-scale-up">
              <div className="filter-group">
                <label>Min Rent (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Max Rent (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 80000"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                />
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  type="button"
                  className="btn-dark btn-sm"
                  onClick={() => fetchListings(0)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="category-pills-row">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                className={`category-pill ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Listings Section */}
      <section className="listings-section" id="explore">
        <div className="section-header">
          <div>
            <h2 className="section-title">Spaces worth coming home to.</h2>
            <p className="section-subtitle">
              {totalElements > 0
                ? `Showing ${properties.length} of ${totalElements} available residences`
                : 'Browse our curated collection of residences'}
            </p>
          </div>

          {currentUser?.role === 'OWNER' && (
            <button
              className="btn-gold-glow btn-sm"
              onClick={() => navigate('/create-listing')}
            >
              <PlusCircle size={15} /> List Property
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="property-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="property-card-skeleton animate-shimmer">
                <div className="skeleton-media" />
                <div className="skeleton-body">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-sub" />
                  <div className="skeleton-line skeleton-specs" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="property-grid">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onQuickInquiry={(prop) => {
                    if (!currentUser) {
                      openAuthModal('login')
                    } else {
                      setInquiryProperty(prop)
                    }
                  }}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn-outline btn-sm"
                  disabled={page <= 0}
                  onClick={() => fetchListings(page - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                  className="btn-outline btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchListings(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="empty-state-card animate-fade-in">
            <div className="empty-icon-circle">
              <Sparkles size={36} className="gold-icon" />
            </div>
            <h3 className="empty-title">No properties listed yet</h3>
            <p className="empty-description">
              Be the first to introduce a residence to discerning tenants on Propzy.
            </p>
            <div className="empty-actions">
              {currentUser?.role === 'OWNER' ? (
                <Link to="/create-listing" className="btn-dark">
                  <PlusCircle size={16} /> List Your Property
                </Link>
              ) : (
                <button
                  className="btn-dark"
                  onClick={() => openAuthModal('register')}
                >
                  Join as Property Owner
                </button>
              )}
              {(cityQuery || minRent || maxRent || selectedType !== 'All') && (
                <button className="btn-outline" onClick={handleResetFilters}>
                  Clear Search Filters
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Why Propzy Section */}
      <section className="features-section" id="how">
        <div className="features-container">
          <div className="features-header">
            <span className="eyebrow">THE PROPZY DIFFERENCE</span>
            <h2>Renting made modern, transparent, and direct.</h2>
            <p>We tore down the antiquated broker commission model and built an experience fit for 2026.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card animate-fade-in-up">
              <div className="feature-icon-box">
                <Zap size={24} />
              </div>
              <h3>0% Brokerage Guarantee</h3>
              <p>Keep your hard-earned money. Connect directly with owners without paying exorbitant brokerage fees.</p>
            </div>

            <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h3>Verified Owner Network</h3>
              <p>Every owner undergoes email identity verification so you never have to deal with fake listings or scams.</p>
            </div>

            <div className="feature-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon-box">
                <MessageSquare size={24} />
              </div>
              <h3>Instant Inquiries</h3>
              <p>Send direct inquiry messages, schedule walkthroughs, and receive status updates straight to your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Inquiry Modal */}
      {inquiryProperty && (
        <div
          className="modal-backdrop animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setInquiryProperty(null)
          }}
        >
          <div className="inquiry-modal animate-scale-up" role="dialog">
            <button
              className="modal-close"
              onClick={() => setInquiryProperty(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <span className="eyebrow">DIRECT INQUIRY</span>
            <h2>Connect with Owner</h2>
            <p className="inquiry-property-name">
              Inquiring about <strong>{inquiryProperty.title}</strong> (₹{Number(inquiryProperty.rentAmount).toLocaleString('en-IN')}/mo)
            </p>

            <form onSubmit={handleSendInquiry} className="inquiry-form">
              <div className="input-group">
                <label htmlFor="inquiry-phone">Your Phone (Optional)</label>
                <input
                  id="inquiry-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="inquiry-msg">Message to Owner</label>
                <textarea
                  id="inquiry-msg"
                  rows={4}
                  required
                  placeholder="Hi, I am interested in renting this property. When is it available for an in-person or virtual walkthrough?"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-dark btn-full btn-lg"
                disabled={sendingInquiry}
              >
                {sendingInquiry ? (
                  <LoaderCircle className="spinner" size={18} />
                ) : (
                  <>
                    <Send size={16} /> Send Inquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
