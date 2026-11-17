import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  MessageSquare,
  KeyRound,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    q: 'How does Propzy guarantee 0% brokerage?',
    a: 'Propzy cuts out the traditional middleman brokers entirely. Verified property owners list their properties directly on our platform, and prospective tenants send direct inquiries. All communication and agreements happen peer-to-peer.',
  },
  {
    q: 'How are properties and owners verified?',
    a: 'Every property owner on Propzy goes through automated email verification upon registration. Furthermore, listings require explicit owner ownership verification, preventing fake duplicate posts.',
  },
  {
    q: 'Can I upload photographs directly from my phone or computer?',
    a: 'Yes! When creating a property listing, you can select image files (PNG, JPG, WEBP) directly from your device. Our client pipeline automatically optimizes and compresses images for lightning-fast loading.',
  },
  {
    q: 'How do inquiries work?',
    a: 'When a tenant finds a property they love, they can send a direct inquiry specifying their move-in timeline and contact phone. The owner is notified in real time on their Inquiries hub and can accept or reject the request.',
  },
  {
    q: 'Is Propzy free to use for tenants?',
    a: 'Yes, Propzy is 100% free for tenants. You can search, filter, and message as many owners as you want with zero fees.',
  },
]

export default function HowItWorksPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [activePersona, setActivePersona] = useState<'tenant' | 'owner'>('tenant')

  return (
    <div className="how-it-works-page animate-fade-in">
      {/* Header */}
      <section className="how-hero">
        <div className="how-hero-container">
          <div className="hero-badge animate-float">
            <Sparkles size={14} className="gold-icon" />
            <span>TRANSPARENT RENTALS</span>
          </div>
          <h1 className="how-title">How Propzy Works</h1>
          <p className="how-subtitle">
            A frictionless, direct-to-owner rental ecosystem built for modern lifestyles.
          </p>

          {/* Persona Switcher */}
          <div className="persona-toggle-container">
            <button
              className={`persona-btn ${activePersona === 'tenant' ? 'active' : ''}`}
              onClick={() => setActivePersona('tenant')}
            >
              For Tenants
            </button>
            <button
              className={`persona-btn ${activePersona === 'owner' ? 'active' : ''}`}
              onClick={() => setActivePersona('owner')}
            >
              For Property Owners
            </button>
          </div>
        </div>
      </section>

      {/* Steps Roadmap */}
      <section className="roadmap-section">
        <div className="roadmap-container">
          {activePersona === 'tenant' ? (
            <div className="steps-flow animate-fade-in">
              <div className="step-card">
                <div className="step-num">01</div>
                <div className="step-icon-circle">
                  <Compass size={24} className="gold-icon" />
                </div>
                <h3>Explore Verified Stays</h3>
                <p>
                  Filter residences by city, rent range, property architecture, and bedroom specs.
                  Browse high-resolution photos uploaded directly by owners.
                </p>
              </div>

              <div className="step-card">
                <div className="step-num">02</div>
                <div className="step-icon-circle">
                  <MessageSquare size={24} className="gold-icon" />
                </div>
                <h3>Send Direct Inquiries</h3>
                <p>
                  No brokers, no gatekeepers. Reach out directly with your questions or schedule
                  walkthroughs with a single click.
                </p>
              </div>

              <div className="step-card">
                <div className="step-num">03</div>
                <div className="step-icon-circle">
                  <KeyRound size={24} className="gold-icon" />
                </div>
                <h3>Move In & Save Thousands</h3>
                <p>
                  Once the owner approves your inquiry, connect directly via phone or email to
                  finalize terms and collect your keys with ₹0 brokerage fees.
                </p>
              </div>
            </div>
          ) : (
            <div className="steps-flow animate-fade-in">
              <div className="step-card">
                <div className="step-num">01</div>
                <div className="step-icon-circle">
                  <PlusCircle size={24} className="gold-icon" />
                </div>
                <h3>List in 2 Minutes</h3>
                <p>
                  Add your property details, set your preferred rent, and upload pictures directly
                  from your phone or laptop.
                </p>
              </div>

              <div className="step-card">
                <div className="step-num">02</div>
                <div className="step-icon-circle">
                  <MessageSquare size={24} className="gold-icon" />
                </div>
                <h3>Receive Quality Inquiries</h3>
                <p>
                  Get direct inquiries from verified tenants. Review their background and proposed
                  timelines in your centralized dashboard.
                </p>
              </div>

              <div className="step-card">
                <div className="step-num">03</div>
                <div className="step-icon-circle">
                  <CheckCircle2 size={24} className="gold-icon" />
                </div>
                <h3>Accept & Lease</h3>
                <p>
                  One click to accept or decline. Accepted inquiries unlock immediate contact
                  coordination so you can fill your vacancy fast.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-header">
            <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Everything you need to know</h2>
          </div>

          <div className="faq-accordion">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index
              return (
                <div
                  key={index}
                  className={`faq-item ${isOpen ? 'open' : ''}`}
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                >
                  <div className="faq-question-row">
                    <h3>{faq.q}</h3>
                    <ChevronDown
                      size={20}
                      className={`faq-chevron ${isOpen ? 'rotated' : ''}`}
                    />
                  </div>
                  {isOpen && (
                    <div className="faq-answer-body animate-fade-in">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="how-cta-section">
        <div className="how-cta-card">
          <h2>Ready to experience effortless renting?</h2>
          <p>Join thousands finding and listing residences with zero commission.</p>
          <div className="how-cta-buttons">
            <Link to="/" className="btn-gold-glow">
              Explore Available Stays
            </Link>
            <Link to="/create-listing" className="btn-dark">
              List Your Residence
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
