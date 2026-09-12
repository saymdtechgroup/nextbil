import re

# Fix App.tsx
with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove the early return that prevents fetching config when on admin page
# It looks like:
#      if (
#        typeof window !== 'undefined' &&
#        (window.location.hash.toLowerCase().includes('admin') ||
#          window.location.pathname.toLowerCase().includes('admin') ||
#          window.location.search.toLowerCase().includes('admin'))
#      ) {
#        return;
#      }
pattern = r"if\s*\(\s*typeof window !== 'undefined' &&\s*\(\s*window\.location\.hash\.toLowerCase\(\)\.includes\('admin'\).*?return;\s*\}"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed App.tsx")
