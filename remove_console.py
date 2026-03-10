import re
import os
import subprocess

def remove_console_statements(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    original = content

    lines = content.split('\n')
    result_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if line starts a console statement
        if re.match(r'^\s*console\.(log|error|warn|debug|info|group|groupEnd|groupCollapsed|table|time|timeEnd|assert)\s*[(\`]', line):
            # Count parentheses to handle multi-line calls
            open_count = line.count('(') - line.count(')')

            if open_count <= 0:
                # Single-line console call - skip it
                i += 1
                continue
            else:
                # Multi-line console call - collect all lines until balanced
                j = i + 1
                while j < len(lines) and open_count > 0:
                    open_count += lines[j].count('(') - lines[j].count(')')
                    j += 1
                # Skip all collected lines
                i = j
                continue

        result_lines.append(line)
        i += 1

    new_content = '\n'.join(result_lines)

    # Clean up excessive blank lines (more than 2 consecutive)
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)

    if new_content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def convert_path(p):
    """Convert /c/Users/... to C:/Users/... for Windows Python"""
    if p.startswith('/c/'):
        return 'C:/' + p[3:]
    return p

# Find all affected files using grep
result = subprocess.run(
    ['grep', '-rl', 'console.', '/c/Users/Zarko/nova-hub/src/', '--include=*.ts', '--include=*.tsx'],
    capture_output=True, text=True
)
files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]

print(f"Found {len(files)} files with console statements")

changed = 0
errors = 0
for file_path in files:
    win_path = convert_path(file_path)
    if os.path.exists(win_path):
        if remove_console_statements(win_path):
            changed += 1
            print(f"  cleaned: {file_path}")
    else:
        print(f"  NOT FOUND: {win_path}")
        errors += 1

print(f"\nTotal files modified: {changed}")
print(f"Total errors: {errors}")
