import re
import os
import subprocess

def convert_path(p):
    if p.startswith('/c/'):
        return 'C:/' + p[3:]
    return p

def fix_unused_catch_errors(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    original = content
    lines = content.split('\n')
    result_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Find catch (error) line
        if re.search(r'catch\s*\(error\)\s*\{', line):
            # Collect the catch block
            brace_count = line.count('{') - line.count('}')
            j = i + 1
            block_lines = [line]

            while j < len(lines) and brace_count > 0:
                block_lines.append(lines[j])
                brace_count += lines[j].count('{') - lines[j].count('}')
                j += 1

            # Check if 'error' is used in the block body (excluding the catch declaration line)
            block_body = '\n'.join(block_lines[1:])

            # Remove comments
            body_no_comments = re.sub(r'//.*', '', block_body)
            body_no_comments = re.sub(r'/\*.*?\*/', '', body_no_comments, flags=re.DOTALL)

            if not re.search(r'\berror\b', body_no_comments):
                # Rename error to _error in the catch declaration
                new_line = re.sub(r'catch\s*\(error\)', 'catch (_error)', line)
                result_lines.append(new_line)
            else:
                result_lines.append(line)
        else:
            result_lines.append(line)

        i += 1

    new_content = '\n'.join(result_lines)

    if new_content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

# Find all files with catch (error)
result = subprocess.run(
    ['grep', '-rl', 'catch (error)', '/c/Users/Zarko/nova-hub/src/', '--include=*.ts', '--include=*.tsx'],
    capture_output=True, text=True
)
files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]

print(f"Checking {len(files)} files...")

changed = 0
for file_path in files:
    win_path = convert_path(file_path)
    if os.path.exists(win_path):
        if fix_unused_catch_errors(win_path):
            changed += 1
            print(f"  fixed: {file_path}")

print(f"\nTotal files modified: {changed}")
