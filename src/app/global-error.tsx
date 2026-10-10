"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en"><body><main role="alert">
      <h1>StayPilot is temporarily unavailable</h1>
      <p>Please try again or contact your workspace administrator.</p>
      <button onClick={reset}>Try again</button>
    </main></body></html>
  );
}
