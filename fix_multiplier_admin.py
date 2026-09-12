import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Replace multiplier block with nothing
pattern = r"\s*\{\/\* Multiplier \*\/\}\s*<div>\s*<label.*?Multiplier / Gain.*?</label>\s*<input.*?value=\{phase\.multiplier\}.*?/>\s*</div>"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)
print("Removed Multiplier from SecretAdminPage")
