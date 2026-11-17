import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search, MapPin, Home, KeyRound, ArrowRight, ShieldCheck, X,
  LoaderCircle, Bed, Bath, PlusCircle, LogOut, User as UserIcon, Trash2,
  MessageSquare, Check, Ban, Clock, Send, ChevronLeft, ChevronRight,
  Sparkles, RefreshCw
} from 'lucide-react'
import './App.css'

// ISSUE 1: In production, relative URL allows Nginx to reverse-proxy requests
// to backend internal service, eliminating accidental calls to visitor's localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// ISSUE 2: Axios response interceptor cleans up invalid or expired tokens automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!(localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token'))
      if (hadToken) {
        localStorage.removeItem('propzy_token')
        localStorage.removeItem('rentflow_token')
        delete api.defaults.headers.common.Authorization
      }
    }
    return Promise.reject(error)
  }
)

export type Property = {
  id: number
  title: string
  description?: string
  rentAmount: number
  propertyType: string
  address: string
  city: string
  bedrooms: number
  bathrooms: number
  available: boolean
  ownerId: number
  ownerName: string
  createdAt?: string
  updatedAt?: string
}

export type CurrentUser = {
  userId: number
  fullName: string
  email: string
  role: 'TENANT' | 'OWNER' | 'ADMIN'
  emailVerified?: boolean
}

