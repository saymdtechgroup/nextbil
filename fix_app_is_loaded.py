import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add isConfigLoaded state
content = content.replace(
    "const [phases, setPhases] = useState<PhaseConfig[]>(INITIAL_PHASES);",
    "const [phases, setPhases] = useState<PhaseConfig[]>(INITIAL_PHASES);\n  const [isConfigLoaded, setIsConfigLoaded] = useState(false);"
)

# Set isConfigLoaded(true) in fetchLatestServerConfigs
pattern_fetch = r"(if \(data\?\.success\) \{.*?setMatrixConfig\(data\.matrixConfig\);\s*\n\s*\})"
content = re.sub(pattern_fetch, r"\1\n          setIsConfigLoaded(true);", content, flags=re.DOTALL)

# Also set to true in catch block just in case it fails so app isn't stuck
content = re.sub(r"\} catch \(err\) \{\}", "} catch (err) { setIsConfigLoaded(true); }", content)

# Change rendering of SecretAdminPage
pattern_render = r"if \(showSecretAdminPage \|\| activeSingleScreen === 'admin'\) \{\s*return \(\s*<SecretAdminPage"
replacement = """
  if (showSecretAdminPage || activeSingleScreen === 'admin') {
    if (!isConfigLoaded) {
      return <div className="min-h-screen bg-[#06020c] flex items-center justify-center text-amber-500 font-mono-crypto">LOADING SECURE PORTAL...</div>;
    }
    return (
      <SecretAdminPage
"""
content = re.sub(pattern_render, replacement, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Added isConfigLoaded")
