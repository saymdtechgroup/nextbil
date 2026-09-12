import re

with open("src/utils/web3Helper.ts", "r") as f:
    content = f.read()

old_provider = "const provider = new ethers.BrowserProvider(ethProvider);"
new_provider = "const provider = new ethers.BrowserProvider(ethProvider, 'any');"

if old_provider in content:
    content = content.replace(old_provider, new_provider)
    with open("src/utils/web3Helper.ts", "w") as f:
        f.write(content)
    print("Fixed BrowserProvider in web3Helper.")
else:
    print("Could not find old_provider")
