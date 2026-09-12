import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Make sure App.tsx mapping sets both rate and tokenPrice!
# Find the mappedPhases part.
content = content.replace(
    "rate: p.rate !== undefined ? Number(p.rate) : (p.tokenPrice || 0),",
    "rate: p.rate !== undefined ? Number(p.rate) : (p.tokenPrice || 0),\n              tokenPrice: p.rate !== undefined ? Number(p.rate) : (p.tokenPrice || 0),"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Fixed App mapping")
