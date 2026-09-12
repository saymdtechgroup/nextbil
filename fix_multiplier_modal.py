import re

with open("src/components/AdminPanelModal.tsx", "r") as f:
    content = f.read()

pattern = r"\s*\{\/\* Multiplier / Label tag \*\/\}\s*<div>\s*<label.*?Multiplier / Tag Text.*?</label>\s*<input.*?value=\{phase\.multiplier\}.*?/>\s*</div>"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/components/AdminPanelModal.tsx", "w") as f:
    f.write(content)
print("Removed Multiplier from AdminPanelModal")
