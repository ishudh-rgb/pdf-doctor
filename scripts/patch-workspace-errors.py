from pathlib import Path
import re

for p in Path("src/components/tools").rglob("*-workspace.tsx"):
    t = p.read_text(encoding="utf-8")
    n = t
    n = n.replace(
        "setError(result.error ?? ws.couldNotReadPdf)",
        "setError(ws.resolveApiError(result.error, \"errors.corruptedPdf\") || ws.couldNotReadPdf)",
    )
    n = n.replace(
        "setError(result.error ?? ws.couldNotReadPdfShort)",
        "setError(ws.resolveApiError(result.error, \"errors.corruptedPdf\") || ws.couldNotReadPdfShort)",
    )
    n = n.replace("setError(result.error)", "setError(ws.resolveApiError(result.error))")
    n = n.replace(
        "setError(data.error ?? ws.couldNotAddDocument)",
        "setError(ws.resolveApiError(data.error) || ws.couldNotAddDocument)",
    )
    n = n.replace(
        "if (result.error) setError(result.error)",
        "if (result.error) setError(ws.resolveApiError(result.error))",
    )
    if n != t:
        p.write_text(n, encoding="utf-8")
        print(p)
