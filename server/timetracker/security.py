import random
import base64
import string
import os
import hashlib

def generate_state():
    return "".join(random.choices(string.ascii_letters + string.digits, k=32))


def generate_code_verifier():
    return base64.urlsafe_b64encode(os.urandom(32)).rstrip(b"=").decode("utf-8")


def generate_code_challenge(verifier):
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("utf-8")