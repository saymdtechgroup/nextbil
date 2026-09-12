import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the priority logic
content = content.replace(
    "const nxbcTokenContractAddress = process.env.NXBC_TOKEN_ADDRESS || dynamicContractAddress;",
    "const nxbcTokenContractAddress = dynamicContractAddress || process.env.NXBC_TOKEN_ADDRESS || \"0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1\";"
)

with open("server.ts", "w") as f:
    f.write(content)
print("Updated priority")
