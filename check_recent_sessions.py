import http.client
import json
from datetime import datetime, timedelta

conn = http.client.HTTPSConnection("iafjygownkhedereaoxw.supabase.co")
headers = {
    'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg",
    'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg"
}

# Fetch sessions created in the last 30 minutes
now = datetime.utcnow()
ten_mins_ago = (now - timedelta(minutes=30)).isoformat() + "Z"

conn.request("GET", f"/rest/v1/parking_sessions?select=*&created_at=gte.{ten_mins_ago}&order=created_at.desc", headers=headers)
res = conn.getresponse()
data = res.read()

print(f"Status: {res.status}")
sessions = json.loads(data.decode('utf-8'))
print(f"Found {len(sessions)} sessions in the last 30 minutes.")
for s in sessions:
    print(f"ID: {s['id']}, Plate: {s['plate']}, Status: {s['status']}, Payment: {s['payment_status']}, Created: {s['created_at']}, UI Type: {s.get('ui_type')}")
