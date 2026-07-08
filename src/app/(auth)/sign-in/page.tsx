import Link from 'next/link'
import { LoginForm } from '@/modules/auth/components/login-form'
import { GoogleSignInButton } from '@/modules/auth/components/google-sign-in-button'

export default function SignInPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue to your account.
        </p>
      </div>

      <LoginForm />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <GoogleSignInButton />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/sign-up"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
