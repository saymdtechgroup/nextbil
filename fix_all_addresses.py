import os

old_address = "0x8eF229597756a7bfb7Da80c0d86596D7bD366007"
new_address = "0xB44dC2107438D3f98e5A0784fBC6C6a2Ad843bd1"

files_to_check = [
    "server.ts",
    "src/App.tsx",
    "src/components/SecretAdminPage.tsx",
    "src/components/AdminPanelModal.tsx",
]

for file_path in files_to_check:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r") as f:
        content = f.read()
    
    if old_address in content:
        content = content.replace(old_address, new_address)
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Replaced address in {file_path}")

print("Done")
