import { ResetPasswordForm } from '@/modules/auth/components/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          Set a new password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  )
}
