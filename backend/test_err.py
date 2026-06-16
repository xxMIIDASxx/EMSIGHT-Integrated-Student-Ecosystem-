import urllib.request, urllib.error, json
data = json.dumps({'sender_id': 1, 'receiver_id': 2, 'content': 'test'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/community/messages/', data=data, headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    html = e.read().decode()
    for line in html.split('\n'):
        if 'Exception' in line or 'Error' in line:
            print(line.strip())
