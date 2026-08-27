import sys

filepath = 'src/components/MatrixPlanModal.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_line = "Upar ke sabhi <strong>10 Level Uplines</strong> ko is ${basePlacementUsd.toFixed(2)} of <strong>{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)</strong> </strong>!"
good_line = "All <strong>10 Level Uplines</strong> above will receive <strong>{uplinePercent}% (${uplineAmountPerLevel.toFixed(2)} each)</strong> from this ${basePlacementUsd.toFixed(2)}!"

content = content.replace(bad_line, good_line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
