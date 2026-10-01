import os

filepath = r'frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Ã¢Å¡Â Ã¯Â¸Â': '⚠️',
    'Ã¢â‚¬â€ ': '—',
    'Ã°Å¸â€”ÂºÃ¯Â¸Â': '🗺️',
    'Ã°Å¸â€œâ€¹': '📋',
    'Ã¢â€ Â ': '←',
    'Ã°Å¸â€œÂ·': '📷',
    'Ã°Å¸â€œÂ¸': '📸',
    'Ã¢Å“â€œ': '✓',
    'Ã°Å¸â€™Â¾': '💾',
    'Ã°Å¸â€œÂ¤': '📥'
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
