import subprocess
import os
import time
import urllib.request

print("=" * 50)
print("SERVER RESTART SCRIPT")
print("=" * 50)

# Step 1: Kill node processes
print("\n[1] Killing node processes...")
result = subprocess.run(['taskkill', '/F', '/IM', 'node.exe'], capture_output=True, text=True)
print(f"   Kill result: {result.returncode}")

# Wait a moment
time.sleep(2)

# Step 2: Clear the .next cache
print("\n[2] Clearing cache directory...")
cache_dir = r'I:\xampp8212\htdocs\oneoceanonelife\apps\web\.next'
if os.path.exists(cache_dir):
    import shutil
    shutil.rmtree(cache_dir)
    print("   Cache cleared successfully")

# Step 3: Start dev server
print("\n[3] Starting dev server...")
import subprocess, time
cmd = ['cmd', '/c', 'cd', r'I:\xampp8212\htdocs\oneoceanonelife\apps\web', '&&', 'npx', 'next', 'dev', '--turbopack', 'false']
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)

# Wait for server to start
print('\n[4] Waiting for server to start (15 seconds)...')
for i in range(15):
    time.sleep(1)
    result = subprocess.run(
        ['tasklist', '/FI', f'PID eq ' + str(proc.pid)],
        capture_output=True, text=True
    )
    if 'No tasks' not in result.stdout:
        print(f'   Server running at PID: {proc.pid}')
        break
    print(f'   Waiting... ({i+1}/15)')

    # Try to connect to the server
    try:
        req = urllib.request.Request('http://localhost:3000/economy')
        resp = urllib.request.urlopen(req, timeout=3)
        print('   Server is up and running!')
        break
    except Exception:
        pass

# Step 4: Test the page
print('\n[5] Testing the page...')
try:
    req = urllib.request.Request('http://localhost:3000/economy')
    resp = urllib.request.urlopen(req, timeout=5)
    html = resp.read().decode('utf-8')[:500]
    print(f'Status: {resp.status}')
    print(f'text-ocean-navy present: {"text-ocean-navy" in html}')
    print(f'text-ocean-sand present: {"text-ocean-sand" in html}')
    print(f'HTML preview: {html[:200]}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')

print('\n' + '=' * 50)
print('RESTART COMPLETE')
print('=' * 50)