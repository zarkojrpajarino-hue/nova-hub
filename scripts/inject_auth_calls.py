import os
import re

FUNCS_DIR = 'C:/Users/Zarko/nova-hub/supabase/functions'

SKIP = {
    '_shared',
    'generate-email-pitch',
    'tests',
    'competitor-intelligence-cron',
    'seed-projects',
    'seed-users',
    'deploy-to-vercel',
    'export-excel',
    'generate-learning-roadmap',
    'generate-project-roles',
    'generate-role-questions',
    'generate-task-completion-questions',
}

USER_ID_FUNCS = {
    'ai-career-coach',
    'ai-lead-finder',
    'ai-task-executor',
    'ai-task-router',
    'auto-sync-finances',
    'enrich-project-intelligence',
    'generate-actionable-insights',
    'generate-business-ideas',
    'generate-complete-business',
    'generate-learning-path',
    'generate-playbook',
    'generate-predictions',
    'generate-role-questions-v2',
    'generate-tasks-v2',
    'prepare-one-on-one',
    'suggest-optimal-schedule',
    'sync-stripe',
}

PATTERN_MULTILINE_SUPABASECLIENT = re.compile(
    r"const supabaseClient = createClient\(\s*\n\s*Deno\.env\.get\('SUPABASE_URL'\)[^,]+,\s*\n\s*Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)[^\)]+\);",
    re.DOTALL
)

PATTERN_INLINE_VARS = re.compile(
    r"const supabaseServiceKey = Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)!;\s*\n(\s*)const supabase = createClient\(supabaseUrl, supabaseServiceKey\);",
    re.DOTALL
)

PATTERN_REQUIRE_ENV = re.compile(
    r"const supabaseKey = requireEnv\('SUPABASE_SERVICE_ROLE_KEY'\);\s*\n(\s*)const supabase = createClient\(supabaseUrl, supabaseKey\);",
    re.DOTALL
)

PATTERN_ANON_KEY_MULTILINE = re.compile(
    r"const supabaseClient = createClient\(\s*\n\s*Deno\.env\.get\('SUPABASE_URL'\)[^,]+,\s*\n\s*Deno\.env\.get\('SUPABASE_ANON_KEY'\)[^,]+,\s*\n\s*\{\s*\n\s*global:\s*\{\s*\n\s*headers:\s*\{\s*Authorization:[^\}]+\}\s*,?\s*\n\s*\}\s*,?\s*\n\s*\}\s*\n\s*\);",
    re.DOTALL
)

processed = 0
skipped_already_done = 0
skipped_no_match = 0
errors = 0

def get_replacement(func_name, var_name='supabaseClient'):
    if func_name in USER_ID_FUNCS:
        return '    const {{ serviceClient: {v} }} = await validateAuthWithUserId(req, user_id);'.format(v=var_name)
    else:
        return '    const {{ serviceClient: {v} }} = await validateAuth(req);'.format(v=var_name)

for func_name in sorted(os.listdir(FUNCS_DIR)):
    if func_name in SKIP:
        continue

    index_path = os.path.join(FUNCS_DIR, func_name, 'index.ts')
    if not os.path.exists(index_path):
        print('  [SKIP] {}: no index.ts found'.format(func_name))
        continue

    content = open(index_path, encoding='utf-8', errors='replace').read()

    if 'await validateAuth' in content:
        print('  [SKIP] {}: already has validateAuth call'.format(func_name))
        skipped_already_done += 1
        continue

    new_content = None
    method_used = None

    if PATTERN_MULTILINE_SUPABASECLIENT.search(content):
        replacement = get_replacement(func_name, 'supabaseClient')
        new_content, count = PATTERN_MULTILINE_SUPABASECLIENT.subn(replacement, content, count=1)
        if count > 0:
            method_used = 'pattern1_multiline_service_role_supabaseClient'

    if new_content is None and PATTERN_INLINE_VARS.search(content):
        fn = func_name
        if fn in USER_ID_FUNCS:
            repl_str = '{indent}const {{ serviceClient: supabase }} = await validateAuthWithUserId(req, user_id);'
        else:
            repl_str = '{indent}const {{ serviceClient: supabase }} = await validateAuth(req);'
        def make_repl2(rs):
            def repl2(m):
                return rs.format(indent=m.group(1))
            return repl2
        new_content, count = PATTERN_INLINE_VARS.subn(make_repl2(repl_str), content, count=1)
        if count > 0:
            method_used = 'pattern2_inline_servicekey_vars'

    if new_content is None and PATTERN_REQUIRE_ENV.search(content):
        fn = func_name
        if fn in USER_ID_FUNCS:
            repl_str = '{indent}const {{ serviceClient: supabase }} = await validateAuthWithUserId(req, user_id);'
        else:
            repl_str = '{indent}const {{ serviceClient: supabase }} = await validateAuth(req);'
        def make_repl3(rs):
            def repl3(m):
                return rs.format(indent=m.group(1))
            return repl3
        new_content, count = PATTERN_REQUIRE_ENV.subn(make_repl3(repl_str), content, count=1)
        if count > 0:
            method_used = 'pattern3_require_env'

    if new_content is None and PATTERN_ANON_KEY_MULTILINE.search(content):
        replacement = get_replacement(func_name, 'supabaseClient')
        new_content, count = PATTERN_ANON_KEY_MULTILINE.subn(replacement, content, count=1)
        if count > 0:
            method_used = 'pattern4_anon_key_user_client'

    if new_content is None:
        has_any_create_client = 'createClient' in content
        if not has_any_create_client:
            if func_name in USER_ID_FUNCS:
                auth_fn = 'validateAuthWithUserId(req, user_id)'
            else:
                auth_fn = 'validateAuth(req)'
            insert_str = '\n\n    await {};\n'.format(auth_fn)
            insert_pattern = re.compile(
                r'(return handleCorsPreflightRequest\(origin\);\s*\n\s*\})\s*\n',
                re.DOTALL
            )
            if insert_pattern.search(content):
                new_content = insert_pattern.sub(r'\1' + insert_str, content, count=1)
                method_used = 'pattern5_no_createclient_bare_insert'
            else:
                opts_pattern = re.compile(
                    r'(if \(req\.method === .OPTIONS.\)[^\}]+\}\s*\n)',
                    re.DOTALL
                )
                if opts_pattern.search(content):
                    insert_str2 = '\n    await {};\n'.format(auth_fn)
                    new_content = opts_pattern.sub(r'\1' + insert_str2, content, count=1)
                    method_used = 'pattern5b_no_createclient_after_options'

    if new_content is None:
        print('  [NO MATCH] {}: no known pattern found'.format(func_name))
        skipped_no_match += 1
        continue

    try:
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('  [DONE] {}: [{}]'.format(func_name, method_used))
        processed += 1
    except Exception as e:
        print('  [ERROR] {}: write failed: {}'.format(func_name, e))
        errors += 1

print()
print('Summary:')
print('  Processed (modified):     {}'.format(processed))
print('  Skipped (already done):   {}'.format(skipped_already_done))
print('  Skipped (no match found): {}'.format(skipped_no_match))
print('  Errors:                   {}'.format(errors))
