import urllib.request
import json
import ssl
import os

def run_sql(sql):
    url = "https://iafjygownkhedereaoxw.supabase.co/rest/v1/rpc/exec_sql"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0MDc4OCwiZXhwIjoyMDgzNzE2Nzg4fQ.-mPrJ7y9do_6DdBrYkXrdrvLN9TU69zvnIsfitWbjYk"
    
    headers = {
        "apikey": token,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {"sql": sql}
    
    context = ssl._create_unverified_context()
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers)
    
    try:
        with urllib.request.urlopen(req, context=context) as response:
            print(f"Status: {response.status}")
            print(f"Response: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrations = [
        'supabase/migrations/20260309_fix_rls_policies.sql',
        'supabase/migrations/20260309_add_ui_type_column.sql',
        'supabase/migrations/20260309_enable_realtime.sql'
    ]
    for m in migrations:
        print(f"Running migration: {m}")
        if os.path.exists(m):
            with open(m, 'r') as f:
                sql_to_run = f.read()
            run_sql(sql_to_run)
        else:
            print(f"Skipping {m} (not found)")
