import { Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Home, ArrowUpRight } from 'lucide-react'
import type { Property } from '../types'

interface PropertyCardProps {
  property: Property
  onQuickInquiry?: (property: Property) => void
}

export default function PropertyCard({ property, onQuickInquiry }: PropertyCardProps) {
  const formattedPrice = Number(property.rentAmount || 0).toLocaleString('en-IN')

  return (
    <article className="property-card-v2 animate-fade-in-up">
      <Link to={`/property/${property.id}`} className="card-media-wrapper" aria-label={`View ${property.title}`}>
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            className="property-img-cover"
            loading="lazy"
          />
        ) : (
          <div className="property-card-no-media">
            <Home size={32} className="no-media-icon" />
            <span className="no-media-text">No photo uploaded</span>
          </div>
        )}
        <div className="card-media-overlay">
          <span className="view-pill">
            View Details <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="card-badges">
          <span className="badge-type">{property.propertyType}</span>
          <span className={`badge-status ${property.available ? 'status-available' : 'status-rented'}`}>
            {property.available ? 'Available' : 'Rented'}
          </span>
        </div>
      </Link>

      <div className="card-content-v2">
        <div className="card-price-row">
          <div className="price-tag">
            <span className="currency">₹</span>
            <span className="amount">{formattedPrice}</span>
            <span className="period">/month</span>
          </div>
        </div>

        <h3 className="card-title">
          <Link to={`/property/${property.id}`} title={property.title}>
            {property.title}
          </Link>
        </h3>

        <div className="card-location">
          <MapPin size={14} className="location-pin" />
          <span>{property.address ? `${property.address}, ` : ''}{property.city}</span>
        </div>

        <div className="card-specs-row">
          <div className="spec-item">
            <Bed size={15} />
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="spec-divider" />
          <div className="spec-item">
            <Bath size={15} />
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
        </div>

        <div className="card-footer-v2">
          <span className="owner-attribution">By {property.ownerName || 'Verified Owner'}</span>
          {onQuickInquiry ? (
            <button
              className="btn-inquire-sm"
              onClick={(e) => {
                e.preventDefault()
                onQuickInquiry(property)
              }}
            >
              Inquire
            </button>
          ) : (
            <Link to={`/property/${property.id}`} className="btn-inquire-sm">
              Explore
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
