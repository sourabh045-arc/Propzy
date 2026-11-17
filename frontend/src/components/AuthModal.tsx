import { useState } from 'react'
import { X, LoaderCircle, Check, KeyRound, Mail, Lock, User as UserIcon, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    verificationEmail,
    closeAuthModal,
    switchAuthMode,
    login,
    register,
    verifyEmail,
    resendVerification,
  } = useAuth()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [demoCode, setDemoCode] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'TENANT' | 'OWNER'>('TENANT')
  const [code, setCode] = useState('')

  if (!authModalOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    const success = await login(email, password)
    setLoading(false)
    if (!success) {
      setErrorMessage('Invalid email or password.')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    const res = await register({
      fullName,
      email,
      password,
      phone,
      role,
    })
    setLoading(false)

    if (res.success && res.verificationRequired) {
      if (res.demoVerificationCode) {
        setDemoCode(res.demoVerificationCode)
        setCode(res.demoVerificationCode)
      }
    } else if (!res.success) {
      setErrorMessage(res.message || 'Registration failed.')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    const targetEmail = verificationEmail || email
    const success = await verifyEmail(targetEmail, code.trim())
    setLoading(false)
    if (!success) {
      setErrorMessage('Invalid or expired verification code.')
    }
  }

  const handleResend = async () => {
    const targetEmail = verificationEmail || email
    setLoading(true)
    const res = await resendVerification(targetEmail)
    setLoading(false)
    if (res.success && res.demoCode) {
      setDemoCode(res.demoCode)
      setCode(res.demoCode)
    }
  }

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuthModal()
      }}
    >
      <section
        className="auth-modal animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="modal-close" onClick={closeAuthModal} aria-label="Close modal">
          <X size={20} />
        </button>

        <span className="eyebrow">WELCOME TO PROPZY</span>

        {/* Mode: Login */}
        {authModalMode === 'login' && (
          <>
            <h2 id="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Log in to continue to Propzy.</p>

            {errorMessage && <div className="form-error-banner">{errorMessage}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-dark btn-full btn-lg" disabled={loading}>
                {loading ? <LoaderCircle className="spinner" size={18} /> : 'Log In'}
              </button>

              <div className="auth-switch">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setErrorMessage('')
                    switchAuthMode('register')
                  }}
                >
                  Create account
                </button>
              </div>
            </form>
          </>
        )}

        {/* Mode: Register */}
        {authModalMode === 'register' && (
          <>
            <h2 id="auth-title">Create your account</h2>
            <p className="auth-subtitle">Join Propzy to start finding or listing homes.</p>

            {errorMessage && <div className="form-error-banner">{errorMessage}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="role-selector-section">
                <label className="section-label">I want to join as</label>
                <div className="role-cards-grid">
                  <button
                    type="button"
                    className={`role-select-card ${role === 'TENANT' ? 'selected' : ''}`}
                    onClick={() => setRole('TENANT')}
                  >
                    <div className="role-card-header">
                      <span className="role-title">Tenant</span>
                      {role === 'TENANT' && <Check size={16} className="check-icon" />}
                    </div>
                    <span className="role-description">Browse verified properties & send direct inquiries</span>
                  </button>

                  <button
                    type="button"
                    className={`role-select-card ${role === 'OWNER' ? 'selected' : ''}`}
                    onClick={() => setRole('OWNER')}
                  >
                    <div className="role-card-header">
                      <span className="role-title">Property Owner</span>
                      {role === 'OWNER' && <Check size={16} className="check-icon" />}
                    </div>
                    <span className="role-description">List your properties with zero broker commission</span>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-fullname">Full Name</label>
                <div className="input-with-icon">
                  <UserIcon size={16} className="input-icon" />
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    placeholder="Sourabh Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-phone">Phone Number (Optional)</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="At least 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="reg-confirm"
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-dark btn-full btn-lg" disabled={loading}>
                {loading ? <LoaderCircle className="spinner" size={18} /> : 'Complete Registration'}
              </button>

              <div className="auth-switch">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setErrorMessage('')
                    switchAuthMode('login')
                  }}
                >
                  Log In
                </button>
              </div>
            </form>
          </>
        )}

        {/* Mode: Email Verification */}
        {authModalMode === 'verifyEmail' && (
          <>
            <div className="verify-badge-icon">
              <KeyRound size={28} />
            </div>
            <h2 id="auth-title">Verify your email</h2>
            <p className="auth-subtitle">
              We sent a 6-digit verification code to{' '}
              <strong>{verificationEmail || email}</strong>.
            </p>

            {demoCode && (
              <div className="demo-code-box">
                <span className="demo-code-label">Demo Verification Code:</span>
                <code className="demo-code-val">{demoCode}</code>
              </div>
            )}

            {errorMessage && <div className="form-error-banner">{errorMessage}</div>}

            <form onSubmit={handleVerify} className="auth-form">
              <div className="input-group">
                <label htmlFor="verify-code">6-Digit Code</label>
                <input
                  id="verify-code"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="verify-code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-dark btn-full btn-lg" disabled={loading}>
                {loading ? <LoaderCircle className="spinner" size={18} /> : 'Verify & Continue'}
              </button>

              <div className="auth-switch">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
