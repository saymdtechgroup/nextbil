import sys

def replace_all(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # UI Text Replacements
    content = content.replace("Secret Admin Portal", "Secret Manager Portal")
    content = content.replace("Admin Testing Sandbox", "System Testing Sandbox")
    content = content.replace("Admin changes", "System changes")
    content = content.replace("admin testing", "system testing")
    content = content.replace("Admin Treasury", "System Treasury")
    content = content.replace("Admin Control Engine", "System Control Engine")
    
    content = content.replace("SECRET ADMIN VAULT", "SECRET MANAGER VAULT")
    content = content.replace("NXBC MASTER ADMIN CONTROL CENTER", "NXBC MASTER SYSTEM CONTROL CENTER")
    content = content.replace("Lock Admin Vault", "Lock System Vault")
    content = content.replace("Admin parameters", "System parameters")
    content = content.replace("Admin treasury", "System treasury")
    
    # Just in case there are others
    content = content.replace("Admin har ek level ka alag percentage aur direct member unlock requirement set kar sakta hai", "System can set different percentages and direct member unlock requirements for each level")
    content = content.replace("Tamam Admin Settings live app me update ho chuki hain!", "All System Settings have been updated in the live app!")

    with open(filename, 'w') as f:
        f.write(content)

replace_all('src/components/AdminPanelModal.tsx')
replace_all('src/components/SecretAdminPage.tsx')

