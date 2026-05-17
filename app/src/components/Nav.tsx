import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          CanMyAITrade
        </Link>
      </nav>
    </header>
  );
}
