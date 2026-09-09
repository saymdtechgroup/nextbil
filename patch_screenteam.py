import re
with open("src/components/ScreenTeam.tsx", "r") as f:
    content = f.read()

# 1. Add referralCode to Props
props_target = """  directSponsorPercent?: number;"""
props_replace = """  directSponsorPercent?: number;
  referralCode?: string;"""
content = content.replace(props_target, props_replace)

# 2. Add to destructuring
destruct_target = """  minMlmQualifyUsd = 100,
  onOpenBuyModal,
}) => {"""
destruct_replace = """  minMlmQualifyUsd = 100,
  onOpenBuyModal,
  referralCode = 'NXBC-COMMUNITY-0000',
}) => {"""
content = content.replace(destruct_target, destruct_replace)

# 3. Update the writeText
clip_target = """navigator.clipboard.writeText('https://nxbc.network?ref=NXBC-COMMUNITY-0000');"""
clip_replace = """navigator.clipboard.writeText(`https://nxbc.network?ref=${referralCode}`);"""
content = content.replace(clip_target, clip_replace)

with open("src/components/ScreenTeam.tsx", "w") as f:
    f.write(content)
print("Replaced!")
