import Link from "next/link";

interface LegalPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-700">
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
        <p className="mt-1 text-xs text-zinc-400">Last updated: March 2026</p>
      </div>

      <div className="space-y-8 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        {children}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Questions?{" "}
        <Link href="/contact" className="font-medium text-zinc-900 hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}
