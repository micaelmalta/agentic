"""Tests for utility functions."""

from src.utils import capitalize_words, slugify


def test_capitalize_words():
    assert capitalize_words("hello world") == "Hello World"


def test_capitalize_single_word():
    assert capitalize_words("hello") == "Hello"


def test_slugify():
    assert slugify("Hello World") == "hello-world"


def test_slugify_already_lowercase():
    assert slugify("already lowercase") == "already-lowercase"
