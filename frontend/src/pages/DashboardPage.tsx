import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Home,
  MessageSquare,
  Trash2,
  ExternalLink,
  LoaderCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Building2,
  Users,
  MapPin,
} from 'lucide-react'
import api from '../api'
import type { Property } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function DashboardPage() {
  const { currentUser, openAuthModal } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchMyListings = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await api.get('/api/v1/properties/mine', {
        params: { page: 0, size: 50 },
      })
      const list = Array.isArray(res.data) ? res.data : res.data.content || []
      setProperties(list)
    } catch {
      showToast('Could not fetch your properties.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchMyListings()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const handleToggle = async (propId: number) => {
    setTogglingId(propId)
    try {
      const res = await api.patch(`/api/v1/properties/${propId}/toggle-availability`)
      setProperties((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, available: res.data.available } : p))
      )
      showToast(
        `Listing marked as ${res.data.available ? 'Available' : 'Rented'}.`,
        'success'
      )
    } catch {
      showToast('Could not update availability status.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (propId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return
    setDeletingId(propId)
    try {
      await api.delete(`/api/v1/properties/${propId}`)
      setProperties((prev) => prev.filter((p) => p.id !== propId))
      showToast('Listing removed successfully.', 'info')
    } catch {
      showToast('Could not delete property.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!currentUser) {
    return (
      <div className="auth-gate-container animate-fade-in">
        <Building2 size={48} className="gold-icon" />
        <h2>Owner Dashboard</h2>
        <p>Please log in to manage your listed residences and inquiries.</p>
        <button className="btn-dark" onClick={() => openAuthModal('login')}>
          Log In
        </button>
      </div>
    )
  }

  if (currentUser.role !== 'OWNER') {
    return (
      <div className="auth-gate-container animate-fade-in">
        <Home size={48} className="gold-icon" />
        <h2>Tenant Portal</h2>
        <p>The owner dashboard is reserved for property owners. Manage your inquiries below.</p>
        <Link to="/inquiries" className="btn-dark">
          Go to My Inquiries
        </Link>
      </div>
    )
  }

  const activeCount = properties.filter((p) => p.available).length
  const rentedCount = properties.filter((p) => !p.available).length
  const totalRentPotential = properties.reduce(
    (acc, p) => acc + (p.available ? Number(p.rentAmount) : 0),
    0
  )

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <span className="eyebrow">PORTFOLIO OVERVIEW</span>
            <h1 className="dashboard-title">Owner Dashboard</h1>
            <p className="dashboard-sub">
              Manage your residential portfolio, toggle rental availability, and monitor performance.
            </p>
          </div>

          <div className="dashboard-actions">
            <Link to="/inquiries" className="btn-outline">
              <MessageSquare size={16} /> Received Inquiries
            </Link>
            <button
              className="btn-gold-glow"
              onClick={() => navigate('/create-listing')}
            >
              <PlusCircle size={16} /> Add Listing
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-cards-grid">
          <div className="stat-card animate-fade-in-up">
            <div className="stat-icon-wrapper">
              <Building2 size={22} className="gold-icon" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Properties</span>
              <span className="stat-number">{properties.length}</span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
            <div className="stat-icon-wrapper">
              <TrendingUp size={22} className="gold-icon" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active / Available</span>
              <span className="stat-number">{activeCount}</span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.16s' }}>
            <div className="stat-icon-wrapper">
              <Users size={22} className="gold-icon" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Currently Leased</span>
              <span className="stat-number">{rentedCount}</span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.24s' }}>
            <div className="stat-icon-wrapper">
              <Home size={22} className="gold-icon" />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active Rent Volume</span>
              <span className="stat-number">
                ₹{totalRentPotential.toLocaleString('en-IN')}
                <small>/mo</small>
              </span>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="dashboard-listings-section">
          <div className="dashboard-section-header">
            <h2>Your Listed Residences ({properties.length})</h2>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <LoaderCircle className="spinner gold-spinner" size={36} />
              <p>Loading your residential properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="dashboard-empty-state animate-fade-in">
              <Home size={40} className="gold-icon" />
              <h3>You have not listed any properties yet</h3>
              <p>List your first residence and start connecting with verified tenants directly.</p>
              <Link to="/create-listing" className="btn-gold-glow">
                <PlusCircle size={16} /> List Your First Property
              </Link>
            </div>
          ) : (
            <div className="dashboard-table-card">
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Type & Specs</th>
                      <th>Monthly Rent</th>
                      <th>Status</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop) => (
                      <tr key={prop.id} className="dashboard-row">
                        <td className="td-property">
                          <div className="table-prop-cell">
                            {prop.imageUrl ? (
                              <img
                                src={prop.imageUrl}
                                alt={prop.title}
                                className="table-prop-thumb"
                              />
                            ) : (
                              <div className="table-no-thumb">
                                <Home size={18} />
                              </div>
                            )}
                            <div className="table-prop-info">
                              <Link
                                to={`/property/${prop.id}`}
                                className="table-prop-title"
                              >
                                {prop.title}
                              </Link>
                              <span className="table-prop-id">ID: #{prop.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="td-location">
                          <div className="cell-flex">
                            <MapPin size={14} className="gold-icon" />
                            <span>
                              {prop.city}
                              <small className="sub-address">{prop.address}</small>
                            </span>
                          </div>
                        </td>

                        <td className="td-specs">
                          <span className="badge-spec-pill">{prop.propertyType}</span>
                          <span className="specs-small">
                            {prop.bedrooms} Bed • {prop.bathrooms} Bath
                          </span>
                        </td>

                        <td className="td-rent">
                          <strong>₹{Number(prop.rentAmount).toLocaleString('en-IN')}</strong>
                          <span className="period-small">/mo</span>
                        </td>

                        <td className="td-status">
                          <button
                            className={`status-toggle-pill ${
                              prop.available ? 'pill-available' : 'pill-rented'
                            }`}
                            onClick={() => handleToggle(prop.id)}
                            disabled={togglingId === prop.id}
                            title="Click to toggle availability status"
                          >
                            {togglingId === prop.id ? (
                              <LoaderCircle className="spinner" size={13} />
                            ) : prop.available ? (
                              <>
                                <ToggleRight size={15} /> Available
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={15} /> Rented
                              </>
                            )}
                          </button>
                        </td>

                        <td className="td-actions">
                          <div className="row-actions">
                            <Link
                              to={`/property/${prop.id}`}
                              className="btn-icon"
                              title="View Public Page"
                            >
                              <ExternalLink size={16} />
                            </Link>

                            <button
                              className="btn-icon-danger"
                              onClick={() => handleDelete(prop.id, prop.title)}
                              disabled={deletingId === prop.id}
                              title="Delete Listing"
                            >
                              {deletingId === prop.id ? (
                                <LoaderCircle className="spinner" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
