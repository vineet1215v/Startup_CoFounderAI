from __future__ import annotations

import concurrent.futures
import json
import time
import urllib.request


TARGET = "http://127.0.0.1:8080/healthz"
REQUESTS = 25
CONCURRENCY = 5


def fetch(_: int) -> float:
    started = time.perf_counter()
    with urllib.request.urlopen(TARGET, timeout=5) as response:
        json.loads(response.read().decode("utf-8"))
    return time.perf_counter() - started


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        durations = list(executor.map(fetch, range(REQUESTS)))
    avg = sum(durations) / len(durations)
    print(f"load smoke complete: requests={REQUESTS} concurrency={CONCURRENCY} avg_latency={avg:.4f}s")


if __name__ == "__main__":
    main()
