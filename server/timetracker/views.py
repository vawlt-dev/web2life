from django.shortcuts import render
from django.utils._os import safe_join
import posixpath
from pathlib import Path
from django.views.static import serve


def serve_react(request, path, document_root=None):
    path = posixpath.normpath(path).lstrip("/")
    if Path(safe_join(document_root, path)).is_file():
        return serve(request, path, document_root)
    else:
        return serve(request, "index.html", document_root)
