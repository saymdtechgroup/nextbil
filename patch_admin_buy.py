import sys

with open('src/components/BuyTokenModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("Admin Allotment", "System Allotment")
content = content.replace("Admin Phase Allotment", "System Phase Allotment")
content = content.replace("set by the Admin", "set by the System")

with open('src/components/BuyTokenModal.tsx', 'w') as f:
    f.write(content)
