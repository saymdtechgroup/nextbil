import sys

with open('src/components/ScreenOneAcquisition.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="flex items-baseline gap-1.5 mt-0.5">',
    '<div className="flex items-center gap-1.5 mt-0.5">'
)

content = content.replace(
    'USD / NXBC',
    'USD/NXBC'
)

with open('src/components/ScreenOneAcquisition.tsx', 'w') as f:
    f.write(content)
