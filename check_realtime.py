import http.client
import json

conn = http.client.HTTPSConnection("iafjygownkhedereaoxw.supabase.co")
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0MDc4OCwiZXhwIjoyMDgzNzE2Nzg4fQ.-mPrJ7y9do_6DdBrYkXrdrvLN9TU69zvnIsfitWbjYk"
headers = {
    "apikey": token,
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Check if parking_sessions is in the realtime publication
sql = "SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parking_sessions';"
payload = {"sql": sql}

conn.request("POST", "/rest/v1/rpc/exec_sql", body=json.dumps(payload), headers=headers)
res = conn.getresponse()
data = res.read()
print(f"Realtime check: {data.decode()}")
