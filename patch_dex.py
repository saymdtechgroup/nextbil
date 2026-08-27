import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("rateLabel: '$0.50+ Listing',", "rateLabel: '$1500 - $3000',")

with open('src/App.tsx', 'w') as f:
    f.write(content)
