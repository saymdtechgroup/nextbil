import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("paused by the Admin", "paused by the System")
content = content.replace("allocated by the Admin", "allocated by the System")

with open('src/App.tsx', 'w') as f:
    f.write(content)
