import { Sparkles, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  'AI assistant that plans your day',
  'Tasks, expenses & notes in one place',
  'Private, secure and always in sync',
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand / hero panel */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 px-6 pb-20 pt-16 text-white lg:w-1/2 lg:px-14 lg:pb-16 lg:pt-16">
        <div
          aria-hidden
          className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/20 blur-2xl lg:h-72 lg:w-72"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/20 blur-2xl lg:h-72 lg:w-72"
        />

        <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">
            HypoOS
          </h1>
          <p className="mt-1 max-w-sm text-sm text-white/80 lg:mt-3 lg:text-base">
            Your personal AI operating system — manage tasks, expenses, notes,
            and more in one place.
          </p>

          <ul className="mt-8 hidden space-y-3 text-sm text-white/90 lg:block">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative -mt-10 flex flex-1 items-start justify-center rounded-t-[2rem] bg-background px-6 pb-10 pt-8 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:mt-0 lg:items-center lg:rounded-none lg:px-14 lg:shadow-none">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
