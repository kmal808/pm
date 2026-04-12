import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Dashboard } from "./Dashboard";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 dark:from-background dark:via-background dark:to-background dark:text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-border dark:bg-card/95">
        <div className="mx-auto flex h-14 w-full max-w-[1536px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-xs font-bold tracking-tight text-white shadow-sm dark:bg-blue-500">
              PM
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-foreground">
              Construction PM
            </h2>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">
        <Authenticated>
          <Dashboard />
        </Authenticated>
        <Unauthenticated>
          <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-screen-lg flex-col items-center justify-center px-4 py-16 md:px-8">
            <div className="mb-10 w-full max-w-md text-center">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Construction project management
              </h1>
              <p className="mt-3 text-pretty text-sm text-muted-foreground md:text-base">
                Spaces, projects, tasks, and documents in one place. Sign in to
                continue.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-md dark:border-border dark:bg-card">
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      <Toaster richColors position="bottom-right" closeButton />
    </div>
  );
}
