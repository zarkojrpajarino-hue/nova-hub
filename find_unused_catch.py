import re
import os
import subprocess

def convert_path(p):
    if p.startswith('/c/'):
        return 'C:/' + p[3:]
    return p

# Find all files with catch (error)
result = subprocess.run(
    ['grep', '-rl', 'catch (error)', '/c/Users/Zarko/nova-hub/src/', '--include=*.ts', '--include=*.tsx'],
    capture_output=True, text=True
)
files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]

unused_catch = []

for file_path in files:
    win_path = convert_path(file_path)
    if not os.path.exists(win_path):
        continue

    with open(win_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.split('\n')

    i = 0
    while i < len(lines):
        line = lines[i]
        # Find catch (error) line
        if re.search(r'catch\s*\(error\)\s*\{', line):
            # Collect the catch block
            catch_start = i
            brace_count = line.count('{') - line.count('}')
            j = i + 1
            block_lines = [line]

            while j < len(lines) and brace_count > 0:
                block_lines.append(lines[j])
                brace_count += lines[j].count('{') - lines[j].count('}')
                j += 1

            # Check if 'error' is used in the block (excluding the catch declaration line itself)
            block_body = '\n'.join(block_lines[1:])  # skip the catch (...) { line

            # Check if error variable is actually referenced
            # Look for: error (as a word, not in comments)
            # Filter out comment-only lines
            body_no_comments = re.sub(r'//.*', '', block_body)
            body_no_comments = re.sub(r'/\*.*?\*/', '', body_no_comments, flags=re.DOTALL)

            if not re.search(r'\berror\b', body_no_comments):
                unused_catch.append((file_path, catch_start + 1, line.strip()))

        i += 1

print(f"Found {len(unused_catch)} catch blocks with unused 'error' variable:\n")
for fp, lineno, line in unused_catch:
    print(f"  {fp}:{lineno}  {line}")
