import sys

with open('src/components/ScreenTwoAssets.tsx', 'r') as f:
    content = f.read()

content = content.replace("DEX: est $0.50", "DEX: est $1500.00")
content = content.replace("dexTokens * 0.50", "dexTokens * 1500.00")

with open('src/components/ScreenTwoAssets.tsx', 'w') as f:
    f.write(content)
