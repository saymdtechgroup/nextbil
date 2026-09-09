import re

with open("server.ts", "r") as f:
    content = f.read()

matrix_logic = """          currentSponsorCode = uplineUser.referredBy;
        }
      }

      // --- START AUTO-PLACEMENT AND MATRIX LOGIC ---
      if (!wasMlmQualified && isNowMlmQualified) {
        // 1. Update Direct Sponsor Count & Team Counts
        if (user.referredBy) {
          const sponsor = await db.query.users.findFirst({ where: eq(users.referralCode, user.referredBy) });
          if (sponsor) {
            await db.update(users).set({ directCount: sponsor.directCount + 1 }).where(eq(users.id, sponsor.id));
            let tempCode: string | null = user.referredBy;
            while (tempCode) {
              const up = await db.query.users.findFirst({ where: eq(users.referralCode, tempCode) });
              if (!up) break;
              await db.update(users).set({ totalTeamCount: up.totalTeamCount + 1 }).where(eq(users.id, up.id));
              tempCode = up.referredBy;
            }
          }
        }

        // 2. BFS Matrix Tree Auto-Placement
        let sponsorNodeId = null;
        if (user.referredBy) {
          const sp = await db.query.users.findFirst({ where: eq(users.referralCode, user.referredBy) });
          if (sp) {
             const spNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.userId, sp.id) });
             if (spNode) sponsorNodeId = spNode.id;
          }
        }

        const existingNodes = await db.select({ id: matrixNodes.id }).from(matrixNodes).limit(1);
        let placementParentId = null;
        
        if (existingNodes.length > 0) {
            let startNodeId = sponsorNodeId;
            if (!startNodeId) {
               const rootNode = await db.query.matrixNodes.findFirst({ orderBy: asc(matrixNodes.id) });
               startNodeId = rootNode?.id || null;
            }
            if (startNodeId) {
              const queue = [startNodeId];
              while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = await db.select().from(matrixNodes).where(eq(matrixNodes.parentId, currentId)).orderBy(asc(matrixNodes.position));
                if (children.length < 2) {
                  placementParentId = currentId;
                  break;
                }
                for (const child of children) {
                  queue.push(child.id);
                }
              }
            }
        }

        const childrenCount = placementParentId ? (await db.select().from(matrixNodes).where(eq(matrixNodes.parentId, placementParentId))).length : 0;
        const newPosition = childrenCount + 1;
        let newLevel = 1;
        if (placementParentId) {
           const pNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.id, placementParentId) });
           if (pNode) newLevel = pNode.level + 1;
        }

        const [newMatrixNode] = await db.insert(matrixNodes).values({
          userId: user.id,
          parentId: placementParentId,
          level: newLevel,
          position: newPosition,
          isAutoUpgraded: false,
          earnedFromMatrix: 0
        }).returning();

        await db.update(users).set({ isMatrixActive: true, matrixLevel: 1 }).where(eq(users.id, user.id));

        // 3. Matrix Placement Income Distribution Upward (e.g. $1 per level up to 10 levels)
        let mIncomeUsd = 1.00;
        let currentMatrixParentId = placementParentId;
        let matrixLvl = 1;
        while (currentMatrixParentId && matrixLvl <= 10) {
           const parentMatrixNode = await db.query.matrixNodes.findFirst({ where: eq(matrixNodes.id, currentMatrixParentId) });
           if (!parentMatrixNode) break;
           
           const uplineUser = await db.query.users.findFirst({ where: eq(users.id, parentMatrixNode.userId) });
           if (uplineUser && uplineUser.isMlmQualified) {
              await db.insert(levelEarnings).values({
                beneficiaryId: uplineUser.id,
                sourceUserId: user.id,
                levelNumber: matrixLvl,
                percentage: 0,
                commissionUsdt: mIncomeUsd,
                txType: 'matrix_join',
              });
              await db.update(users)
                 .set({
                    totalEarnedUsdt: uplineUser.totalEarnedUsdt + mIncomeUsd,
                    availableUsdt: uplineUser.availableUsdt + mIncomeUsd,
                    updatedAt: new Date()
                 }).where(eq(users.id, uplineUser.id));
              
              await db.update(matrixNodes).set({
                 earnedFromMatrix: parentMatrixNode.earnedFromMatrix + mIncomeUsd
              }).where(eq(matrixNodes.id, parentMatrixNode.id));
           }
           
           currentMatrixParentId = parentMatrixNode.parentId;
           matrixLvl++;
        }
      }
      // --- END AUTO-PLACEMENT AND MATRIX LOGIC ---

      // Automated On-Chain Token Transfer to User's Web3 Wallet (SafePal / Trust Wallet / MetaMask)"""

target = """          currentSponsorCode = uplineUser.referredBy;
        }
      }

      // Automated On-Chain Token Transfer to User's Web3 Wallet (SafePal / Trust Wallet / MetaMask)"""

content = content.replace(target, matrix_logic)

with open("server.ts", "w") as f:
    f.write(content)

print("Replaced!")
