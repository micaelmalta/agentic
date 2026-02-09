"""Utility functions."""


def capitalize_words(text: str) -> str:
    return " ".join(word.capitalize() for word in text.split())


def slugify(text: str) -> str:
    return text.lower().replace(" ", "-")
