import { Link } from 'react-router-dom'
import { Sparkles, Shield, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <Link to="/" className="brand" aria-label="Propzy Home">
            <div className="brand-logo-container">
              <img src="/propzy-logo.jpg" alt="Propzy Logo" className="brand-logo-img-sm" />
            </div>
          </Link>
          <p className="footer-tagline">Find your place. Start your next chapter.</p>
          <p className="footer-subtext">
            Propzy connects verified owners and prospective tenants directly with zero hidden
            brokerage.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Platform</h4>
          <ul className="footer-nav">
            <li>
              <Link to="/">Explore stays</Link>
            </li>
            <li>
              <Link to="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link to="/create-listing">List a Property</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Trust & Safety</h4>
          <ul className="footer-nav">
            <li>
              <span className="footer-badge">
                <Shield size={13} /> Email Verified Accounts
              </span>
            </li>
            <li>
              <span className="footer-badge">
                <Sparkles size={13} /> Direct Owner Access
              </span>
            </li>
            <li>
              <span className="footer-badge">
                <Heart size={13} /> Zero Spam Guarantee
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Propzy — Production Platform</span>
        <span className="footer-made-with">Crafted for modern living</span>
      </div>
    </footer>
  )
}
