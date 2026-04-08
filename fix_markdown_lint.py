import re
import sys

def fix_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
        # Fix table separators: |---| to | --- |
        if re.match(r'^\|[-:|]+\|$', line.strip()):
            fixed_line = re.sub(r'(-+)', r' \1 ', line)
            # Clean up double spaces if any
            fixed_line = re.sub(r'\s+', ' ', fixed_line).strip()
            # Ensure it starts and ends with pipes and correct spacing
            parts = fixed_line.split('|')
            parts = [p.strip() for p in parts]
            fixed_line = '| ' + ' | '.join(parts[1:-1]) + ' |\n'
            new_lines.append(fixed_line)
        else:
            new_lines.append(line)

    # Secondary pass for blank lines
    final_lines = []
    for i, line in enumerate(new_lines):
        # Header MD022: Add blank line BEFORE if missing
        if re.match(r'^#{1,6}\s', line) and i > 0 and final_lines[-1].strip() != '' and final_lines[-1].strip() != '---':
             final_lines.append('\n')
        
        final_lines.append(line)
        
        # Header MD022: Add blank line AFTER if missing
        if re.match(r'^#{1,6}\s', line) and i < len(new_lines) - 1 and new_lines[i+1].strip() != '':
            final_lines.append('\n')

    # Fix code blocks blank lines MD031
    temp_lines = final_lines
    final_lines = []
    for i, line in enumerate(temp_lines):
        if line.startswith('```') and i > 0 and final_lines[-1].strip() != '':
            final_lines.append('\n')
        final_lines.append(line)
        if line.startswith('```') and i < len(temp_lines) - 1 and temp_lines[i+1].strip() != '':
            final_lines.append('\n')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        fix_markdown(arg)