export type Inquiry = {
  id: number
  propertyId: number
  propertyTitle: string
  tenantId: number
  tenantName: string
  tenantEmail: string
  tenantPhone?: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

function App() {
  const [query, setQuery] = useState('')
  const [minRent, setMinRent] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [status, setStatus] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [myProperties, setMyProperties] = useState<Property[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')

  const [modal, setModal] = useState<
    'login' | 'register' | 'createProperty' | 'inquiry' | 'viewInquiries' | 'verifyEmail' | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  // Pagination state for public properties
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 12

  // Inquiry state
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [activePropertyForInquiry, setActivePropertyForInquiry] = useState<Property | null>(null)
  const [inquiryText, setInquiryText] = useState('')

  // Authentication & Verification Form state
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'TENANT' as 'TENANT' | 'OWNER',
  })

  const [verificationState, setVerificationState] = useState({
    email: '',
    code: '',
    demoCode: '',
    successMsg: '',
  })

  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    rentAmount: '',
    propertyType: 'Apartment',
    address: '',
    city: '',
    bedrooms: '1',
    bathrooms: '1',
  })

  async function fetchProperties(targetPage = 0, cityQuery?: string, min?: string, max?: string) {
    setLoading(true)
    setMessage('')
    try {
      const q = cityQuery !== undefined ? cityQuery : query
      const mn = min !== undefined ? min : minRent
      const mx = max !== undefined ? max : maxRent

      const params: Record<string, string> = {
        page: String(targetPage),
        size: String(pageSize),
        sortBy: 'createdAt',
        direction: 'desc',
      }

      if (q.trim()) params.city = q.trim()
      if (mn.trim()) params.minRent = mn.trim()
      if (mx.trim()) params.maxRent = mx.trim()

      const r = await api.get('/api/v1/properties', { params })
      const data = r.data
      const list: Property[] = Array.isArray(data) ? data : data.content || []
      setProperties(list)

      const total = Array.isArray(data)
        ? data.length
        : (data.page?.totalElements ?? data.totalElements ?? list.length)
      const pages = Array.isArray(data)
        ? 1
        : (data.page?.totalPages ?? data.totalPages ?? Math.max(1, Math.ceil(total / pageSize)))

      setTotalElements(total)
      setTotalPages(pages)
      setCurrentPage(targetPage)

      if (list.length === 0) {
        setStatus('No matching properties found.')
      } else {
        setStatus(`Showing ${list.length} of ${total} available properties (Page ${targetPage + 1} of ${pages})`)
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      if (err.response?.status === 401) {
        setStatus('Property search requires authentication under current rules.')
      } else {
        setStatus('Could not load properties. Ensure backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyProperties() {
    if (!currentUser || currentUser.role !== 'OWNER') return
    try {
      const r = await api.get('/api/v1/properties/mine', {
        params: { page: 0, size: 50 },
      })
      const list = Array.isArray(r.data) ? r.data : r.data.content || []
      setMyProperties(list)
    } catch {
      // ignore if unauthenticated
    }
  }

  // Restore session on component mount & fetch initial properties safely
  useEffect(() => {
    const token = localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token')
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      api.get('/api/v1/auth/me')
        .then(res => {
          setCurrentUser(res.data)
          if (res.data.role === 'OWNER') {
            api.get('/api/v1/properties/mine', { params: { page: 0, size: 50 } })
              .then(mineRes => {
                setMyProperties(Array.isArray(mineRes.data) ? mineRes.data : mineRes.data.content || [])
              })
              .catch(() => {})
          }
        })
        .catch(() => {
          localStorage.removeItem('propzy_token')
          localStorage.removeItem('rentflow_token')
          delete api.defaults.headers.common.Authorization
          setCurrentUser(null)
        })
    }
    fetchProperties(0, '', '', '')
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogout() {
    localStorage.removeItem('propzy_token')
    localStorage.removeItem('rentflow_token')
    delete api.defaults.headers.common.Authorization
    setCurrentUser(null)
    setMyProperties([])
    setActiveTab('all')
    setInquiries([])
    setMessage('Logged out successfully.')
  }

  function changeAuthForm(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value })
  }

  function changePropertyForm(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setPropertyForm({ ...propertyForm, [e.target.name]: e.target.value })
  }

  async function checkBackend() {
    setLoading(true)
    try {
      const r = await api.get('/actuator/health')
      setStatus(`Backend status: ${r.data.status}`)
    } catch {
      setStatus('Backend is unreachable. Start Spring Boot or Docker container.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (modal === 'register') {
      if (authForm.password !== authForm.confirmPassword) {
        setMessage('Passwords do not match. Please re-enter.')
        setLoading(false)
        return
      }
      if (authForm.password.length < 8) {
        setMessage('Password must be at least 8 characters long.')
        setLoading(false)
        return
      }
    }

    try {
      if (modal === 'register') {
        const payload = {
          fullName: authForm.fullName.trim(),
          email: authForm.email.trim().toLowerCase(),
          password: authForm.password,
          phone: authForm.phone ? authForm.phone.trim() : null,
          role: authForm.role,
        }

        const r = await api.post('/api/v1/auth/register', payload)
        const data = r.data

        // Transition to Email Verification Modal
        setVerificationState({
          email: authForm.email.trim().toLowerCase(),
          code: data.verificationCode || '',
          demoCode: data.verificationCode || '',
          successMsg: data.message || 'Verification code sent to your email!',
        })
        setModal('verifyEmail')
        setMessage('')
      } else {
        // Login
        const payload = {
          email: authForm.email.trim().toLowerCase(),
          password: authForm.password,
        }
        const r = await api.post('/api/v1/auth/login', payload)
        const data = r.data
        const token = data.token || data.accessToken || data.access_token

        if (token) {
          localStorage.setItem('propzy_token', token)
          api.defaults.headers.common.Authorization = `Bearer ${token}`
          const meRes = await api.get('/api/v1/auth/me')
          setCurrentUser(meRes.data)
          if (meRes.data.role === 'OWNER') {
            fetchMyProperties()
          }
        }

        setMessage('Login successful!')
        setModal(null)
        setStatus(`Welcome, ${data.fullName || 'back'}!`)
        fetchProperties(0)
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string; fieldErrors?: Record<string, string> } } }
      const errData = err.response?.data
      if (err.response?.status === 403 && errData?.message?.toLowerCase().includes('verify')) {
        // Account unverified - auto prompt verification modal
        setVerificationState({
          email: authForm.email.trim().toLowerCase(),
          code: '',
          demoCode: '',
          successMsg: 'Please verify your email to activate your account.',
        })
        setModal('verifyEmail')
        setMessage(errData.message)
      } else if (errData?.fieldErrors) {
        const firstErr = Object.values(errData.fieldErrors)[0]
        setMessage(firstErr || 'Validation failed')
      } else {
        setMessage(errData?.message || 'Request failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function submitVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const r = await api.post('/api/v1/auth/verify-email', {
        email: verificationState.email.trim().toLowerCase(),
        code: verificationState.code.trim(),
      })
      const data = r.data
      const token = data.token || data.accessToken

      if (token) {
        localStorage.setItem('propzy_token', token)
        api.defaults.headers.common.Authorization = `Bearer ${token}`
        const meRes = await api.get('/api/v1/auth/me')
        setCurrentUser(meRes.data)
        if (meRes.data.role === 'OWNER') {
          fetchMyProperties()
        }
      }

      setModal(null)
      setMessage('Email verified successfully! Welcome to Propzy.')
      setStatus(`Welcome, ${data.fullName || 'User'}! Account verified.`)
      fetchProperties(0)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  async function resendVerificationCode() {
    setLoading(true)
    setMessage('')
    try {
      const r = await api.post('/api/v1/auth/resend-verification', {
        email: verificationState.email.trim().toLowerCase(),
      })
      const code = r.data.verificationCode || ''
      setVerificationState(prev => ({
        ...prev,
        code: code || prev.code,
        demoCode: code || prev.demoCode,
      }))
      setMessage('A fresh verification code has been generated and sent.')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitProperty(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        title: propertyForm.title.trim(),
        description: propertyForm.description.trim() || undefined,
        rentAmount: parseFloat(propertyForm.rentAmount),
        propertyType: propertyForm.propertyType,
        address: propertyForm.address.trim(),
        city: propertyForm.city.trim(),
        bedrooms: parseInt(propertyForm.bedrooms, 10),
        bathrooms: parseInt(propertyForm.bathrooms, 10),
        available: true,
      }

      await api.post('/api/v1/properties', payload)
      setMessage('Property listed successfully!')
      setModal(null)
      setPropertyForm({
        title: '',
        description: '',
        rentAmount: '',
        propertyType: 'Apartment',
        address: '',
        city: '',
        bedrooms: '1',
        bathrooms: '1',
      })
      fetchProperties(0)
      fetchMyProperties()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; fieldErrors?: Record<string, string> } } }
      const errData = err.response?.data
      if (errData?.fieldErrors) {
        const firstErr = Object.values(errData.fieldErrors)[0]
        setMessage(firstErr || 'Validation failed.')
      } else {
        setMessage(errData?.message || 'Failed to list property.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability(id: number) {
    try {
      const r = await api.patch(`/api/v1/properties/${id}/toggle-availability`)
      const updated = r.data
      setProperties(prev => prev.map(p => p.id === id ? { ...p, available: updated.available } : p))
      setMyProperties(prev => prev.map(p => p.id === id ? { ...p, available: updated.available } : p))
      setMessage(`Listing marked as ${updated.available ? 'Available' : 'Rented'}.`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Failed to toggle availability.')
    }
  }

  async function deleteProperty(id: number) {
    if (!confirm('Are you sure you want to remove this property listing?')) return
    try {
      await api.delete(`/api/v1/properties/${id}`)
      setMessage('Property listing deleted.')
      fetchProperties(currentPage)
      fetchMyProperties()
    } catch {
      setMessage('Failed to delete property. You may only delete your own listings.')
    }
  }

  // --- Inquiry Handlers ---
  function openInquiryModal(prop: Property) {
    if (!currentUser) {
      setMessage('Please log in as a Tenant to contact property owners.')
      setModal('login')
      return
    }
    if (currentUser.role !== 'TENANT') {
      setMessage('Only Tenant accounts can submit inquiries.')
      return
    }
    setActivePropertyForInquiry(prop)
    setInquiryText(`Hello, I am interested in renting "${prop.title}". Is it currently available for viewing?`)
    setModal('inquiry')
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!activePropertyForInquiry) return
    setLoading(true)
    try {
      await api.post(`/api/v1/inquiries/property/${activePropertyForInquiry.id}`, {
        message: inquiryText.trim(),
      })
      setMessage('Your inquiry has been sent to the property owner!')
      setModal(null)
      setInquiryText('')
      setActivePropertyForInquiry(null)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Failed to send inquiry.')
    } finally {
      setLoading(false)
    }
  }

  async function openInquiriesModal() {
    if (!currentUser) return
    setLoading(true)
    setMessage('')
    try {
      const endpoint = currentUser.role === 'OWNER'
        ? '/api/v1/inquiries/received'
        : '/api/v1/inquiries/sent'
      const r = await api.get(endpoint)
      setInquiries(r.data || [])
      setModal('viewInquiries')
    } catch {
      setMessage('Failed to load inquiries.')
    } finally {
      setLoading(false)
    }
  }

  async function updateInquiryStatus(id: number, newStatus: 'ACCEPTED' | 'REJECTED') {
    try {
      const r = await api.patch(`/api/v1/inquiries/${id}/status`, { status: newStatus })
      setInquiries(prev => prev.map(inq => inq.id === id ? r.data : inq))
      setMessage(`Inquiry ${newStatus.toLowerCase()} successfully.`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setMessage(err.response?.data?.message || 'Failed to update inquiry status.')
    }
  }

  function handleFilterSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setActiveTab('all')
    fetchProperties(0)
  }

  const displayedProperties = activeTab === 'mine' ? myProperties : properties

  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#" aria-label="Propzy Home">
          <div className="brand-logo-container">
            <img src="/propzy-logo.jpg" alt="Propzy Logo" className="brand-logo-img" />
          </div>
        </a>
        <div className="nav-links">
          <a href="#explore">Explore stays</a>
          <a href="#how">How it works</a>
        </div>
        <div className="nav-actions">
          {currentUser ? (
            <div className="user-nav">
              <span className="user-badge">
                <UserIcon size={14}/> {currentUser.fullName} ({currentUser.role})
              </span>
              <button className="btn-outline btn-sm" onClick={openInquiriesModal}>
                <MessageSquare size={15}/> {currentUser.role === 'OWNER' ? 'Inquiries Received' : 'My Inquiries'}
              </button>
              {currentUser.role === 'OWNER' && (
                <button
                  className="btn-dark btn-sm"
                  onClick={() => { setMessage(''); setModal('createProperty') }}
                >
                  <PlusCircle size={16}/> List Property
                </button>
              )}
              <button className="btn-outline btn-sm" onClick={handleLogout}>
                <LogOut size={15}/> Logout
              </button>
            </div>
          ) : (
            <>
              <button className="btn-outline" onClick={() => { setMessage(''); setModal('login') }}>
                Log in
              </button>
              <button className="btn-dark" onClick={() => { setMessage(''); setModal('register') }}>
                Get started <ArrowRight size={16}/>
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot"/> RENTING, REIMAGINED</span>
          <h1>Find a place<br/>to <span>call home.</span></h1>
          <p>Discover spaces that fit your life. Verified listings, direct owner connections, transparent renting on Propzy.</p>
          <div className="search-card">
            <label>
              <MapPin size={19}/>
              <span>
                <small>LOCATION / CITY</small>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFilterSubmit(e)}
                  placeholder="Mumbai, Bengaluru, Delhi, Pune..."
                />
              </span>
            </label>
            <button onClick={() => handleFilterSubmit()} disabled={loading}>
              <Search size={18}/> Search homes
            </button>
          </div>
          <div className="trust"><ShieldCheck size={17}/> Simple search. Clear choices. Better renting with Propzy.</div>
        </div>
        <div className="hero-art">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
            alt="Warm, modern living room"
          />
          <div className="floating-card">
            <span className="float-icon"><KeyRound size={20}/></span>
            <span><b>Your next home awaits</b><small>Find a space that feels right.</small></span>
          </div>
          <div className="image-label">A LITTLE MORE ROOM TO LIVE.</div>
        </div>
      </section>

      <section className="features" id="how">
        <div><span>01</span><h3>Find your fit</h3><p>Explore homes and narrow down what matters to you.</p></div>
        <div><span>02</span><h3>Know the details</h3><p>Review property specs, rent amount, and owner contacts transparently.</p></div>
        <div><span>03</span><h3>Move forward</h3><p>Direct communication with property owners with zero hassle.</p></div>
      </section>

      <section className="explore" id="explore">
        <div className="explore-header">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER</span>
            <h2>Spaces worth coming home to.</h2>
            <p>{status || 'Search available properties by city.'}</p>
          </div>
          <div className="explore-filters">
            <input
              type="number"
              placeholder="Min Rent ($)"
              value={minRent}
              onChange={e => setMinRent(e.target.value)}
              className="filter-input"
            />
            <input
              type="number"
              placeholder="Max Rent ($)"
              value={maxRent}
              onChange={e => setMaxRent(e.target.value)}
              className="filter-input"
            />
            <button className="btn-outline btn-sm" onClick={() => handleFilterSubmit()} disabled={loading}>
              Filter
            </button>
            <button className="btn-dark btn-sm" onClick={checkBackend} disabled={loading}>
              {loading ? <LoaderCircle size={15}/> : null} Health Check
            </button>
          </div>
        </div>

        {/* Tab Navigation for Property Owners: All Properties vs My Listed Properties */}
        {currentUser && currentUser.role === 'OWNER' && (
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Home size={15}/> All Stays ({totalElements})
            </button>
            <button
              className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('mine')
                fetchMyProperties()
              }}
            >
              <Sparkles size={15}/> My Listed Properties ({myProperties.length})
            </button>
          </div>
        )}

        {displayedProperties.length > 0 ? (
          <>
            <div className="property-grid">
              {displayedProperties.map(p => {
                const isOwnListing = currentUser && currentUser.userId === p.ownerId
                return (
                  <article key={p.id} className="property-card">
                    <div className="property-card-top">
                      <span className="property-badge">{p.propertyType}</span>
                      {isOwnListing && (
                        <span className="own-listing-badge">⭐ Your Listing</span>
                      )}
                      {!p.available && (
                        <span className="status-rented-badge">RENTED</span>
                      )}
                    </div>
                    <h3>{p.title}</h3>
                    <p className="property-location"><MapPin size={14}/> {p.address}, {p.city}</p>
                    {p.description && <p className="property-desc">{p.description}</p>}
                    <div className="property-specs">
                      <span><Bed size={15}/> {p.bedrooms} Beds</span>
                      <span><Bath size={15}/> {p.bathrooms} Baths</span>
                    </div>
                    <div className="property-footer">
                      <b className="property-price">
                        ${Number(p.rentAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        <small> / month</small>
                      </b>
                      <div className="property-card-actions">
                        {isOwnListing ? (
                          <div className="owner-actions">
                            <button
                              className={`btn-toggle-avail ${p.available ? 'is-avail' : 'is-rented'}`}
                              onClick={() => toggleAvailability(p.id)}
                              title={p.available ? 'Click to mark as rented' : 'Click to mark as available'}
                            >
                              {p.available ? 'Available' : 'Marked Rented'}
                            </button>
                            <button
                              className="btn-danger-icon"
                              onClick={() => deleteProperty(p.id)}
                              title="Delete your property listing"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              className="btn-outline btn-xs"
                              onClick={() => openInquiryModal(p)}
                              title="Contact owner about this listing"
                            >
                              <MessageSquare size={13}/> Inquire
                            </button>
                            <span className="owner-tag">by {p.ownerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination Bar for All Stays */}
            {activeTab === 'all' && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing page <b>{currentPage + 1}</b> of <b>{Math.max(1, totalPages)}</b> ({totalElements} total properties)
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn-outline btn-sm"
                    disabled={currentPage === 0 || loading}
                    onClick={() => fetchProperties(currentPage - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16}/> Previous
                  </button>
                  <span className="pagination-page-badge">{currentPage + 1}</span>
                  <button
                    className="btn-outline btn-sm"
                    disabled={currentPage >= totalPages - 1 || loading}
                    onClick={() => fetchProperties(currentPage + 1)}
                    aria-label="Next page"
                  >
                    Next <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Home size={40}/>
            <h3>{activeTab === 'mine' ? 'No properties listed yet' : 'No properties found'}</h3>
            <p>
              {activeTab === 'mine'
                ? 'Click "List Property" above to create and manage your first rental listing.'
                : 'Try searching for a different city or clearing rent filters.'}
            </p>
          </div>
        )}
      </section>

      <section className="auth" id="auth">
        <div>
          <span className="eyebrow">LET'S GET YOU MOVING</span>
          <h2>Your next home is a few steps away.</h2>
          <p>Sign in or create an account to start browsing, inquiring, and listing properties on Propzy.</p>
        </div>
        <div className="nav-actions">
          {!currentUser ? (
            <>
              <button className="btn-outline" onClick={() => setModal('login')}>Log in</button>
              <button className="btn-dark" onClick={() => setModal('register')}>
                Get started <ArrowRight size={16}/>
              </button>
            </>
          ) : (
            <p className="welcome-text">Logged in as <b>{currentUser.email}</b></p>
          )}
        </div>
      </section>

      <footer>
        <a className="brand" href="#" aria-label="Propzy Home">
          <div className="brand-logo-container">
            <img src="/propzy-logo.jpg" alt="Propzy Logo" className="brand-logo-img-sm" />
          </div>
        </a>
        <span>Find your place. Start your next chapter.</span>
        <span>© 2026 Propzy — Production Platform</span>
      </footer>

      {/* Auth Modal (Login / Register) */}
      {modal && (modal === 'login' || modal === 'register') && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
            <span className="eyebrow">WELCOME TO PROPZY</span>
            <h2 id="auth-title">{modal === 'register' ? 'Create your account' : 'Welcome back'}</h2>
            <p>{modal === 'register' ? 'Join Propzy to start finding or listing homes.' : 'Log in to continue to Propzy.'}</p>
            <form onSubmit={submitAuth}>
              {modal === 'register' && (
                <>
                  <label>Full name
                    <input
                      name="fullName"
                      value={authForm.fullName}
                      onChange={changeAuthForm}
                      required
                      maxLength={100}
                      placeholder="e.g. Sourabh Sharma"
                    />
                  </label>
                  <label>I want to join as</label>
                  <div className="role-cards-container">
                    <button
                      type="button"
                      className={`role-card-btn ${authForm.role === 'TENANT' ? 'selected' : ''}`}
                      onClick={() => setAuthForm({ ...authForm, role: 'TENANT' })}
                    >
                      <b><Home size={16}/> Tenant</b>
                      <small>Browse stays and submit inquiries to owners</small>
                    </button>
                    <button
                      type="button"
                      className={`role-card-btn ${authForm.role === 'OWNER' ? 'selected' : ''}`}
                      onClick={() => setAuthForm({ ...authForm, role: 'OWNER' })}
                    >
                      <b><KeyRound size={16}/> Property Owner</b>
                      <small>List properties and manage tenant inquiries</small>
                    </button>
                  </div>
                  <label>Phone (optional)
                    <input
                      name="phone"
                      value={authForm.phone}
                      onChange={changeAuthForm}
                      maxLength={20}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </label>
                </>
              )}
              <label>Email address
                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={changeAuthForm}
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label>Password
                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={changeAuthForm}
                  required
                  minLength={modal === 'register' ? 8 : 1}
                  placeholder={modal === 'register' ? 'At least 8 characters' : 'Your password'}
                />
              </label>
              {modal === 'register' && (
                <label>Confirm Password
                  <input
                    name="confirmPassword"
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={changeAuthForm}
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                  />
                  {authForm.confirmPassword && (
                    <span className={`password-feedback ${authForm.password === authForm.confirmPassword ? 'match' : 'mismatch'}`}>
                      {authForm.password === authForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  )}
                </label>
              )}
              {message && <p className="form-message" role="alert">{message}</p>}
              <button className="btn-dark submit-btn" type="submit" disabled={loading}>
                {loading ? 'Please wait...' : modal === 'register' ? 'Continue to Verification' : 'Log in'} <ArrowRight size={17}/>
              </button>
            </form>
            <p className="modal-switch">
              {modal === 'register' ? 'Already have an account?' : 'New to Propzy?'}{' '}
              <button onClick={() => { setMessage(''); setModal(modal === 'register' ? 'login' : 'register') }}>
                {modal === 'register' ? 'Log in' : 'Create account'}
              </button>
            </p>
          </section>
        </div>
      )}

      {/* Email Verification Modal */}
      {modal === 'verifyEmail' && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
            <span className="eyebrow">SECURITY VERIFICATION</span>
            <h2 id="verify-title">Verify Your Email</h2>
            <p>We've sent a 6-digit confirmation code to <b>{verificationState.email}</b>.</p>

            {verificationState.demoCode && (
              <div className="verify-box">
                <p>Verification Code (Instant Demo Access):</p>
                <span
                  className="demo-code-pill"
                  onClick={() => setVerificationState(s => ({ ...s, code: s.demoCode }))}
                  title="Click to fill automatically"
                >
                  {verificationState.demoCode}
                </span>
                <p style={{ fontSize: '11px', color: '#687263', marginTop: '6px' }}>Click code above to autofill</p>
              </div>
            )}

            <form onSubmit={submitVerifyEmail}>
              <label>6-Digit Verification Code
                <input
                  name="verificationCode"
                  className="verify-code-input"
                  value={verificationState.code}
                  onChange={e => setVerificationState({ ...verificationState, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  required
                  maxLength={6}
                  placeholder="123456"
                  autoFocus
                />
              </label>
              {message && <p className="form-message" role="alert">{message}</p>}
              <button
                className="btn-dark submit-btn"
                type="submit"
                disabled={loading || verificationState.code.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Email & Sign In'} <ArrowRight size={17}/>
              </button>
            </form>

            <p className="modal-switch">
              Didn't receive code?{' '}
              <button type="button" onClick={resendVerificationCode} disabled={loading}>
                <RefreshCw size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }}/> Resend Code
              </button>
            </p>
          </section>
        </div>
      )}

      {/* Owner Create Property Modal */}
      {modal === 'createProperty' && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <section className="auth-modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="prop-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
            <span className="eyebrow">OWNER WORKFLOW</span>
            <h2 id="prop-title">List a New Property</h2>
            <p>Publish a listing for prospective tenants across the platform.</p>
            <form onSubmit={submitProperty}>
              <label>Title
                <input
                  name="title"
                  value={propertyForm.title}
                  onChange={changePropertyForm}
                  required
                  maxLength={150}
                  placeholder="e.g. Modern Sunset Apartment"
                />
              </label>
              <div className="form-row">
                <label>Property Type
                  <select name="propertyType" value={propertyForm.propertyType} onChange={changePropertyForm}>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Studio">Studio</option>
                    <option value="Villa">Villa</option>
                    <option value="Condo">Condo</option>
                  </select>
                </label>
                <label>Monthly Rent ($)
                  <input
                    name="rentAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={propertyForm.rentAmount}
                    onChange={changePropertyForm}
                    required
                    placeholder="1500.00"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>City
                  <input
                    name="city"
                    value={propertyForm.city}
                    onChange={changePropertyForm}
                    required
                    maxLength={100}
                    placeholder="e.g. Mumbai"
                  />
                </label>
                <label>Address
                  <input
                    name="address"
                    value={propertyForm.address}
                    onChange={changePropertyForm}
                    required
                    maxLength={255}
                    placeholder="e.g. 42 Marine Drive"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>Bedrooms
                  <input
                    name="bedrooms"
                    type="number"
                    min="0"
                    max="100"
                    value={propertyForm.bedrooms}
                    onChange={changePropertyForm}
                    required
                  />
                </label>
                <label>Bathrooms
                  <input
                    name="bathrooms"
                    type="number"
                    min="0"
                    max="100"
                    value={propertyForm.bathrooms}
                    onChange={changePropertyForm}
                    required
                  />
                </label>
              </div>
              <label>Description (optional)
                <textarea
                  name="description"
                  value={propertyForm.description}
                  onChange={changePropertyForm}
                  rows={3}
                  placeholder="Details about amenities, furnishing, sunlight, etc."
                />
              </label>
              {message && <p className="form-message" role="alert">{message}</p>}
              <button className="btn-dark submit-btn" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Publish Listing'} <ArrowRight size={17}/>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Tenant Send Inquiry Modal */}
      {modal === 'inquiry' && activePropertyForInquiry && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="inq-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
            <span className="eyebrow">CONTACT OWNER</span>
            <h2 id="inq-title">Send Property Inquiry</h2>
            <p>Inquire about <b>{activePropertyForInquiry.title}</b> in {activePropertyForInquiry.city}.</p>
            <form onSubmit={submitInquiry}>
              <label>Your Message
                <textarea
                  rows={4}
                  value={inquiryText}
                  onChange={e => setInquiryText(e.target.value)}
                  required
                  maxLength={1000}
                  placeholder="Write your questions or visit requests here..."
                />
              </label>
              {message && <p className="form-message" role="alert">{message}</p>}
              <button className="btn-dark submit-btn" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Inquiry'} <Send size={16}/>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Inquiries Management Modal (Sent or Received) */}
      {modal === 'viewInquiries' && currentUser && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <section className="auth-modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="inqs-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
            <span className="eyebrow">{currentUser.role === 'OWNER' ? 'OWNER DASHBOARD' : 'TENANT DASHBOARD'}</span>
            <h2 id="inqs-title">{currentUser.role === 'OWNER' ? 'Inquiries Received' : 'My Inquiries'}</h2>
            <p>Manage and track responses for property inquiries.</p>

            {inquiries.length > 0 ? (
              <div className="inquiries-list">
                {inquiries.map(inq => (
                  <div key={inq.id} className="inquiry-item">
                    <div className="inquiry-item-header">
                      <b>{inq.propertyTitle}</b>
                      <span className={`status-badge status-${inq.status.toLowerCase()}`}>
                        {inq.status === 'PENDING' && <Clock size={12}/>}
                        {inq.status === 'ACCEPTED' && <Check size={12}/>}
                        {inq.status === 'REJECTED' && <Ban size={12}/>}
                        {inq.status}
                      </span>
                    </div>
                    <p className="inquiry-msg">"{inq.message}"</p>
                    <div className="inquiry-meta">
                      <span>{currentUser.role === 'OWNER' ? `From: ${inq.tenantName} (${inq.tenantEmail})` : `Date: ${new Date(inq.createdAt).toLocaleDateString()}`}</span>
                      {currentUser.role === 'OWNER' && inq.status === 'PENDING' && (
                        <div className="inquiry-actions">
                          <button
                            className="btn-success-sm"
                            onClick={() => updateInquiryStatus(inq.id, 'ACCEPTED')}
                          >
                            <Check size={14}/> Accept
                          </button>
                          <button
                            className="btn-danger-sm"
                            onClick={() => updateInquiryStatus(inq.id, 'REJECTED')}
                          >
                            <Ban size={14}/> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <MessageSquare size={36}/>
                <p>No inquiries found yet.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Floating toast */}
      {message && !modal && (
        <div className="toast" role="status">
          {message}
          <button onClick={() => setMessage('')}><X size={16}/></button>
        </div>
      )}
    </main>
  )
}

export default App
