import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

pattern = r"const \[hasLoadedFromServer, setHasLoadedFromServer\].*?setHasLoadedFromServer\(true\);\s*\}\s*\}, \[.*?\]\);"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)
print("Removed hacky sync from SecretAdminPage")
