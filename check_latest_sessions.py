import http.client
import json

conn = http.client.HTTPSConnection("iafjygownkhedereaoxw.supabase.co")
headers = {
    'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg",
    'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg"
}

# Fetch the latest 5 sessions
conn.request("GET", "/rest/v1/parking_sessions?select=*&order=created_at.desc&limit=5", headers=headers)
res = conn.getresponse()
data = res.read()

print(f"Status: {res.status}")
sessions = json.loads(data.decode('utf-8'))
for s in sessions:
    print(f"ID: {s['id']}, Plate: {s['plate']}, Status: {s['status']}, Payment: {s['payment_status']}, Created: {s['created_at']}, UI Type: {s.get('ui_type')}")
