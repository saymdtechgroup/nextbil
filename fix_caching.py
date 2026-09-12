import re

with open("server.ts", "r") as f:
    content = f.read()

replacement = """const app = express();
const PORT = 3000;

// Add Cache-Busting Middleware to prevent TrustWallet/SafePal from caching API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});
"""

content = content.replace("const app = express();\nconst PORT = 3000;", replacement)

with open("server.ts", "w") as f:
    f.write(content)
print("Added cache-busting headers to API routes")
