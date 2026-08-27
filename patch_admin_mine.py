import sys

with open('src/components/ScreenMine.tsx', 'r') as f:
    content = f.read()

content = content.replace("Secret Admin Control Page", "Secret Manager Control Page")

with open('src/components/ScreenMine.tsx', 'w') as f:
    f.write(content)
