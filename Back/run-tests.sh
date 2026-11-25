#!/bin/sh
set -e
cd "$(dirname "$0")"
DJANGO_SETTINGS_MODULE=config.settings_testsqlite exec .venv/bin/python manage.py "$@"
