import re

with open("server.ts", "r") as f:
    content = f.read()

# I want to add the phase progression logic directly into /api/presale/buy
# It should happen after recording the transaction and before updating the user investment.

new_logic = """
      // Record transaction
      const [tx] = await db.insert(transactions).values({
        userId: user.id,
        type: 'buy_presale',
        amountUsdt: Number(amountUsdt),
        tokenAmount: Number(tokenAmount),
        tokenPrice: Number(tokenPrice || 0.10),
        phaseIndex: Number(phaseIndex || 1),
        status: 'completed',
        txHash: confirmedTxHash,
      }).returning();

      // --- SERVER-SIDE PHASE PROGRESSION ---
      try {
        const configRecord = await db.query.systemConfigs.findFirst({
            where: eq(systemConfigs.key, 'phases')
        });
        if (configRecord && configRecord.value) {
            const phases = JSON.parse(configRecord.value);
            const activeIdx = phases.findIndex((p: any) => p.status === 'active');
            if (activeIdx !== -1) {
                const currentP = phases[activeIdx];
                const newSold = currentP.tokensSold + Number(tokenAmount);
                if (newSold >= currentP.totalSupply) {
                    phases[activeIdx].tokensSold = currentP.totalSupply;
                    phases[activeIdx].status = 'completed';
                    if (activeIdx + 1 < phases.length) {
                        phases[activeIdx + 1].status = 'active';
                        phases[activeIdx + 1].tokensSold = 0;
                    }
                } else {
                    phases[activeIdx].tokensSold = newSold;
                }
                await db.update(systemConfigs).set({ value: JSON.stringify(phases), updatedAt: new Date() }).where(eq(systemConfigs.key, 'phases'));
                console.log(`[API] Phase progression updated safely in DB. Phase ${currentP.id} Sold: ${newSold}`);
            }
        }
      } catch (phaseErr) {
        console.error("Error updating phase progression in DB:", phaseErr);
      }
      // --- END PHASE PROGRESSION ---

      // Update user investment & qualification
"""

content = re.sub(r'      // Record transaction.*?// Update user investment & qualification', new_logic, content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
print("Patched presale logic")
