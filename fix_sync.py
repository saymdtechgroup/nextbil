import re

with open("server.ts", "r") as f:
    content = f.read()

# Let's check how the backend saves config
