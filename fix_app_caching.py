import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add timestamp to fetch request to prevent browser caching
content = content.replace(
    "const res = await fetch('/api/admin/configs');",
    "const res = await fetch(`/api/admin/configs?t=${new Date().getTime()}`);"
)

content = content.replace(
    "const res = await fetch(`/api/users/${walletAddress}`);",
    "const res = await fetch(`/api/users/${walletAddress}?t=${new Date().getTime()}`);"
)

content = content.replace(
    "const res = await fetch('/api/p2p/orders');",
    "const res = await fetch(`/api/p2p/orders?t=${new Date().getTime()}`);"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Added cache-busting timestamp to fetch requests in App.tsx")
