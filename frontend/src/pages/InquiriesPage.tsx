import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Home,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react'
import api from '../api'
import type { Inquiry } from '../types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function InquiriesPage() {
  const { currentUser, openAuthModal } = useAuth()
  const { showToast } = useToast()

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const isOwner = currentUser?.role === 'OWNER'

  const fetchInquiries = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const endpoint = isOwner ? '/api/v1/inquiries/received' : '/api/v1/inquiries/sent'
      const res = await api.get(endpoint)
      const list = Array.isArray(res.data) ? res.data : res.data.content || []
      setInquiries(list)
    } catch {
      showToast('Could not load inquiries.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchInquiries()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const handleUpdateStatus = async (inquiryId: number, newStatus: 'ACCEPTED' | 'REJECTED') => {
    setUpdatingId(inquiryId)
    try {
      const res = await api.patch(`/api/v1/inquiries/${inquiryId}/status`, {
        status: newStatus,
      })
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: res.data.status } : inq))
      )
      showToast(`Inquiry marked as ${newStatus.toLowerCase()}!`, 'success')
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      showToast(errorObj.response?.data?.message || 'Failed to update inquiry status.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!currentUser) {
    return (
      <div className="auth-gate-container animate-fade-in">
        <MessageSquare size={48} className="gold-icon" />
        <h2>Inquiry Hub</h2>
        <p>Log in to view and respond to messages and property inquiries.</p>
        <button className="btn-dark" onClick={() => openAuthModal('login')}>
          Log In
        </button>
      </div>
    )
  }

  const filteredInquiries =
    filterStatus === 'ALL'
      ? inquiries
      : inquiries.filter((inq) => inq.status === filterStatus)

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length
  const acceptedCount = inquiries.filter((i) => i.status === 'ACCEPTED').length

  return (
    <div className="inquiries-page animate-fade-in">
      <div className="inquiries-container">
        {/* Header */}
        <div className="inquiries-header">
          <div>
            <span className="eyebrow">COMMUNICATION CENTER</span>
            <h1 className="inquiries-title">
              {isOwner ? 'Received Inquiries' : 'My Sent Inquiries'}
            </h1>
            <p className="inquiries-subtitle">
              {isOwner
                ? 'Review tenant requests, approve walkthroughs, and connect directly.'
                : 'Track the status of your rental inquiries and get in touch with owners.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="inquiries-quick-metrics">
            <div className="metric-pill">
              <Clock size={15} className="gold-icon" />
              <span>Pending: {pendingCount}</span>
            </div>
            <div className="metric-pill">
              <CheckCircle2 size={15} className="status-success" />
              <span>Accepted: {acceptedCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="inquiry-filters-bar">
          <div className="status-tabs-row">
            {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                className={`status-tab ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'ALL' ? 'All Inquiries' : st}
              </button>
            ))}
          </div>
          <span className="count-label">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </span>
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="inquiries-loading">
            <LoaderCircle className="spinner gold-spinner" size={36} />
            <p>Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="inquiries-empty-state animate-fade-in">
            <MessageSquare size={44} className="gold-icon" />
            <h3>No inquiries found</h3>
            <p>
              {isOwner
                ? 'When prospective tenants inquire about your listings, they will appear here.'
                : 'You have not submitted inquiries yet. Explore residences to connect with owners.'}
            </p>
            {!isOwner && (
              <Link to="/" className="btn-dark">
                Explore Stays <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div className="inquiries-grid">
            {filteredInquiries.map((inq) => (
              <article key={inq.id} className="inquiry-card animate-fade-in-up">
                <div className="inquiry-card-header">
                  <div className="inquiry-property-meta">
                    <Link
                      to={`/property/${inq.propertyId}`}
                      className="inquiry-property-title"
                    >
                      <Home size={16} className="gold-icon" />
                      <span>{inq.propertyTitle}</span>
                    </Link>
                    <span className="inquiry-date">
                      {new Date(inq.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <span className={`status-badge-lg badge-${inq.status.toLowerCase()}`}>
                    {inq.status === 'PENDING' && <Clock size={14} />}
                    {inq.status === 'ACCEPTED' && <CheckCircle2 size={14} />}
                    {inq.status === 'REJECTED' && <XCircle size={14} />}
                    {inq.status}
                  </span>
                </div>

                <div className="inquiry-sender-row">
                  <span className="sender-lbl">{isOwner ? 'From:' : 'Your Inquiry:'}</span>
                  <span className="sender-name">{inq.tenantName || 'Prospective Tenant'}</span>
                </div>

                <div className="inquiry-message-bubble">
                  <p>"{inq.message}"</p>
                </div>

                {/* Contact information when accepted */}
                {inq.status === 'ACCEPTED' && (
                  <div className="inquiry-contact-details animate-fade-in">
                    <span className="contact-heading">Contact Details:</span>
                    <div className="contact-items">
                      <a href={`mailto:${inq.tenantEmail}`} className="contact-item">
                        <Mail size={14} /> {inq.tenantEmail}
                      </a>
                      {inq.tenantPhone && (
                        <a href={`tel:${inq.tenantPhone}`} className="contact-item">
                          <Phone size={14} /> {inq.tenantPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Owner Actions (Accept / Reject) */}
                {isOwner && inq.status === 'PENDING' && (
                  <div className="inquiry-action-buttons">
                    <button
                      className="btn-action-reject"
                      onClick={() => handleUpdateStatus(inq.id, 'REJECTED')}
                      disabled={updatingId === inq.id}
                    >
                      {updatingId === inq.id ? (
                        <LoaderCircle className="spinner" size={14} />
                      ) : (
                        <>
                          <XCircle size={15} /> Reject
                        </>
                      )}
                    </button>
                    <button
                      className="btn-action-accept"
                      onClick={() => handleUpdateStatus(inq.id, 'ACCEPTED')}
                      disabled={updatingId === inq.id}
                    >
                      {updatingId === inq.id ? (
                        <LoaderCircle className="spinner" size={14} />
                      ) : (
                        <>
                          <CheckCircle2 size={15} /> Accept Inquiry
                        </>
                      )}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
