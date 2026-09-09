with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

target = """              {/* Status Alert */}
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Automatic FIFO Active:</strong> Natural buyer volume automatically fulfills top of line. Use buttons below only for manual priority adjustments.</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? (
                  sellQueue.map((entry, idx) => {
                    const progress = Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100);
                    const isFullySold = entry.tokensSold >= entry.tokensRequested;
                    return (
                      <div key={idx} className="bg-[#120626] border border-blue-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-blue-400/60 shadow-lg">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Position #{idx + 1}
                            </span>
                            <span className="text-xs font-bold font-mono-crypto text-slate-100">
                              {entry.userAddress || '0x...Current User'}
                            </span>"""

replacement = """              {/* Status Alert */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="w-full sm:w-auto p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs flex-1">
                  <div className="flex items-center gap-2 text-blue-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Automatic FIFO Active:</strong> Natural buyer volume automatically fulfills top of line.</span>
                  </div>
                </div>
                {/* Search Bar for Queue */}
                <div className="w-full sm:w-[300px] relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-blue-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search by Wallet Address..."
                    className="w-full pl-9 pr-3 py-2 bg-[#120626] border border-blue-500/30 rounded-xl text-xs text-blue-100 font-mono-crypto focus:outline-none focus:border-blue-400 placeholder:text-blue-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {sellQueue && sellQueue.length > 0 ? (
                  sellQueue.map((entry, idx) => {
                    if (queueSearch && entry.userId && !entry.userId.toLowerCase().includes(queueSearch.toLowerCase())) {
                      return null;
                    }
                    const progress = Math.min(100, (entry.tokensSold / entry.tokensRequested) * 100);
                    const isFullySold = entry.tokensSold >= entry.tokensRequested;
                    return (
                      <div key={idx} className="bg-[#120626] border border-blue-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-blue-400/60 shadow-lg">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-crypto bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Position #{idx + 1}
                            </span>
                            <span className="text-xs font-bold font-mono-crypto text-slate-100">
                              {entry.userId || 'Unknown Wallet'}
                            </span>"""

if target in content:
    with open("src/components/SecretAdminPage.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced Search!")
else:
    print("Target not found")
