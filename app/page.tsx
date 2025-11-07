export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-black to-amber-950 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md">
        
        {/* Background Elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden">
          
          {/* Top Decorative Strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          
          <div className="flex flex-col items-center space-y-6 p-6">
            
            {/* Logo */}
            <div className="mt-4">
              <img
                src="/uploads/logo.png"
                alt="KGP Gold"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 text-amber-400/80 text-xs font-semibold tracking-widest uppercase">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                <span>Live Gold Rates</span>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-white">Today's</span>{' '}
                <span className="text-transparent bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text">
                  Gold Rate
                </span>
              </h1>
              
              <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-amber-100 font-semibold text-sm">07 / NOV / 2025</span>
              </div>
            </div>

            {/* Jewellery Image */}
            <div className="relative w-full max-w-xs">
              <div className="absolute -inset-3 bg-amber-500/10 rounded-2xl blur-xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl">
                <img 
                  src="/uploads/Gemini_Generated_Image_etgzncetgzncetgz.png" 
                  alt="Gold Jewellery"
                  className="w-full h-40 object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 gap-4 w-full">
              {/* Per Gram */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-5 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ 11,185
                  </div>
                  <div className="text-amber-100/80 text-xs font-semibold uppercase tracking-wider">
                    Per Gram
                  </div>
                </div>
              </div>

              {/* Per Sovereign */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-amber-500/20 rounded-xl p-5 text-center group-hover:border-amber-500/40 transition-all duration-300">
                  <div className="text-2xl font-black text-amber-300 mb-1">
                    ₹ 89,480
                  </div>
                  <div className="text-amber-100/80 text-xs font-semibold uppercase tracking-wider">
                    Per Sovereign
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Info */}
            <div className="text-center w-full">
              <p className="text-amber-200/90 font-medium tracking-wide bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-sm">
                🏛️ KGP Gold, Mangalya Complex<br />
                <span className="text-amber-100/70 text-xs">Main Road, Koduvally</span>
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center w-full pt-2 pb-4">
              <button className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 px-8 py-4 font-semibold text-white shadow-2xl hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden w-full max-w-xs">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center space-x-2">
                  <span>Export Poster</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Accent Elements */}
            <div className="flex space-x-3 pb-2">
              {[1, 2, 3, 4].map((item) => (
                <div 
                  key={item} 
                  className="w-1.5 h-1.5 bg-amber-400 rounded-full opacity-60 animate-pulse" 
                  style={{ animationDelay: `${item * 0.2}s` }} 
                />
              ))}
            </div>

          </div>

          {/* Bottom Decorative Strip */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-amber-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-amber-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        
      </div>
    </main>
  );
}
