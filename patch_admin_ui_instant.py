import re

with open("src/components/SecretAdminPage.tsx", "r") as f:
    content = f.read()

# Add the instant fulfill button
t1 = """                            {/* Move Up 1 Step */}
                            <button
                              disabled={idx === 0}"""

r1 = """                            {/* Instant Fulfill Order */}
                            <button
                              onClick={async () => {
                                 if (!confirm('Instantly fulfill this specific order? The user will be paid out immediately.')) return;
                                 try {
                                    const res = await fetch('/api/admin/sellqueue/instant-fulfill', {
                                       method: 'POST',
                                       headers: { 'Content-Type': 'application/json' },
                                       body: JSON.stringify({ orderId: entry.id })
                                    });
                                    if (res.ok) {
                                       if (onUpdateSellQueue && sellQueue) {
                                          const newQueue = [...sellQueue];
                                          newQueue[idx].tokensSold = newQueue[idx].tokensRequested;
                                          onUpdateSellQueue(newQueue);
                                       }
                                    }
                                 } catch(e) {}
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
                              title="Instantly fulfill and payout this user"
                            >
                              ⚡ Instant Fulfill
                            </button>

                            {/* Move Up 1 Step */}
                            <button
                              disabled={idx === 0}"""
content = content.replace(t1, r1)

with open("src/components/SecretAdminPage.tsx", "w") as f:
    f.write(content)

print("Added instant fulfill button to UI")
