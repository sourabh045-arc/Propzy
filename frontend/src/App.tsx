import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import HomePage from './pages/HomePage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import CreatePropertyPage from './pages/CreatePropertyPage'
import DashboardPage from './pages/DashboardPage'
import InquiriesPage from './pages/InquiriesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<HomePage />} />
                <Route path="/property/:id" element={<PropertyDetailPage />} />
                <Route path="/create-listing" element={<CreatePropertyPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/inquiries" element={<InquiriesPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <AuthModal />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
