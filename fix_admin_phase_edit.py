import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Make sure when editing 'rate', we also set 'tokenPrice' because the system might be using both!
content = content.replace(
    "updated[index].rateLabel = `$${numRate.toFixed(2)}`;",
    "updated[index].rateLabel = `$${numRate.toFixed(2)}`;\n      updated[index].rate = numRate;\n      (updated[index] as any).tokenPrice = numRate;"
)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)
print("Fixed phase rate edit")
