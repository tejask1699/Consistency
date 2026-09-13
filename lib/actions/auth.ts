'use server'

import { db } from '@/lib/db'
import { users, userStats } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'consistent-app-super-secret-jwt-key-2026'
)

const COOKIE_NAME = 'consistent_session'

export async function registerUser(formData: { name?: string; email?: string; password?: string }) {
  try {
    const { name, email, password } = formData

    if (!name || !email || !password) {
      return { success: false, error: 'Name, email, and password are required' }
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check existing user
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (existing) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user
    const [newUser] = await db.insert(users).values({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    }).returning()

    // Create user_stats row
    await db.insert(userStats).values({
      userId: newUser.id,
      currentStreak: 0,
      bestStreak: 0,
      totalTasksCompleted: 0,
    })

    // Sign JWT session
    const token = await new SignJWT({ userId: newUser.id, email: newUser.email, name: newUser.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

export async function loginUser(formData: { email?: string; password?: string }) {
  try {
    const { email, password } = formData

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const normalizedEmail = email.toLowerCase().trim()

    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail))
    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Sign JWT session
    const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return { success: true, user: { id: user.id, name: user.name, email: user.email } }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Failed to log in' }
  }
}

export async function logoutUser() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return { success: true }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null

    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as { userId: number; email: string; name: string }

    return { id: payload.userId, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}
