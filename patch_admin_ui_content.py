import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

state_target = """  const [activeSection, setActiveSection] = useState('overview');"""
state_replace = """  const [activeSection, setActiveSection] = useState('overview');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const searchAdminUsers = async (query: string = '') => {
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/admin/users/search?query=${query}`);
      const data = await res.json();
      if (data.users) {
        setAdminUsers(data.users);
      }
    } catch(e) {}
    setIsSearchingUsers(false);
  };

  useEffect(() => {
     if (isAuthenticated && activeSection === 'users') {
        searchAdminUsers(userSearchTerm);
     }
  }, [isAuthenticated, activeSection]);"""

content = content.replace(state_target, state_replace)


ui_target = """          {/* ========================================================================= */}
          {/* 9. AUTO-SELL FIFO QUEUE                                                   */}
          {/* ========================================================================= */}"""

ui_replace = """          {/* ========================================================================= */}
          {/* 10. USER MANAGEMENT                                                       */}
          {/* ========================================================================= */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                <div>
                  <h3 className="text-sm font-black text-rose-300 font-cinzel uppercase flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-400" />
                    Global User Management & Search
                  </h3>
                  <p className="text-[10px] text-purple-300 font-mono-crypto">
                    Search through thousands of network participants by Wallet Address or Referral Code. View live MLM stats, Team Volume, and Ranks.
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-[#120626] border border-purple-500/20 rounded-2xl p-4 flex gap-3">
                 <input 
                    type="text" 
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchAdminUsers(userSearchTerm)}
                    placeholder="Search by Wallet Address or Sponsor Code..."
                    className="flex-1 bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-purple-100 placeholder-purple-500/50 outline-none focus:border-rose-500/50 transition-colors"
                 />
                 <button 
                    onClick={() => searchAdminUsers(userSearchTerm)}
                    className="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-500/40 transition-colors flex items-center gap-2"
                 >
                    {isSearchingUsers ? 'Searching...' : 'Search'}
                 </button>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                 {adminUsers && adminUsers.length > 0 ? (
                    adminUsers.map((u, i) => (
                       <div key={i} className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-rose-500/30 transition-colors">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                   ID: {u.id}
                                </span>
                                <span className="text-sm text-purple-100 font-mono-crypto break-all">
                                   {u.walletAddress}
                                </span>
                             </div>
                             <div className="flex items-center gap-4 text-[10px] text-purple-300 font-mono-crypto">
                                <span>Code: <span className="text-amber-300">{u.referralCode || 'N/A'}</span></span>
                                <span>Sponsor: <span className="text-emerald-300">{u.referredBy || 'None'}</span></span>
                                <span>Directs: <span className="text-purple-100 font-bold">{u.directCount || 0}</span></span>
                             </div>
                          </div>
                          
                          <div className="flex gap-4 md:text-right">
                             <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 uppercase tracking-widest">Team Vol</span>
                                <span className="text-sm font-bold text-emerald-400">${(u.totalTeamVolume || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 uppercase tracking-widest">Dir Vol</span>
                                <span className="text-sm font-bold text-amber-400">${(u.totalDirectVolume || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-purple-400 uppercase tracking-widest">Rank</span>
                                <span className="text-sm font-bold text-blue-400">Level {u.highestRankAchieved || 0}</span>
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center p-8 bg-[#120626] border border-purple-500/20 rounded-2xl">
                       <p className="text-xs text-purple-400 font-mono-crypto">
                          {isSearchingUsers ? 'Searching database...' : 'No users found.'}
                       </p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. AUTO-SELL FIFO QUEUE                                                   */}
          {/* ========================================================================= */}"""

content = content.replace(ui_target, ui_replace)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Added users UI component")
