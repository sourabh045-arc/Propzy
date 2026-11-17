import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  User as UserIcon,
  PlusCircle,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Compass,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { currentUser, logout, openAuthModal } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <Link to="/" className="brand" aria-label="Propzy Home" onClick={closeMobile}>
          <div className="brand-logo-container">
            <img src="/propzy-logo.jpg" alt="Propzy Logo" className="brand-logo-img" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-only">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end
          >
            <Compass size={16} /> Explore stays
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <HelpCircle size={16} /> How it works
          </NavLink>
          {currentUser?.role === 'OWNER' && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <LayoutDashboard size={16} /> My Dashboard
            </NavLink>
          )}
          {currentUser && (
            <NavLink
              to="/inquiries"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <MessageSquare size={16} />{' '}
              {currentUser.role === 'OWNER' ? 'Inquiries Received' : 'My Inquiries'}
            </NavLink>
          )}
        </div>

        {/* Desktop User Actions */}
        <div className="nav-actions desktop-only">
          {currentUser ? (
            <div className="user-nav">
              <span className="user-badge" title={`Signed in as ${currentUser.email}`}>
                <UserIcon size={14} />
                <span className="user-name">{currentUser.fullName}</span>
                <span className="user-role-pill">{currentUser.role}</span>
              </span>

              {currentUser.role === 'OWNER' && (
                <button
                  className="btn-gold-glow btn-sm"
                  onClick={() => navigate('/create-listing')}
                >
                  <PlusCircle size={15} /> List Property
                </button>
              )}

              <button className="btn-outline-danger btn-sm" onClick={logout} title="Log out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <button
                className="btn-ghost btn-sm"
                onClick={() => openAuthModal('login')}
              >
                Log in
              </button>
              <button
                className="btn-dark btn-sm"
                onClick={() => openAuthModal('register')}
              >
                Sign up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <NavLink to="/" className="mobile-link" onClick={closeMobile} end>
            <Compass size={18} /> Explore stays
          </NavLink>
          <NavLink to="/how-it-works" className="mobile-link" onClick={closeMobile}>
            <HelpCircle size={18} /> How it works
          </NavLink>

          {currentUser && (
            <>
              {currentUser.role === 'OWNER' && (
                <>
                  <NavLink to="/dashboard" className="mobile-link" onClick={closeMobile}>
                    <LayoutDashboard size={18} /> My Dashboard
                  </NavLink>
                  <NavLink to="/create-listing" className="mobile-link" onClick={closeMobile}>
                    <PlusCircle size={18} /> List Property
                  </NavLink>
                </>
              )}
              <NavLink to="/inquiries" className="mobile-link" onClick={closeMobile}>
                <MessageSquare size={18} />{' '}
                {currentUser.role === 'OWNER' ? 'Inquiries Received' : 'My Inquiries'}
              </NavLink>
              <div className="mobile-user-section">
                <span className="user-badge">
                  <UserIcon size={14} /> {currentUser.fullName} ({currentUser.role})
                </span>
                <button
                  className="btn-outline-danger btn-full"
                  onClick={() => {
                    logout()
                    closeMobile()
                  }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </>
          )}

          {!currentUser && (
            <div className="mobile-auth-actions">
              <button
                className="btn-outline btn-full"
                onClick={() => {
                  openAuthModal('login')
                  closeMobile()
                }}
              >
                Log in
              </button>
              <button
                className="btn-dark btn-full"
                onClick={() => {
                  openAuthModal('register')
                  closeMobile()
                }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
