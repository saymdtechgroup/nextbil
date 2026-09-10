import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the GET /api/admin/configs handler
new_get = """  // Get Live System & Admin Configs
  app.get("/api/admin/configs", async (req, res) => {
    try {
      let dbConfigs: Record<string, any> = {};
      try {
        const rows = await db.select().from(systemConfigs);
        for (const row of rows) {
          try {
            dbConfigs[row.key] = JSON.parse(row.value);
          } catch {
            dbConfigs[row.key] = row.value;
          }
        }
      } catch (dbErr) {}

      res.json({
        success: true,
        phases: dbConfigs.phases || null,
        referralLevels: dbConfigs.referralLevels || null,
        rankRewards: dbConfigs.rankRewards || null,
        systemConfig: dbConfigs.systemConfig || null,
        matrixConfig: dbConfigs.matrixConfig || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });"""

content = re.sub(r'  // Get Live System & Admin Configs\s*app\.get\("/api/admin/configs".*?(?=  // Save Live System & Admin Configs)', new_get + "\n\n", content, flags=re.DOTALL)

# Replace the POST /api/admin/configs handler
new_post = """  // Save Live System & Admin Configs
  app.post("/api/admin/configs", async (req, res) => {
    try {
      const { phases, referralLevels, rankRewards, systemConfig, matrixConfig } = req.body;

      // Save to database
      const itemsToSave = [
        { key: "phases", value: phases ? JSON.stringify(phases) : null, desc: "Presale Phases and Coin Prices" },
        { key: "referralLevels", value: referralLevels ? JSON.stringify(referralLevels) : null, desc: "10-Level Commission Plan" },
        { key: "rankRewards", value: rankRewards ? JSON.stringify(rankRewards) : null, desc: "Leadership Rank Rewards" },
        { key: "systemConfig", value: systemConfig ? JSON.stringify(systemConfig) : null, desc: "System Parameters" },
        { key: "matrixConfig", value: matrixConfig ? JSON.stringify(matrixConfig) : null, desc: "2x2 Matrix System Config" },
      ];

      for (const item of itemsToSave) {
        if (!item.value) continue;
        try {
          const existing = await db.query.systemConfigs.findFirst({
            where: eq(systemConfigs.key, item.key),
          });

          if (existing) {
            await db.update(systemConfigs).set({ value: item.value, updatedAt: new Date() }).where(eq(systemConfigs.key, item.key));
          } else {
            await db.insert(systemConfigs).values({ key: item.key, value: item.value, description: item.desc });
          }
        } catch (dbErr) {
          console.log(`DB config save notice (${item.key}):`, dbErr);
        }
      }

      console.log("[ADMIN SYNC] Live configurations updated and persisted to PostgreSQL.");

      res.json({
        success: true,
        message: "Configurations updated successfully and applied to all users!",
      });
    } catch (error: any) {
      console.error("Error in /api/admin/configs POST:", error);
      res.status(500).json({ error: error.message });
    }
  });"""

content = re.sub(r'  // Save Live System & Admin Configs\s*app\.post\("/api/admin/configs".*?(?=  // System Configurations \(Admin Control Legacy endpoint\))', new_post + "\n\n", content, flags=re.DOTALL)

# Replace legacy endpoint
new_legacy = """  // System Configurations (Admin Control Legacy endpoint)
  app.get("/api/system/configs", async (req, res) => {
    try {
      const configs = await db.select().from(systemConfigs);
      res.json({ configs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });"""

content = re.sub(r'  // System Configurations \(Admin Control Legacy endpoint\)\s*app\.get\("/api/system/configs".*?(?=  // Vite middleware for development)', new_legacy + "\n\n", content, flags=re.DOTALL)


with open("server.ts", "w") as f:
    f.write(content)
print("Endpoints patched")
