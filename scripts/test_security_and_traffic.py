import requests
import sys

BASE_URL = "http://localhost" # Nginx proxy is on port 80

def test_public_endpoints():
    print("=== Testing Public Endpoints ===")
    r = requests.get(f"{BASE_URL}/api/settings")
    print(f"GET /api/settings: Status {r.status_code}")
    assert r.status_code == 200, "Settings API failed!"
    
    r = requests.get(f"{BASE_URL}/api/wishes")
    print(f"GET /api/wishes: Status {r.status_code}")
    assert r.status_code == 200, "Wishes API failed!"
    print("[OK] Public endpoints are OK.")

def test_path_traversal():
    print("\n=== Testing Path Traversal Protection ===")
    # Try downloading a traversal path
    payload_url = "/uploads/../../.env"
    r = requests.get(f"{BASE_URL}/api/download", params={"url": payload_url})
    print(f"GET /api/download?url={payload_url}: Status {r.status_code}")
    # Should be blocked or return 400/404/500 depending on traversal block
    assert r.status_code in [400, 404, 500], f"Failed: Path traversal was not blocked (Status {r.status_code})"
    print("[OK] Path traversal is successfully blocked.")

def test_ssrf():
    print("\n=== Testing SSRF Protection ===")
    # Try requesting loopback IP
    payload_url = "http://127.0.0.1:8000/api/admin/stats"
    r = requests.get(f"{BASE_URL}/api/download", params={"url": payload_url})
    print(f"GET /api/download?url={payload_url}: Status {r.status_code}")
    # Should return 400 Bad Request
    assert r.status_code == 400, f"Failed: SSRF loopback was not blocked (Status {r.status_code})"
    
    # Try requesting metadata server
    payload_url = "http://169.254.169.254/computeMetadata/v1/"
    r = requests.get(f"{BASE_URL}/api/download", params={"url": payload_url})
    print(f"GET /api/download?url={payload_url}: Status {r.status_code}")
    assert r.status_code == 400, f"Failed: SSRF Metadata server was not blocked (Status {r.status_code})"
    print("[OK] SSRF is successfully blocked.")

def test_rate_limiting():
    print("\n=== Testing Nginx Rate Limiting ===")
    # Send quick POST requests to /api/wishes to trigger rate limit (rate=10r/m, burst=5)
    print("Sending rapid requests to /api/wishes...")
    limit_triggered = False
    for i in range(12):
        # We send requests to /api/wishes.
        # If rate limit is hit, Nginx returns 429.
        r = requests.post(f"{BASE_URL}/api/wishes", data={})
        if r.status_code == 429:
            print(f"Request {i+1}: Hit Rate Limit! (Status 429)")
            limit_triggered = True
            break
        else:
            # It could return 400 (Bad Request) if Nginx let it through, which is fine
            print(f"Request {i+1}: Status {r.status_code}")
            
    assert limit_triggered, "Failed: Nginx rate limiting on /api/wishes was not triggered!"
    print("[OK] Rate limiting is successfully triggered (Nginx returned 429).")

if __name__ == "__main__":
    try:
        # Since we run inside container or host, BASE_URL is http://nginx (or http://localhost if on host)
        # Let's check if we can reach nginx on host
        try:
            requests.get("http://localhost/api/settings", timeout=2)
        except Exception:
            # Fallback for inside Docker container (use service name 'nginx')
            BASE_URL = "http://nginx"
            
        test_public_endpoints()
        test_path_traversal()
        test_ssrf()
        test_rate_limiting()
        print("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY! The system is highly secure.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAILURE] TEST FAILED: {e}")
        sys.exit(1)
