import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn().mockResolvedValue({
      data: {
        content: [],
        page: { totalElements: 0, totalPages: 1, number: 0, size: 12 },
      },
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { headers: { common: {} } },
    interceptors: {
      response: { use: vi.fn() },
      request: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance,
    },
  }
})

describe('Propzy Frontend Application', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders Propzy branding and navigation correctly', async () => {
    render(<App />)
    const logos = screen.getAllByAltText('Propzy Logo')
    expect(logos.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Explore stays')).toBeInTheDocument()
    expect(screen.getByText('How it works')).toBeInTheDocument()
  })

  it('renders search input with city placeholder and hero copy', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/Mumbai, Bengaluru, Delhi/i)).toBeInTheDocument()
    expect(screen.getByText(/Find a place/i)).toBeInTheDocument()
    expect(screen.getByText(/RENTING, REIMAGINED/i)).toBeInTheDocument()
  })

  it('opens login and register modals properly with interactive role cards', () => {
    render(<App />)
    const loginBtns = screen.getAllByRole('button', { name: 'Log in' })
    fireEvent.click(loginBtns[0])

    expect(screen.getByText('WELCOME TO PROPZY')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()

    const switchBtn = screen.getByRole('button', { name: 'Create account' })
    fireEvent.click(switchBtn)
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByText('I want to join as')).toBeInTheDocument()
    expect(screen.getByText('Tenant')).toBeInTheDocument()
    expect(screen.getByText('Property Owner')).toBeInTheDocument()
    expect(screen.getByText('Confirm Password')).toBeInTheDocument()
  })

  it('handles empty properties search state gracefully', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('No properties listed yet')).toBeInTheDocument()
    })
  })

  it('handles session token safely on mount', async () => {
    localStorage.setItem('propzy_token', 'sample-jwt-token')
    render(<App />)
    expect(localStorage.getItem('propzy_token')).toBe('sample-jwt-token')
  })
})
