import { redirect } from 'next/navigation'
import { getUser } from '@/modules/auth/queries'
import { signOut } from '@/modules/auth/actions'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">HypoOS</h1>
        <p className="max-w-md text-muted-foreground">
          Your personal AI operating system for managing tasks, expenses, notes,
          and more.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-sm">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  )
}
