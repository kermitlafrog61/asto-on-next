import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-12 px-8 py-16">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-48 w-48 rounded-full border-4 border-white bg-black p-4 flex items-center justify-center overflow-hidden">
            <Image
              src="/uploads/astro.png"
              alt="AstroClub Logo"
              width={180}
              height={180}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            Welcome to AstroClub on KIMEP
          </h1>
          <p className="text-xl text-slate-300 text-center max-w-2xl">
            Explore the cosmos with us! Upload your astrophotography, register for events, and join our community.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <Link
            href="/upload"
            className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:border-blue-400"
          >
            <div className="text-3xl mb-3">📸</div>
            <h2 className="text-xl font-semibold mb-2">Upload Image</h2>
            <p className="text-slate-300 text-sm">
              Share your astrophotography with the community
            </p>
          </Link>

          <Link
            href="/events"
            className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:border-blue-400"
          >
            <div className="text-3xl mb-3">⭐</div>
            <h2 className="text-xl font-semibold mb-2">Events</h2>
            <p className="text-slate-300 text-sm">
              Register for upcoming astronomy events
            </p>
          </Link>

          <Link
            href="/merchandise"
            className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:border-blue-400"
          >
            <div className="text-3xl mb-3">🛍️</div>
            <h2 className="text-xl font-semibold mb-2">Merchandise</h2>
            <p className="text-slate-300 text-sm">
              Check out our AstroClub merchandise
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
