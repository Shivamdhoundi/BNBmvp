"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-8" role="alert">
      <h1 className="text-2xl font-semibold">We couldn’t complete that request</h1>
      <p className="my-4">Please try again. If the problem continues, contact your workspace administrator.</p>
      {error.digest && <p className="mb-4 text-sm">Reference: {error.digest}</p>}
      <button onClick={reset} className="rounded bg-slate-900 px-4 py-2 text-white">Try again</button>
      <a href="/dashboard" className="ml-4 underline">Back to dashboard</a>
    </main>
  );
}
