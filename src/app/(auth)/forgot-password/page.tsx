import Link from 'next/link'
import { ForgotPasswordForm } from '@/modules/auth/components/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link
          href="/sign-in"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
