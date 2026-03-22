from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable, List


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")
VECTOR_DIM = 64


def tokenize(text: str) -> List[str]:
    return TOKEN_RE.findall((text or "").lower())


def embed_text(text: str, dim: int = VECTOR_DIM) -> List[float]:
    counts = Counter(tokenize(text))
    vector = [0.0] * dim
    for token, count in counts.items():
        idx = hash(token) % dim
        vector[idx] += float(count)
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


def cosine_similarity(a: Iterable[float], b: Iterable[float]) -> float:
    a_list = list(a)
    b_list = list(b)
    return sum(x * y for x, y in zip(a_list, b_list))
