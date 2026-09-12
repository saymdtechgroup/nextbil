import re

with open("server.ts", "r") as f:
    content = f.read()

# Force ignore the dynamic contract address and just strictly use the hardcoded one for testing dispatch logic
content = content.replace(
    "const nxbcTokenContractAddress = dynamicContractAddress || process.env.NXBC_TOKEN_ADDRESS || \"0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1\";",
    "const nxbcTokenContractAddress = \"0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1\"; // FORCED CONTRACT ADDRESS"
)

with open("server.ts", "w") as f:
    f.write(content)
print("Forced Token Address in Server")
