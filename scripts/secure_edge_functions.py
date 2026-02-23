#!/usr/bin/env python3
import re, os, sys

FUNCTIONS_DIR = "C:/Users/Zarko/nova-hub/supabase/functions"
SKIP_DIRS = {"_shared","generate-email-pitch","tests","competitor-intelligence-cron","seed-projects","seed-users","deploy-to-vercel"}
WITH_USER_ID = {"ai-career-coach","ai-lead-finder","ai-task-executor","ai-task-router","auto-sync-finances","enrich-project-intelligence","generate-actionable-insights","generate-business-ideas","generate-complete-business","generate-learning-path","generate-playbook","generate-predictions","generate-role-questions-v2","generate-tasks-v2","prepare-one-on-one","suggest-optimal-schedule","sync-stripe"}
CORS_ONLY = {"export-excel"}

def read_file(p):
    with open(p,"r",encoding="utf-8") as f: return f.read()

def write_file(p,content):
    with open(p,"w",encoding="utf-8",newline="\n") as f: f.write(content)

def count_cc(content):
    count=0
    for line in content.splitlines():
        s=line.strip()
        if s.startswith("import "): continue
        if "ReturnType<typeof createClient>" in s: continue
        count+=s.count("createClient(")
    return count


def step1_add_imports(content, func_name, has_user_id):
    changes = []
    CORS_IMP  = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
    AUTH_WITH = "import { validateAuthWithUserId } from '../_shared/auth.ts';"
    AUTH_WO   = "import { validateAuth } from '../_shared/auth.ts';"
    auth_imp  = AUTH_WITH if has_user_id else AUTH_WO
    cors_ok   = "cors-config.ts" in content
    auth_ok   = "auth.ts" in content
    if cors_ok and auth_ok:
        changes.append("  [STEP 1] Imports already present -- skipped")
        return content, changes
    pat = re.compile(
        r"(import \{ serve \} from ['\"]https://deno\.land/std@[^'\"]+/http/server\.ts['\"];)"
    )
    m = pat.search(content)
    if not m:
        changes.append("  [STEP 1] WARNING: could not find serve import -- imports not added")
        return content, changes
    to_add = []
    if not cors_ok: to_add.append(CORS_IMP)
    if not auth_ok: to_add.append(auth_imp)
    if to_add:
        old = m.group(0)
        content = content.replace(old, old + "\n" + "\n".join(to_add), 1)
        changes.append("  [STEP 1] Added: " + " | ".join(to_add))
    return content, changes


def step2_remove_cors_headers_const(content):
    changes = []
    pat = re.compile(r'const corsHeaders\s*=\s*\{[^}]*\}\s*;', re.DOTALL)
    m   = pat.search(content)
    if not m:
        changes.append("  [STEP 2] No corsHeaders const found -- skipped")
        return content, changes
    old  = m.group(0)
    new_ = content.replace("\n" + old + "\n", "\n")
    if new_ == content: new_ = content.replace(old + "\n", "")
    if new_ == content: new_ = content.replace(old, "")
    if new_ != content:
        changes.append("  [STEP 2] Removed corsHeaders constant")
        content = new_
    else:
        changes.append("  [STEP 2] WARNING: corsHeaders found but could not remove cleanly")
    return content, changes


def step3_add_origin_extraction(content):
    changes = []
    if "const origin = req.headers.get('Origin')" in content or \
       'const origin = req.headers.get("Origin")' in content:
        changes.append("  [STEP 3] origin extraction already present -- skipped")
        return content, changes
    pat = re.compile(r'(serve\(async \(req\) => \{)')
    m   = pat.search(content)
    if not m:
        changes.append("  [STEP 3] WARNING: could not find serve handler opening -- skipped")
        return content, changes
    old  = m.group(0)
    new_ = old + "\n  const origin = req.headers.get('Origin');"
    content = content.replace(old, new_, 1)
    changes.append("  [STEP 3] Added origin extraction")
    return content, changes


def step4_replace_options_handler(content):
    changes = []
    NEW_H = "  if (req.method === 'OPTIONS') {\n    return handleCorsPreflightRequest(origin);\n  }"
    if "handleCorsPreflightRequest(origin)" in content:
        changes.append("  [STEP 4] OPTIONS handler already correct -- skipped")
        return content, changes
    p1 = re.compile(
        r"if \(req\.method === ['\"]OPTIONS['\"]\) \{[^}]*return new Response\([^)]*\{[^}]*headers:\s*corsHeaders[^}]*\}[^)]*\);[^}]*\}",
        re.DOTALL)
    m = p1.search(content)
    if m:
        content = content[:m.start()] + NEW_H + content[m.end():]
        changes.append("  [STEP 4] Replaced OPTIONS handler (corsHeaders pattern)")
        return content, changes
    p2 = re.compile(r"if \(req\.method === ['\"]OPTIONS['\"]\) \{[^{}]*\}", re.DOTALL)
    m  = p2.search(content)
    if m:
        content = content[:m.start()] + NEW_H + content[m.end():]
        changes.append("  [STEP 4] Replaced OPTIONS handler (generic pattern)")
        return content, changes
    changes.append("  [STEP 4] WARNING: could not find/replace OPTIONS handler")
    return content, changes


