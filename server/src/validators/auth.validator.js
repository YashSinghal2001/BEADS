import { z } from 'zod'

const email = z.string().email('Enter a valid email')
const password = z.string().min(6, 'Password must be at least 6 characters')

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Enter your full name'),
    email,
    phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone').optional(),
    password,
    referralCode: z.string().optional(),
  }),
}

export const loginSchema = {
  body: z.object({ email, password: z.string().min(1, 'Password is required') }),
}

export const forgotPasswordSchema = {
  body: z.object({ email }),
}

export const verifyOtpSchema = {
  body: z.object({
    email,
    otp: z.string().regex(/^[0-9]{6}$/, 'Enter the 6-digit code'),
  }),
}

export const resetPasswordSchema = {
  body: z
    .object({
      email,
      token: z.string().min(1, 'Reset token is required'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
      message: 'Passwords do not match',
      path: ['confirm'],
    }),
}
