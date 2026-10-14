import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "o3l.settings.development")
django.setup()

from django.db import connection

cur = connection.cursor()
cur.execute("SELECT c.relname, c.relkind FROM pg_class c WHERE c.relname LIKE %s", ["%slug%"])
print("pg_class:", cur.fetchall())
cur.execute(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename=%s",
    ["contributions"],
)
for row in cur.fetchall():
    print("IDX:", row[0], "|", row[1][:160])
cur.execute(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=%s AND column_name='slug'",
    ["contributions"],
)
print("column:", cur.fetchall())
