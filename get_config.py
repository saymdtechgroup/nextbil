import re

with open("server.ts", "r") as f:
    content = f.read()

print("Found systemConfigs usage")