def step5_add_auth_validation(content, func_name, has_user_id):
    changes = []
    actual_calls = count_cc(content)
    if "validateAuth" in content:
        changes.append("  [STEP 5] Auth validation already present -- skipped")
        return content, changes

    p_body1 = re.compile(r'(const \{[^}]*\buser_id\b[^}]*\}\s*=\s*await req\.json\(\)[^;]*;)', re.DOTALL)
    p_body2 = re.compile(r'(const \{[^}]*\buser_id\b[^}]*\}\s*=\s*body\s+as[^;]+;)', re.DOTALL)

    if has_user_id:
        m = p_body1.search(content) or p_body2.search(content)
        if not m:
            changes.append("  [STEP 5] WARNING: could not find user_id body extraction -- auth not added")
            return content, changes

        AUTH_LINE = "\n    const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);"

        if actual_calls == 1:
            removed = False
            for pat in [
                re.compile(r'\n\s*const supabaseClient\s*=\s*createClient\([^)]*\);\s*', re.DOTALL),
                re.compile(r'\n\s*const supabaseClient\s*=\s*createClient\(\s*[^;]+?\n\s*\);\s*', re.DOTALL),
            ]:
                cm = pat.search(content)
                if cm:
                    content = content[:cm.start()] + content[cm.end():]
                    changes.append("  [STEP 5] Removed single createClient block")
                    removed = True
                    break
            if not removed:
                changes.append("  [STEP 5] WARNING: could not remove createClient block")
        else:
            changes.append("  [STEP 5] {} createClient calls -- leaving them, only adding auth".format(actual_calls))

        m2 = p_body1.search(content) or p_body2.search(content)
        if m2:
            content = content[:m2.end()] + AUTH_LINE + content[m2.end():]
            changes.append("  [STEP 5] Added validateAuthWithUserId")
        else:
            changes.append("  [STEP 5] WARNING: could not re-find body extraction -- auth insertion failed")

    else:
        AUTH_LINE = "\n    const { serviceClient: supabaseClient } = await validateAuth(req);"

        alt = re.search(r'(return handleCorsPreflightRequest\(origin\);\s*\})', content)
        if alt:
            insert_pos = alt.start() + len(alt.group(0))
        else:
            po = re.compile(r"(if \(req\.method === ['\"]OPTIONS['\"]\) \{[^}]*\})", re.DOTALL)
            mo = po.search(content)
            if mo:
                insert_pos = mo.end()
            else:
                changes.append("  [STEP 5] WARNING: no OPTIONS block found -- auth not added")
                return content, changes

        if actual_calls == 1:
            removed = False
            for pat in [
                re.compile(r'\n\s*const (?:supabase|supabaseClient)\s*=\s*createClient\([^)]*\);\s*', re.DOTALL),
                re.compile(r'\n\s*const (?:supabase|supabaseClient)\s*=\s*createClient\(\s*[^;]+?\n\s*\);\s*', re.DOTALL),
            ]:
                cm = pat.search(content)
                if cm:
                    content = content[:cm.start()] + content[cm.end():]
                    changes.append("  [STEP 5] Removed single createClient block")
                    removed = True
                    break
            if not removed:
                changes.append("  [STEP 5] WARNING: could not remove createClient block")
        else:
            changes.append("  [STEP 5] {} createClient calls -- leaving them, only adding auth".format(actual_calls))

        alt2 = re.search(r'(return handleCorsPreflightRequest\(origin\);\s*\})', content)
        if alt2:
            insert_pos = alt2.start() + len(alt2.group(0))
        else:
            po2 = re.compile(r"(if \(req\.method === ['\"]OPTIONS['\"]\) \{[^}]*\})", re.DOTALL)
            mo2 = po2.search(content)
            if mo2:
                insert_pos = mo2.end()
            else:
                changes.append("  [STEP 5] WARNING: could not re-find insert point -- auth skipped")
                return content, changes

        content = content[:insert_pos] + AUTH_LINE + content[insert_pos:]
        changes.append("  [STEP 5] Added validateAuth")

    return content, changes


