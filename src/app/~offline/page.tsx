import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#00592B] px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-black bg-white text-[36px]">
        !
      </div>
      <h1 className="mt-6 text-[28px] font-bold text-white [font-family:var(--font-oswald)] uppercase">
        No Connection
      </h1>
      <p className="mt-2 text-[16px] text-[#B3D6BF] [font-family:var(--font-oswald)] uppercase font-bold">
        Bills created offline will sync when you reconnect
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-[20px] border-4 border-black bg-white px-8 py-3 text-[16px] font-bold text-[#00592B] [font-family:var(--font-oswald)] uppercase shadow-[4px_4px_0_0_#000] transition-all hover:shadow-[6px_6px_0_0_#000]"
      >
        Try Again
      </Link>
    </div>
  );
}
