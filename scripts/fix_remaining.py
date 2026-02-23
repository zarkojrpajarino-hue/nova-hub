import re, os

FUNCS_DIR = "C:/Users/Zarko/nova-hub/supabase/functions"

WITH_USER_ID = {
    "ai-career-coach","ai-lead-finder","ai-task-executor","ai-task-router",
    "auto-sync-finances","enrich-project-intelligence","generate-actionable-insights",
    "generate-business-ideas","generate-complete-business","generate-learning-path",
    "generate-playbook","generate-predictions","generate-role-questions-v2",
    "generate-tasks-v2","prepare-one-on-one","suggest-optimal-schedule","sync-stripe",
}

def read_file(p):
    with open(p,"r",encoding="utf-8") as f: return f.read()

def write_file(p, content):
    with open(p,"w",encoding="utf-8",newline="\n") as f: f.write(content)

def fix_duplicate_origin(content):
    lines = content.splitlines(keepends=True)
    seen_origin = False
    result = []
    for line in lines:
        stripped = line.strip()
        is_origin = (
            stripped == "const origin = req.headers.get('Origin');" or
            stripped == 'const origin = req.headers.get("Origin");' or
            stripped == "const origin = req.headers.get('origin');" or
            stripped == 'const origin = req.headers.get("origin");'
        )
        if is_origin:
            if not seen_origin:
                normalized = line.replace("get('origin')", "get('Origin')")
                result.append(normalized)
                seen_origin = True
        else:
            result.append(line)
    return "".join(result)


def fix_inline_options_handler(content):
    NEW_HANDLER = "  if (req.method === 'OPTIONS') {\n    return handleCorsPreflightRequest(origin);\n  }"
    if "handleCorsPreflightRequest(origin)" in content:
        return content
    pat_start = re.compile(r"if \(req\.method === ['\"]OPTIONS['\"]\) \{")
    m = pat_start.search(content)
    if not m:
        return content
    start = m.start()
    pos = m.end()
    depth = 1
    while pos < len(content) and depth > 0:
        if content[pos] == "{":
            depth += 1
        elif content[pos] == "}":
            depth -= 1
        pos += 1
    end = pos
    block = content[start:end]
    if "return new Response" in block or "return handleCorsPreflightRequest" in block:
        content = content[:start] + NEW_HANDLER + content[end:]
    return content

def fix_cors_headers_var_usage(content):
    lines = content.splitlines(keepends=True)
    result = []
    for line in lines:
        stripped = line.strip()
        if stripped == "const corsHeaders = getCorsHeaders(origin);":
            continue
        result.append(line)
    content = "".join(result)
    content = re.sub(r',\s*corsHeaders\)', ", getCorsHeaders(origin))", content)
    content = re.sub(r"headers:\s*corsHeaders\b",
                     "headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }",
                     content)
    return content

def add_auth_import_if_missing(content, has_user_id):
    if "auth.ts" in content:
        return content
    if "validateAuth" not in content:
        return content
    AUTH_WITH = "import { validateAuthWithUserId } from '../_shared/auth.ts';"
    AUTH_WO   = "import { validateAuth } from '../_shared/auth.ts';"
    auth_import = AUTH_WITH if has_user_id else AUTH_WO
    cors_line = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
    if cors_line in content:
        content = content.replace(cors_line, cors_line + "\n" + auth_import, 1)
    else:
        m = re.search(r'^import .+$', content, re.MULTILINE)
        if m:
            old = m.group(0)
            content = content.replace(old, old + "\n" + auth_import, 1)
    return content

def fix_generate_playbook(content):
    AUTH_WO = "import { validateAuth } from '../_shared/auth.ts';"
    if "auth.ts" not in content:
        cors_line = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
        if cors_line in content:
            content = content.replace(cors_line, cors_line + "\n" + AUTH_WO, 1)
    return content

def fix_generate_role_questions_v2(content):
    AUTH_WO = "import { validateAuth } from '../_shared/auth.ts';"
    if "auth.ts" not in content:
        cors_line = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
        if cors_line in content:
            content = content.replace(cors_line, cors_line + "\n" + AUTH_WO, 1)
    if "validateAuth" not in content:
        alt = re.search(r'(return handleCorsPreflightRequest\(origin\);\s*\})', content)
        if alt:
            insert_pos = alt.start() + len(alt.group(0))
            AUTH_LINE = "\n    const { serviceClient: supabaseClient } = await validateAuth(req);"
            content = content[:insert_pos] + AUTH_LINE + content[insert_pos:]
    return content

def fix_generate_tasks_v2(content):
    AUTH_WO = "import { validateAuth } from '../_shared/auth.ts';"
    if "auth.ts" not in content:
        cors_line = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
        if cors_line in content:
            content = content.replace(cors_line, cors_line + "\n" + AUTH_WO, 1)
        else:
            m = re.search(r'^import .+$', content, re.MULTILINE)
            if m:
                old = m.group(0)
                content = content.replace(old, old + "\n" + AUTH_WO, 1)
    return content


def process(func_name, path):
    content = read_file(path)
    changes = []
    original = content

    new = fix_duplicate_origin(content)
    if new != content:
        changes.append("  Fixed duplicate origin line")
        content = new

    new = fix_inline_options_handler(content)
    if new != content:
        changes.append("  Replaced inline OPTIONS handler")
        content = new

    new = fix_cors_headers_var_usage(content)
    if new != content:
        changes.append("  Fixed corsHeaders variable usages")
        content = new

    if func_name == "generate-playbook":
        new = fix_generate_playbook(content)
        if new != content:
            changes.append("  Fixed generate-playbook auth import")
            content = new
    elif func_name == "generate-role-questions-v2":
        new = fix_generate_role_questions_v2(content)
        if new != content:
            changes.append("  Fixed generate-role-questions-v2")
            content = new
    elif func_name == "generate-tasks-v2":
        new = fix_generate_tasks_v2(content)
        if new != content:
            changes.append("  Fixed generate-tasks-v2 auth import")
            content = new
    else:
        has_user_id = func_name in WITH_USER_ID
        new = add_auth_import_if_missing(content, has_user_id)
        if new != content:
            changes.append("  Added auth.ts import")
            content = new

    if content != original:
        write_file(path, content)
        for c in changes:
            print(c)
    else:
        print("  No changes needed")


def main():
    SKIP = {"_shared","generate-email-pitch","tests","competitor-intelligence-cron","seed-projects","seed-users","deploy-to-vercel"}
    func_dirs = sorted([d for d in os.listdir(FUNCS_DIR)
                        if os.path.isdir(os.path.join(FUNCS_DIR,d)) and d not in SKIP])

    print("=" * 60)
    print("Running fix_remaining.py")
    print("=" * 60)

    for fn in func_dirs:
        path = os.path.join(FUNCS_DIR, fn, "index.ts")
        if not os.path.exists(path): continue
        print("\n>>> {}".format(fn))
        try:
            process(fn, path)
        except Exception as e:
            print("  ERROR: {}".format(e))
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print("Done.")

if __name__ == "__main__":
    main()
