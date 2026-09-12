import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Change rate: p.tokenPrice !== undefined ? Number(p.tokenPrice) : (p.rate || 0)
# to prioritize p.rate, or just delete p.tokenPrice if it exists in the mapping.
content = content.replace(
    "rate: p.tokenPrice !== undefined ? Number(p.tokenPrice) : (p.rate || 0),",
    "rate: p.rate !== undefined ? Number(p.rate) : (p.tokenPrice || 0),"
)
content = content.replace(
    "rateLabel: p.rateLabel || `$${(p.tokenPrice || p.rate || 0).toFixed(2)}`,",
    "rateLabel: p.rateLabel || `$${(p.rate || p.tokenPrice || 0).toFixed(2)}`,"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed rate mapping in App.tsx")
