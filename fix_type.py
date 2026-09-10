import re

with open("src/types/crypto.ts", "r") as f:
    content = f.read()

content = content.replace("status: 'active' | 'completed' | 'locked';", "status: 'active' | 'completed' | 'locked' | 'upcoming';")

with open("src/types/crypto.ts", "w") as f:
    f.write(content)
print("Fixed type error")
