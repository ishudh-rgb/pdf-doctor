"""Fix broken files after Jul 12 undo — restore Jul 3-compatible versions."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git_show(ref: str, rel: str) -> str:
    return subprocess.check_output(
        ["git", "show", f"{ref}:{rel}"], text=True, errors="replace"
    )


# Upload routes: keep tool-mutation-auth, drop upload-validation
upload_routes = list((ROOT / "src/app/api/tools").rglob("route.ts")) + [
    ROOT / "src/app/api/ai/summarize/route.ts"
]
for fp in upload_routes:
    text = fp.read_text(encoding="utf-8")
    if "upload-validation" not in text:
        continue
    text = text.replace(
        'import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";\n',
        "",
    )
    if "isValidFileType" not in text:
        text = text.replace(
            "import { FILE_LIMITS }",
            'import { isValidFileType, validateFileSize } from "@/lib/utils/file";\nimport { FILE_LIMITS }',
        )
    # single-file pattern
    text = re.sub(
        r"const validated = await validateSingleUpload\([^)]+\);\s*if \(!validated\.ok\) \{[\s\S]*?\}\s*",
        "",
        text,
        count=1,
    )
    # merge multi-file loop
    loop = """for (const file of files) {
      if (!isValidFileType(file, ["pdf"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDF files are accepted.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }
    }

"""
    text = re.sub(
        r"const rawBuffers: Buffer\[\] = \[\];\s*for \(const file of files\) \{[\s\S]*?rawBuffers\.push\(validated\.buffer\);\s*\}\s*",
        loop,
        text,
        count=1,
    )
    text = text.replace(
        "const raw = rawBuffers[index];",
        "const raw = Buffer.from(await file.arrayBuffer());",
    )
    fp.write_text(text, encoding="utf-8")
    print("fixed upload", fp.relative_to(ROOT))

# login
login = ROOT / "src/app/api/auth/login/route.ts"
t = git_show("backup/jul12-pre-undo", "src/app/api/auth/login/route.ts")
t = t.replace(
    'import { jsonApiError, jsonApiMessage } from "@/lib/server/api-error";',
    'import { toSafeApiError } from "@/lib/server/safe-error";',
)
t = t.replace(
    'return jsonApiMessage(request, "Invalid email or password", 401);',
    'return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });',
)
t = t.replace(
    "return jsonApiError(request, err, 500,",
    "return NextResponse.json({ error: toSafeApiError(err) }, { status: 500 }); //",
)
login.write_text(t, encoding="utf-8")
print("fixed login")

# me
me = ROOT / "src/app/api/auth/me/route.ts"
t = git_show("backup/jul12-pre-undo", "src/app/api/auth/me/route.ts")
t = t.replace('import { toPublicProfile } from "@/lib/privacy/public-profile";\n', "")
t = t.replace('import { logSafeError } from "@/lib/server/safe-log";\n', "")
old_block = """    const publicProfile = toPublicProfile(
      profile ?? {
        id: auth.user.id,
        email: auth.user.email,
        role: "user",
        plan: auth.user.plan,
      }
    );

    return NextResponse.json({
      user: publicProfile
        ? {
            id: publicProfile.id,
            email: publicProfile.email,
            role: publicProfile.role,
            plan: publicProfile.plan,
            full_name: publicProfile.full_name,
          }
        : {
            id: auth.user.id,
            email: auth.user.email,
            role: "user",
            plan: auth.user.plan,
            full_name: null,
          },
    });"""
new_block = """    return NextResponse.json({
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: profile?.role ?? "user",
        plan: profile?.plan ?? auth.user.plan,
        full_name: profile?.full_name ?? null,
      },
    });"""
t = t.replace(old_block, new_block)
t = t.replace('logSafeError("Auth me", err);', 'console.error("Auth me error:", err);')
me.write_text(t, encoding="utf-8")
print("fixed me")

# supabase
for rel in ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts"]:
    t = git_show("ad37110", rel)
    (ROOT / rel).write_text(t, encoding="utf-8")
print("fixed supabase from ad37110")

# sentry-config from ad37110
(ROOT / "src/lib/ops/sentry-config.ts").write_text(
    git_show("ad37110", "src/lib/ops/sentry-config.ts"), encoding="utf-8"
)
print("fixed sentry-config")

# rate-limiter from backup minus correlation-id
rl = ROOT / "src/lib/server/rate-limiter.ts"
t = git_show("backup/jul12-pre-undo", "src/lib/server/rate-limiter.ts")
t = re.sub(
    r'import \{ getRequestCorrelationId \} from "@/lib/server/correlation-id";\n',
    "",
    t,
)
t = t.replace("rateLimitResponse(rate.retryAfterSec, request,", "rateLimitResponse(rate.retryAfterSec,")
rl.write_text(t, encoding="utf-8")
print("fixed rate-limiter")

# subscription-fulfillment from backup minus binding
sf = ROOT / "src/lib/services/subscription-fulfillment.service.ts"
t = git_show("backup/jul12-pre-undo", "src/lib/services/subscription-fulfillment.service.ts")
t = t.replace(
    'import { verifyRazorpaySubscriptionPaymentBinding } from "@/lib/services/payment.service";\n',
    "",
)
t = re.sub(
    r"  const proof = await verifyRazorpaySubscriptionPaymentBinding\([\s\S]*?\n  \}\n\n",
    "",
    t,
    count=1,
)
sf.write_text(t, encoding="utf-8")
print("fixed subscription-fulfillment")

# local-dev-session
lds = ROOT / "src/lib/auth/local-dev-session.ts"
t = git_show("backup/jul12-pre-undo", "src/lib/auth/local-dev-session.ts")
t = t.replace(
    'import { getLocalDevSessionSecret } from "./local-dev-session-secret";\n', ""
)
t = t.replace(
    "getLocalDevSessionSecret()",
    'process.env.LOCAL_DEV_SESSION_SECRET || "local-dev-secret"',
)
lds.write_text(t, encoding="utf-8")
print("fixed local-dev-session")

# e2e
ts = ROOT / "e2e/tools.spec.ts"
t = ts.read_text(encoding="utf-8").replace(", primeCookieConsent", "")
ts.write_text(t, encoding="utf-8")

# openai
(ROOT / "src/lib/ai/openai.ts").write_text(
    git_show("ad37110", "src/lib/ai/openai.ts"), encoding="utf-8"
)
print("fixed openai")

# payment.service - remove subscription binding export if added jul12
ps = ROOT / "src/lib/services/payment.service.ts"
t = ps.read_text(encoding="utf-8")
if "verifyRazorpaySubscriptionPaymentBinding" in t:
    t = re.sub(
        r"\nexport type RazorpaySubscriptionPaymentProof[\s\S]*?\n\}\n\nexport \{ createMockPaymentId \};",
        "\n\nexport { createMockPaymentId };",
        t,
    )
    ps.write_text(t, encoding="utf-8")
    print("fixed payment.service")

print("done")
