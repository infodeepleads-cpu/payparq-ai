
import urllib.request
import urllib.parse
import json
import ssl

context = ssl._create_unverified_context()
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0MDc4OCwiZXhwIjoyMDgzNzE2Nzg4fQ.-mPrJ7y9do_6DdBrYkXrdrvLN9TU69zvnIsfitWbjYk"

headers = {
    "apikey": token,
    "Authorization": f"Bearer {token}",
}

def fetch_from_table(table, limit=50):
    base = f"https://iafjygownkhedereaoxw.supabase.co/rest/v1/{table}"
    params = urllib.parse.urlencode({
        "select": "*",
        "order": "created_at.desc",
        "limit": str(limit),
    })
    req = urllib.request.Request(f"{base}?{params}", headers=headers)
    try:
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code} for {table}: {e.read().decode()}")
        return []

search_email = "kzamic@gmail.com"

for table in ["parking_sessions", "parking_permits"]:
    print(f"\nChecking table: {table}...")
    rows = fetch_from_table(table, 100)
    found_count = 0
    for row in rows:
        row_email = (row.get("email") or row.get("contact_email") or "").lower()
        metadata_raw = row.get("stripe_metadata")
        metadata = {}
        if isinstance(metadata_raw, str):
            try:
                metadata = json.loads(metadata_raw)
                if isinstance(metadata, str):
                    metadata = json.loads(metadata)
            except Exception:
                pass
        elif isinstance(metadata_raw, dict):
            metadata = metadata_raw

        meta_email = (metadata.get("email") or metadata.get("customer_email") or "").lower()
        
        if search_email in row_email or search_email in meta_email:
            found_count += 1
            meta_qty = metadata.get("quantity") or metadata.get("qty") or metadata.get("duration_quantity")
            print(f"--- Found in {table} ---")
            print("id:", row.get("id"))
            print("email:", row_email)
            print("created_at:", row.get("created_at"))
            print("metadata_qty:", meta_qty)
            print("metadata:", json.dumps(metadata, indent=2))
    
    if found_count == 0:
        print(f"No records found in {table} for {search_email}")
