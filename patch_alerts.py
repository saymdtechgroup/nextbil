import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target1 = """    if (systemConfig.presalePaused) {
      alert('Presale is currently paused by the System.');
      return;
    }"""
replace1 = """    if (systemConfig.presalePaused) {
      throw new Error('Presale is currently paused by the System.');
    }"""
content = content.replace(target1, replace1)

target2 = """    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) {
      alert('Presale has ended or no active phase available.');
      return;
    }"""
replace2 = """    const activeIdx = phases.findIndex((p) => p.status === 'active');
    if (activeIdx === -1) {
      throw new Error('Presale has ended or no active phase available.');
    }"""
content = content.replace(target2, replace2)

target3 = """    if (tokenAmount > maxAvailable) {
      alert(
        `Strict Limit Exceeded: You cannot purchase more coins than the limit allocated by the System (${currentP.totalSupply.toLocaleString()} ${systemConfig.tokenSymbol}). Only ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol} are remaining in this phase.`
      );
      return;
    }"""
replace3 = """    if (tokenAmount > maxAvailable) {
      throw new Error(
        `Strict Limit Exceeded: You cannot purchase more coins than the limit allocated by the System (${currentP.totalSupply.toLocaleString()} ${systemConfig.tokenSymbol}). Only ${maxAvailable.toLocaleString()} ${systemConfig.tokenSymbol} are remaining in this phase.`
      );
    }"""
content = content.replace(target3, replace3)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patched alerts to throws in App.tsx")
