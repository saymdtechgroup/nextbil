import re

with open("server.ts", "r") as f:
    content = f.read()

target = """  // Admin update sell queue manually"""
replace = """  // Admin User Search / Management
  app.get("/api/admin/users/search", async (req, res) => {
    try {
      const { query } = req.query;
      let conditions = [];
      if (query) {
         const q = String(query).toLowerCase();
         // If we had ilike we could use it, for now we will fetch all and filter if needed, 
         // but let's just do a simple fetch since this is a prototype
         // Better: 
         const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
         const filtered = allUsers.filter(u => 
            (u.walletAddress && u.walletAddress.toLowerCase().includes(q)) || 
            (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
            (u.referredBy && u.referredBy.toLowerCase().includes(q))
         );
         return res.json({ users: filtered });
      } else {
         const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(50);
         return res.json({ users: allUsers });
      }
    } catch(e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  // Admin update sell queue manually"""

content = content.replace(target, replace)

with open("server.ts", "w") as f:
    f.write(content)

print("Added admin user search API")
