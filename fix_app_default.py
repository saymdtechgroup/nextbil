import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "contractAddress: '0x85363386808d1f26BF3805Bb44a093a2Af9E8783',",
    "contractAddress: '0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1',"
)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Updated App.tsx default")
