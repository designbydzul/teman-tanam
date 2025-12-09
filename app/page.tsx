export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] flex flex-col items-center justify-center p-8">
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-[#2D5016] mb-2">
          TEMAN TANAM
        </h1>
        <p className="text-lg text-[#666666]">
          by Akar Nusa
        </p>
      </div>

      {/* Tagline */}
      <div className="text-center mb-12">
        <p className="text-2xl text-[#2C2C2C] font-semibold mb-2">
          Your companion for reconnection
        </p>
        <p className="text-lg text-[#666666]">
          Companion untuk tanaman kamu 🌱
        </p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full text-center">
        <p className="text-[#7CB342] font-medium text-lg mb-2">
          ✓ Next.js Ready
        </p>
        <p className="text-[#7CB342] font-medium text-lg mb-2">
          ✓ Supabase Connected
        </p>
        <p className="text-[#7CB342] font-medium text-lg">
          ✓ Ready to Build!
        </p>
      </div>

      {/* Coming Soon */}
      <div className="mt-12 text-center">
        <p className="text-[#999999] text-sm">
          MVP Development in Progress...
        </p>
        <p className="text-[#999999] text-sm">
          Built with values, not venture capital ✨
        </p>
      </div>
    </div>
  );
}