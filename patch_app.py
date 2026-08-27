import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "`Strict Limit Exceeded: Admin dwara allot ki gayi limit (${currentP.totalSupply.toLocaleString()} ${systemConfig.tokenSymbol}) se zyada token purchase nahi kiye ja sakte. Is phase me sirf ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol} bache hain.`",
    "`Strict Limit Exceeded: You cannot purchase more coins than the limit allocated by the Admin (${currentP.totalSupply.toLocaleString()} ${systemConfig.tokenSymbol}). Only ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol} are remaining in this phase.`"
)

content = content.replace("'Phase 1 Token Purchase (500,000 NXBC)'", "'Phase 1 Coin Purchase (500,000 NXBC)'")
content = content.replace("'NXBC Network Token'", "'NXBC Network Coin'")
content = content.replace('text-amber-400"> TOKEN<', 'text-amber-400"> COIN<')
content = content.replace("100k Tokens", "100k Coins")
content = content.replace("Token Acquisition", "Coin Acquisition")

with open('src/App.tsx', 'w') as f:
    f.write(content)