def step6_fix_response_headers(content):
    changes = []
    original = content
    NEW_H = "headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }"
    NEW_O = "{ 'Content-Type': 'application/json', ...getCorsHeaders(origin) }"
    content = re.sub(r'headers:\s*corsHeaders\b', NEW_H, content)
    content = re.sub(
        r"headers:\s*\{\s*['\"]Content-Type['\"]\s*:\s*['\"]application/json['\"]\s*\}",
        NEW_H, content)
    content = re.sub(
        r"\{\s*\.\.\.corsHeaders,\s*['\"]Content-Type['\"]\s*:\s*['\"]application/json['\"]\s*\}",
        NEW_O, content)
    content = re.sub(
        r"\{\s*['\"]Content-Type['\"]\s*:\s*['\"]application/json['\"],\s*\.\.\.corsHeaders\s*\}",
        NEW_O, content)
    if content != original:
        changes.append("  [STEP 6] Fixed response headers to use getCorsHeaders(origin)")
    else:
        changes.append("  [STEP 6] No response headers needed fixing")
    return content, changes


def step7_fix_error_handler(content):
    changes = []
    CHECK = "if (error instanceof Response) return error;"
    if CHECK in content:
        changes.append("  [STEP 7] isinstance Response check already present -- skipped")
        return content, changes
    pat = re.compile(r'(\} catch \([^)]+\) \{)(\s*)')
    def replacer(m): return m.group(1) + m.group(2) + "    " + CHECK + "\n"
    new_content, n = pat.subn(replacer, content)
    if n > 0:
        content = new_content
        changes.append("  [STEP 7] Added isinstance Response check in {} catch block(s)".format(n))
    else:
        changes.append("  [STEP 7] WARNING: no catch blocks found")
    return content, changes


def fix_cors_only(content, func_name):
    changes = ["  (CORS-only mode for {})".format(func_name)]
    CORS_IMP = "import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';"
    if "cors-config.ts" not in content:
        pat = re.compile(
            r"(import \{ serve \} from ['\"]https://deno\.land/std@[^'\"]+/http/server\.ts['\"];)"
        )
        m = pat.search(content)
        if m:
            old = m.group(0)
            content = content.replace(old, old + "\n" + CORS_IMP, 1)
            changes.append("  [CORS-ONLY] Added cors-config import")
    content, c2 = step2_remove_cors_headers_const(content)
    changes.extend(c2)
    content, c3 = step3_add_origin_extraction(content)
    changes.extend(c3)
    content, c4 = step4_replace_options_handler(content)
    changes.extend(c4)
    content, c6 = step6_fix_response_headers(content)
    changes.extend(c6)
    return content, changes


def process_function(func_name, func_path):
    index_path = os.path.join(func_path, "index.ts")
    if not os.path.exists(index_path):
        print("  SKIP: no index.ts in {}".format(func_name))
        return
    content = read_file(index_path)
    all_changes = []
    if func_name in CORS_ONLY:
        content, all_changes = fix_cors_only(content, func_name)
    else:
        has_user_id = func_name in WITH_USER_ID
        content, c1 = step1_add_imports(content, func_name, has_user_id)
        all_changes.extend(c1)
        content, c2 = step2_remove_cors_headers_const(content)
        all_changes.extend(c2)
        content, c3 = step3_add_origin_extraction(content)
        all_changes.extend(c3)
        content, c4 = step4_replace_options_handler(content)
        all_changes.extend(c4)
        content, c5 = step5_add_auth_validation(content, func_name, has_user_id)
        all_changes.extend(c5)
        content, c6 = step6_fix_response_headers(content)
        all_changes.extend(c6)
        content, c7 = step7_fix_error_handler(content)
        all_changes.extend(c7)
    write_file(index_path, content)
    for line in all_changes:
        print(line)


def main():
    if not os.path.isdir(FUNCTIONS_DIR):
        print("ERROR: Functions directory not found: {}".format(FUNCTIONS_DIR))
        sys.exit(1)
    func_dirs = sorted([
        d for d in os.listdir(FUNCTIONS_DIR)
        if os.path.isdir(os.path.join(FUNCTIONS_DIR, d)) and d not in SKIP_DIRS
    ])
    print("Found {} function directories to process (after skipping):".format(len(func_dirs)))
    print("  " + ", ".join(func_dirs))
    print()
    print("=" * 70)
    for func_name in func_dirs:
        func_path = os.path.join(FUNCTIONS_DIR, func_name)
        print()
        print(">>> Processing: {}".format(func_name))
        try:
            process_function(func_name, func_path)
        except Exception as e:
            print("  ERROR processing {}: {}".format(func_name, e))
            import traceback
            traceback.print_exc()
    print()
    print("=" * 70)
    print("Done! All eligible edge functions processed.")


if __name__ == "__main__":
    main()
