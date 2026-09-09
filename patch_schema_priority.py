import re
with open("src/db/schema.ts", "r") as f:
    content = f.read()

target = """  status: text('status').notNull().default('open'), // 'open', 'partially_filled', 'completed', 'cancelled'"""
replace = """  status: text('status').notNull().default('open'), // 'open', 'partially_filled', 'completed', 'cancelled'
  priority: integer('priority').notNull().default(0),"""
content = content.replace(target, replace)

with open("src/db/schema.ts", "w") as f:
    f.write(content)
print("Added priority to schema")
