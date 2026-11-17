import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="not-found-page animate-fade-in">
      <div className="not-found-card">
        <span className="not-found-404">404</span>
        <h2>Residence Not Found</h2>
        <p>The page or listing you are looking for does not exist or may have been relocated.</p>
        <Link to="/" className="btn-gold-glow">
          <ArrowLeft size={16} /> Return to Explore
        </Link>
      </div>
    </div>
  )
}
