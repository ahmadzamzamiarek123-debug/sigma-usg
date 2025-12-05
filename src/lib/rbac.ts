import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import type { Role } from '@/types'

// Role hierarchy: ADMIN > OPERATOR > USER
const roleHierarchy: Record<Role, number> = {
  USER: 1,
  OPERATOR: 2,
  ADMIN: 3,
}

// Check if user has required role
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Check if user has exact role
export function isRole(userRole: Role, targetRole: Role): boolean {
  return userRole === targetRole
}

// Get current session for server components
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

// Get current user or throw error
export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user
}

// Require specific role
export async function requireRole(requiredRole: Role) {
  const user = await requireAuth()
  if (!hasRole(user.role, requiredRole)) {
    throw new Error('Forbidden')
  }
  return user
}

// Require exact role
export async function requireExactRole(targetRole: Role) {
  const user = await requireAuth()
  if (!isRole(user.role, targetRole)) {
    throw new Error('Forbidden')
  }
  return user
}

// API route helper - returns error response or user
export async function withAuth(requiredRole?: Role) {
  const session = await getCurrentSession()
  
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      user: null,
    }
  }

  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
      user: null,
    }
  }

  return { error: null, user: session.user }
}

// Check route access by role
export const routeAccess: Record<string, Role[]> = {
  '/user': ['USER', 'OPERATOR', 'ADMIN'],
  '/operator': ['OPERATOR', 'ADMIN'],
  '/admin': ['ADMIN'],
}

export function canAccessRoute(path: string, role: Role): boolean {
  // Find matching route pattern
  for (const [pattern, allowedRoles] of Object.entries(routeAccess)) {
    if (path.startsWith(pattern)) {
      return allowedRoles.includes(role)
    }
  }
  return true // Allow by default for unprotected routes
}
