import os

replacements = {
    'âš ï¸ ': '??',
    'â€”': '—',
    'ðŸ—ºï¸ ': '???',
    'ðŸ“‹': '??',
    'ðŸ“ ': '??',
    'â† ': '?',
    'ðŸ“·': '??',
    'ðŸ“¸': '??',
    'âœ“': '?',
    'ðŸ’¾': '??',
    'ðŸ“¤': '??'
}

file = 'frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx'
with open(file, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed FieldOfficerDashboard')
