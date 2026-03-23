from __future__ import annotations

import base64
import os
from typing import Optional

import requests
from dotenv import load_dotenv


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SERVER_ROOT = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(SERVER_ROOT, ".env")
load_dotenv(ENV_PATH)

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-vl-7b-instruct")


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(f"OPENROUTER_API_KEY is not set (expected in {ENV_PATH}).")
    return api_key


def ask_qwen(prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.4) -> str:
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt or "You are a helpful specialist agent.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
    }

    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }

    response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def describe_image(image_path: str, prompt: str) -> str:
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful AI assistant that can analyze images."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                ],
            },
        ],
        "temperature": 0.4,
    }

    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }

    response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
