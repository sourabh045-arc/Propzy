export type Property = {
  id: number
  title: string
  description?: string
  rentAmount: number
  propertyType: string
  address: string
  city: string
  bedrooms: number
  bathrooms: number
  available: boolean
  imageUrl?: string
  ownerId: number
  ownerName: string
  createdAt?: string
  updatedAt?: string
}

export type CurrentUser = {
  userId: number
  fullName: string
  email: string
  role: 'TENANT' | 'OWNER' | 'ADMIN'
  emailVerified?: boolean
  phone?: string
}

export type Inquiry = {
  id: number
  propertyId: number
  propertyTitle: string
  tenantId: number
  tenantName: string
  tenantEmail: string
  tenantPhone?: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}
