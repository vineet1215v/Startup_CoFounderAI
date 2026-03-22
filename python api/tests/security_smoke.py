from __future__ import annotations

import json
import urllib.request


def main():
    with urllib.request.urlopen("http://127.0.0.1:8080/api/system/status", timeout=5) as response:
        payload = json.loads(response.read().decode("utf-8"))
        body = json.dumps(payload).lower()
        assert "openrouter_api_key" not in body
        assert "mongodb_uri" not in body
        assert payload["status"] == "ok"
    print("security smoke complete: no obvious secret leakage in system status")


if __name__ == "__main__":
    main()
