import sys

with open('src/components/AdminPanelModal.tsx', 'r') as f:
    content = f.read()

# Translations
content = content.replace("Jab koi user kisi ke direct link se NXBC tokens buy karega, to us direct inviter ko purchase amount ka seedhe <strong>{localSystem.directSponsorPercent}%</strong> instant wallet me credit hoga.", "When a user purchases NXBC coins via a direct referral link, the direct inviter instantly receives <strong>{localSystem.directSponsorPercent}%</strong> of the purchase amount in their wallet.")
content = content.replace("Har Phase Ka Price Aur Token Allotment Set Karein", "Set Price and Coin Allotment For Each Phase")
content = content.replace("Har Rank ka qualification requirement, one-time cash bonus, reward token aur monthly royalty %", "Qualification requirement, one-time cash bonus, reward coins, and monthly royalty % for each rank.")
content = content.replace("Presale ko temporarily pause kar dega jisse koi naya user token buy na kar sake", "Temporarily pauses the presale so no new users can purchase coins.")

# UI Text
content = content.replace("Token Pricing", "Coin Pricing")
content = content.replace("Token Price &", "Coin Price &")
content = content.replace("Token & Security", "Coin & Security")
content = content.replace("TOKEN & SECURITY", "COIN & SECURITY")
content = content.replace("Token Price", "Coin Price")
content = content.replace("Allotted Tokens", "Allotted Coins")
content = content.replace("Tokens Sold Count", "Coins Sold Count")
content = content.replace("Tokens Sold (Current)", "Coins Sold (Current)")
content = content.replace("Reward NXBC Tokens", "Reward NXBC Coins")
content = content.replace("Core Token Information", "Core Coin Information")
content = content.replace("Token Name", "Coin Name")
content = content.replace("Token Symbol", "Coin Symbol")

with open('src/components/AdminPanelModal.tsx', 'w') as f:
    f.write(content)
