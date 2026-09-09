with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

target = """  const [simBuyAmount, setSimBuyAmount] = useState<number>(500);"""
replacement = """  const [simBuyAmount, setSimBuyAmount] = useState<number>(500);
  const [queueSearch, setQueueSearch] = useState<string>('');"""

if target in content:
    with open("src/components/SecretAdminPage.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced state!")
else:
    print("Target not found")
