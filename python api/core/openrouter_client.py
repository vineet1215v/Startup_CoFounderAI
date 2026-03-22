import base64
import json
import os
import re
from typing import Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_SERVER_ROOT = os.path.dirname(os.path.dirname(__file__))
_ENV_PATH = os.path.join(_SERVER_ROOT, ".env")
load_dotenv(_ENV_PATH)

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-vl-7b-instruct")


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(f"OPENROUTER_API_KEY is not set (expected in {_ENV_PATH}).")
    return api_key


def ask_qwen(prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.4) -> str:
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
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }

    response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def plan_action(user_input: str, mode: str = "desktop") -> dict:
    """
    Convert user input into structured action JSON for the dispatcher
    Returns action dict or None if no action needed
    """
    if mode == "chat":
        return None  # Chat mode doesn't use actions

    system_prompt = '''You are Friday AI's action planner. Convert user requests into JSON actions for automation.

Available actions:
- {"type": "open_app", "app": "chrome|notepad|calculator|whatsapp"}
- {"type": "calculator_add", "a": number, "b": number}
- {"type": "notepad_write", "text": "content"}
- {"type": "read_screen"}
- {"type": "read_active_window"}
- {"type": "screenshot"}
- {"type": "google_search", "query": "search term"}
- {"type": "google_images"}
- {"type": "click_element", "element": "description of element to click"}
- {"type": "scroll", "direction": "up|down", "amount": 3}
- {"type": "open_website", "url": "example.com"}
- {"type": "whatsapp_send", "phone": "919xxxxxxxxx", "message": "text"}
- {"type": "create_file", "filepath": "file.txt", "content": "text"}
- {"type": "move_file", "source": "old.txt", "destination": "new.txt"}
- {"type": "copy_file", "source": "file.txt", "destination": "copy.txt"}
- {"type": "zip_files", "files": ["file1.txt", "file2.txt"], "zip_name": "archive.zip"}
- {"type": "unzip_file", "zip_path": "archive.zip", "extract_to": "folder"}
- {"type": "run_script", "script": "python code to execute"}

For complex tasks, use run_script with Python code. Generate complete scripts using subprocess, pyautogui, os, etc.'''

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Convert this request to action JSON: {user_input}"}
        ],
        "temperature": 0.1
    }

    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json"
    }

    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        r.raise_for_status()
        response_text = r.json()["choices"][0]["message"]["content"].strip()
        
        # Extract JSON if model wraps it in markdown
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group()

        action = json.loads(response_text)
        return action if isinstance(action, dict) and "type" in action else {"type": "unknown"}
    except Exception as e:
        print(f"Action planning error: {e}")
        return {"type": "unknown"}


def describe_image(image_path: str, prompt: str = "Describe what you see in this image in detail.") -> str:
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        payload = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": "You are a helpful AI assistant that can analyze images."},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]}
            ],
            "temperature": 0.4
        }

        headers = {
            "Authorization": f"Bearer {_get_api_key()}",
            "Content-Type": "application/json"
        }

        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error describing image: {str(e)}"


def get_next_step_from_image(image_path: str, instruction: str) -> dict:
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        prompt = f"""You are executing a multi-step task iteratively. Instruction: "{instruction}"
Based on the screenshot, determine the next step or {{"type": "completed"}}. 
Use the action planner JSON format."""

        payload = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": "You are an AI assistant that analyzes screenshots. Return only JSON actions."},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]}
            ],
            "temperature": 0.1
        }

        headers = {
            "Authorization": f"Bearer {_get_api_key()}",
            "Content-Type": "application/json"
        }

        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        response_text = r.json()["choices"][0]["message"]["content"].strip()
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group()

        action = json.loads(response_text)
        return action if isinstance(action, dict) and "type" in action else {"type": "unknown"}
    except Exception as e:
        print(f"Error getting next step from image: {e}")
        return {"type": "unknown"}


def locate_element_on_screen(element_description: str) -> Optional[Tuple[int, int]]:
    """Hybrid location approach: OCR followed by AI Vision FALLBACK."""
    try:
        import pyautogui
        import pytesseract
        
        screenshot = pyautogui.screenshot()
        screenshot_path = "temp_screenshot.png"
        screenshot.save(screenshot_path)
        screen_width, screen_height = pyautogui.size()

        # METHOD 1: OCR
        try:
            custom_config = r'--oem 3 --psm 6'
            ocr_data = pytesseract.image_to_data(screenshot, config=custom_config, output_type=pytesseract.Output.DICT)
            for i, text in enumerate(ocr_data['text']):
                if text.strip() and element_description.lower() in text.lower():
                    if int(ocr_data['conf'][i]) > 60:
                        x = ocr_data['left'][i] + ocr_data['width'][i] // 2
                        y = ocr_data['top'][i] + ocr_data['height'][i] // 2
                        os.unlink(screenshot_path)
                        return (x, y)
        except Exception: pass

        # METHOD 2: AI Vision Fallback
        with open(screenshot_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        prompt = f"Find the clickable center of: \"{element_description}\". Return ONLY: {{\"x\": 123, \"y\": 456, \"confidence\": \"high|medium|low\"}}"
        
        payload = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": "You are a precision UI detector. Find exact pixel coordinates. Return ONLY JSON."},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}}
                ]}
            ],
            "temperature": 0.05
        }

        headers = {
            "Authorization": f"Bearer {_get_api_key()}",
            "Content-Type": "application/json"
        }

        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        response_text = r.json()["choices"][0]["message"]["content"].strip()
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            coords = json.loads(json_match.group())
            if coords.get("x") is not None and coords.get("y") is not None:
                os.unlink(screenshot_path)
                return (coords["x"], coords["y"])

        if os.path.exists(screenshot_path): os.unlink(screenshot_path)
        return None
    except Exception as e:
        print(f"Hybrid location error: {e}")
        return None
