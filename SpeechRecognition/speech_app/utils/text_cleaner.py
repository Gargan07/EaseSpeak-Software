import re

def clean_disfluencies(text: str) -> str:
    """Remove stutters, fillers, and repeated words."""
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # repeated words
    text = re.sub(r'\b(\w+)-+\1\b', r'\1', text)    # stutter
    text = re.sub(r'uh+|um+', '', text)             # filler words
    return text.strip()
