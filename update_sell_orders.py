import re

with open("src/db/schema.ts", "r") as f:
    content = f.read()

target = """  amountTokens: doublePrecision('amount_tokens').notNull(),"""
replace = """  phaseNumber: integer('phase_number').notNull().default(1),
  amountTokens: doublePrecision('amount_tokens').notNull(),"""

content = content.replace(target, replace)

with open("src/db/schema.ts", "w") as f:
    f.write(content)
print("Updated schema.ts")
