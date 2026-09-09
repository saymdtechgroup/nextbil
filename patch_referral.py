import re
with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add referral code state
state_target = "  const [walletAddress, setWalletAddress] = useState<string>("
state_replace = """  const [userRefCode, setUserRefCode] = useState<string>('NXBC-COMMUNITY-0000');
  const [walletAddress, setWalletAddress] = useState<string>("""
content = content.replace(state_target, state_replace)

# 2. Add URL parsing in the first useEffect
storage_target = """  useEffect(() => {
    // Initial fetch of config
"""
storage_replace = """  useEffect(() => {
    // Capture referral code from URL if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('nxbc_sponsor_ref', ref.toUpperCase());
      }
    }

    // Initial fetch of config
"""
content = content.replace(storage_target, storage_replace)

# 3. Update the sync useEffect to use the sponsor ref and save user's own ref
sync_pattern = re.compile(r"fetch\('/api/users/sync'[\s\S]*?body: JSON\.stringify\(\{\s*walletAddress,\s*referredBy: 'REFMASTER88',\s*\}\),[\s\S]*?\.then\(\(data\) => \{[\s\S]*?console\.log\('PostgreSQL synced user:', data\.user\);[\s\S]*?\}\)[\s\S]*?\.catch")

sync_replace = """const sponsorRef = typeof window !== 'undefined' ? localStorage.getItem('nxbc_sponsor_ref') : null;
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          referredBy: sponsorRef || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            console.log('PostgreSQL synced user:', data.user);
            if (data.user.referralCode) {
              setUserRefCode(data.user.referralCode);
            }
          }
        })
        .catch"""
content = sync_pattern.sub(sync_replace, content)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Replaced!")
