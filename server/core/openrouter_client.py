import os
from typing import Optional

import requests
from dotenv import load_dotenv

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_SERVER_ROOT = os.path.dirname(os.path.dirname(__file__))
_ENV_PATH = os.path.join(_SERVER_ROOT, ".env")
load_dotenv(_ENV_PATH)

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-vl-7b-instruct")


def ask_qwen(prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.4) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        hint = ""
        if os.getenv("GOOGLE_AI_KEY", "").strip():
            hint = " GOOGLE_AI_KEY exists, but OpenRouter requires OPENROUTER_API_KEY."
        raise RuntimeError(f"OPENROUTER_API_KEY is not set (expected in {_ENV_PATH}).{hint}")

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt or "You are Friday AI, a helpful assistant.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
