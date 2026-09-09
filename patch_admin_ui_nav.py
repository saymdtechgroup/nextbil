import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

nav_target = """          <button
            onClick={() => setActiveSection('queue')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'queue'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-900/50 text-blue-300 border border-blue-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>9. Auto-Sell FIFO Queue</span>
          </button>
        </aside>"""

nav_replace = """          <button
            onClick={() => setActiveSection('queue')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'queue'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-900/50 text-blue-300 border border-blue-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>9. Auto-Sell FIFO Queue</span>
          </button>
          
          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold font-rajdhani uppercase tracking-wider transition-all w-full text-left whitespace-nowrap ${
              activeSection === 'users'
                ? 'bg-gradient-to-r from-rose-500/20 to-purple-900/50 text-rose-300 border border-rose-400 shadow-md'
                : 'text-purple-300 hover:text-slate-100 hover:bg-purple-950/40'
            }`}
          >
            <Users className="w-4 h-4 text-rose-400" />
            <span>10. User Management</span>
          </button>
        </aside>"""
content = content.replace(nav_target, nav_replace)

# Mobile Nav Menu
mobile_nav_target = """                <button
                  onClick={() => setActiveSection('queue')}
                  className={`w-full text-left px-4 py-3 border-b border-purple-500/10 text-sm font-bold font-rajdhani uppercase ${activeSection === 'queue' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-300'}`}
                >
                  9. Auto-Sell FIFO Queue
                </button>
              </div>
            )}
          </div>
        </div>"""

mobile_nav_replace = """                <button
                  onClick={() => setActiveSection('queue')}
                  className={`w-full text-left px-4 py-3 border-b border-purple-500/10 text-sm font-bold font-rajdhani uppercase ${activeSection === 'queue' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-300'}`}
                >
                  9. Auto-Sell FIFO Queue
                </button>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full text-left px-4 py-3 text-sm font-bold font-rajdhani uppercase ${activeSection === 'users' ? 'text-rose-400 bg-rose-500/10' : 'text-purple-300'}`}
                >
                  10. User Management
                </button>
              </div>
            )}
          </div>
        </div>"""
content = content.replace(mobile_nav_target, mobile_nav_replace)


with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Added users nav link")
