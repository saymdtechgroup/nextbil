import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace parsedTokens with toFixed
old_line = "const parsedTokens = ethers.parseUnits(Number(tokenAmount).toString(), 18);"
new_line = "const parsedTokens = ethers.parseUnits(Number(tokenAmount).toFixed(18), 18);"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Fixed parsedTokens logic.")
else:
    print("Could not find parsedTokens line.")
