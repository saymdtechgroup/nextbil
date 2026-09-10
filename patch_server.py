import re

with open("server.ts", "r") as f:
    content = f.read()

# Remove inMemoryConfigs initialization
content = re.sub(r'let inMemoryConfigs: \{.*?\};\s*', '', content, flags=re.DOTALL)

# Update GET /api/admin/configs
new_get = """app.get("/api/admin/configs", async (req, res) => {
    try {
      let dbConfigs: Record<string, any> = {};
      const rows = await db.select().from(systemConfigs);
      for (const row of rows) {
        try {
          dbConfigs[row.key] = JSON.parse(row.value);
        } catch {
          dbConfigs[row.key] = row.value;
        }
      }
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
content = re.sub(r'app\.get\("/api/admin/configs", async \(req, res\) => \{.*?(?=\s*// Save Live System & Admin Configs)/api/admin/configs.*?\} catch \(error: any\) \{\s*res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);', new_get, content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)
print("Patched server.ts")
