
import urllib.request
import urllib.parse
import json
import ssl

context = ssl._create_unverified_context()
base = "https://iafjygownkhedereaoxw.supabase.co/rest/v1/parking_sessions"
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg"
headers = {
    "apikey": token,
    "Authorization": f"Bearer {token}",
}

def fetch(select_clause):
    params = urllib.parse.urlencode({
        "select": select_clause,
        "order": "created_at.desc",
        "limit": "5",
    })
    req = urllib.request.Request(f"{base}?{params}", headers=headers)
    with urllib.request.urlopen(req, context=context) as response:
        return json.loads(response.read().decode())

try:
    rows = fetch("*")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
    raise SystemExit(1)

print(f"Fetched {len(rows)} records")
if rows:
    print("Available columns:", ", ".join(sorted(rows[0].keys())))

for i, row in enumerate(rows, start=1):
    metadata = row.get("stripe_metadata")
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except Exception:
            pass
    meta_qty = None
    meta_unit = None
    if isinstance(metadata, dict):
        meta_qty = metadata.get("quantity") or metadata.get("qty") or metadata.get("duration_quantity")
        meta_unit = metadata.get("duration_unit")
    print(f"\n--- Record {i} ---")
    print("id:", row.get("id"))
    print("stripe_session_id:", row.get("stripe_session_id"))
    print("type:", row.get("type"))
    print("created_at:", row.get("created_at"))
    print("entry_time:", row.get("entry_time"))
    print("exit_time:", row.get("exit_time"))
    print("duration_minutes:", row.get("duration_minutes"))
    print("quantity:", row.get("quantity"))
    print("metadata_qty:", meta_qty)
    print("metadata_duration_unit:", meta_unit)
