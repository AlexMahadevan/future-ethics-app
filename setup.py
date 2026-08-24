#!/usr/bin/env python3
"""One-command setup for the LA workshop app.

    python3 setup.py                 # reads credentials already in config.js
    python3 setup.py pat_YOUR_TOKEN  # or pass a token, and it writes config.js

Builds the "Table Standards" table with the right fields. Safe to run twice —
it adds missing fields rather than duplicating them.

The token needs these scopes:
    data.records:read  data.records:write  schema.bases:read  schema.bases:write

If yours only has the data scopes, pass an existing base id as well:
    python3 setup.py pat_YOUR_TOKEN appXXXXXXXX
and build the table by hand from the field list this prints.
"""

import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request

API = "https://api.airtable.com/v0"
TABLE_NAME = "Table Standards"
BASE_NAME = "LA Visual Standards — Aug 26 2026"

FIELDS = [
    ("Table", "number"),
    ("Persona", "singleLineText"),
    ("Scribe", "singleLineText"),
    ("Stop — no label needed", "multilineText"),
    ("Stop — with a label", "multilineText"),
    ("Stop — we don't do this", "multilineText"),
    ("Disclosure line", "multilineText"),
    ("Holds — always real", "multilineText"),
    ("Holds — real people", "multilineText"),
    ("Holds — legal", "multilineText"),
    ("The 6 p.m. question", "multilineText"),
    ("Corrections", "multilineText"),
    ("Cards drawn", "singleLineText"),
    ("Status", "singleLineText"),
    ("Updated", "singleLineText"),
]


def field_spec(name, kind):
    spec = {"name": name, "type": kind}
    if kind == "number":
        spec["options"] = {"precision": 0}
    return spec


def call(url, token, method="GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code in (401, 403):
            raise NoSchemaAccess(body)
        raise SystemExit(f"\n  Airtable said {e.code}:\n  {body}\n")


class NoSchemaAccess(Exception):
    """The token can't read or write table schema — a very common PAT setup."""


def write_import_csv(here):
    """A CSV whose header row is the schema. Airtable builds the table from it."""
    path = os.path.join(here, "airtable-import.csv")
    headers = [name for name, _ in FIELDS]
    sample = {
        "Table": "1",
        "Persona": "The Sentinel",
        "Status": "delete this row",
        "Corrections": "{}",
    }
    with open(path, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(headers)
        w.writerow([sample.get(h, "") for h in headers])
    return path


def explain_no_schema_access(here, base_id):
    csv_path = write_import_csv(here)
    print(f"""
  Your token can read and write records, but it can't see or build tables.
  That is the scope the Baltimore app never needed. Two ways forward — the
  first also retires a token that has been public since May, so prefer it.

  A. New token (about a minute, and it rotates the old one)

     1. https://airtable.com/create/tokens  →  Create new token
     2. Scopes: data.records:read, data.records:write,
                schema.bases:read, schema.bases:write
     3. Access: the base {base_id}
     4. python3 setup.py pat_THE_NEW_TOKEN

  B. Import the schema by hand (works with the token you already have)

     Written for you: {csv_path}

     1. Open base {base_id} in Airtable
     2. Add a table  →  Import data  →  CSV file  →  pick that file
     3. Rename the new table to exactly: {TABLE_NAME}
     4. Delete the single sample row
     5. Nothing else to run — config.js already points at it

  Either way the app works offline-per-table in the meantime. What you lose
  until this is done is the swap round and the facilitator console.
""")


def read_existing_config():
    """Pull apiKey/baseId out of config.js so the token stays out of shell history."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.js")
    if not os.path.exists(path):
        return None, None
    with open(path) as fh:
        text = fh.read()

    def grab(key):
        m = re.search(key + r"\s*:\s*['\"]([^'\"]+)['\"]", text)
        return m.group(1) if m else None

    return grab("apiKey"), grab("baseId")


def main():
    args = [a.strip() for a in sys.argv[1:]]
    token = args[0] if args else None
    base_id = args[1] if len(args) > 1 else None

    from_config = False
    if not token:
        token, base_id = read_existing_config()
        if not token:
            raise SystemExit(__doc__)
        from_config = True
        print("  Using the credentials already in config.js.")

    if not token.startswith("pat"):
        raise SystemExit("  That doesn't look like a personal access token (should start with 'pat').")

    here = os.path.dirname(os.path.abspath(__file__))

    if not base_id:
        print("  Looking for an existing base…")
        try:
            bases = call(f"{API}/meta/bases", token).get("bases", [])
        except NoSchemaAccess:
            explain_no_schema_access(here, "your base")
            raise SystemExit(1)
        match = next((b for b in bases if b["name"] == BASE_NAME), None)
        if match:
            base_id = match["id"]
            print(f"  Reusing {BASE_NAME} ({base_id})")
        elif len(bases) == 1:
            base_id = bases[0]["id"]
            print(f"  Only one base on this token — using \"{bases[0]['name']}\" ({base_id})")
        elif not bases:
            print("  This token can't see any base. Grant it one at")
            print("  https://airtable.com/create/tokens, then rerun.")
            raise SystemExit(1)
        else:
            print("  This token can see several bases. Pick one and rerun:\n")
            for b in bases:
                print(f"    python3 setup.py <token> {b['id']}   # {b['name']}")
            raise SystemExit(1)

    print(f"  Checking tables in {base_id}…")
    try:
        build_table(token, base_id)
    except NoSchemaAccess:
        explain_no_schema_access(here, base_id)
        raise SystemExit(1)

    if from_config:
        print("\n  config.js already points at this table. Nothing to write.")
        print("  Local test:  python3 -m http.server 8000  →  http://localhost:8000\n")
        return

    write_config(here, token, base_id)


def build_table(token, base_id):
    tables = call(f"{API}/meta/bases/{base_id}/tables", token).get("tables", [])
    existing = next((t for t in tables if t["name"] == TABLE_NAME), None)

    if existing:
        have = {f["name"] for f in existing["fields"]}
        missing = [(n, k) for n, k in FIELDS if n not in have]
        if missing:
            print(f"  Adding {len(missing)} missing field(s)…")
            for name, kind in missing:
                call(
                    f"{API}/meta/bases/{base_id}/tables/{existing['id']}/fields",
                    token, "POST", field_spec(name, kind),
                )
                print(f"    + {name}")
        else:
            print("  Table already has every field.")
    else:
        print(f"  Creating '{TABLE_NAME}'…")
        call(
            f"{API}/meta/bases/{base_id}/tables",
            token, "POST",
            {"name": TABLE_NAME, "fields": [field_spec(n, k) for n, k in FIELDS]},
        )
        print("  Created.")


def write_config(here, token, base_id):
    with open(os.path.join(here, "config.js"), "w") as fh:
        fh.write(
            "// Written by setup.py. Workshop-only credentials — delete the token\n"
            "// in Airtable after Aug 26, 2026.\n\n"
            "const AIRTABLE_CONFIG = {\n"
            f"  apiKey: '{token}',\n"
            f"  baseId: '{base_id}',\n"
            f"  tableName: '{TABLE_NAME}',\n\n"
            "  get apiUrl() {\n"
            "    return 'https://api.airtable.com/v0/' + this.baseId + '/' + encodeURIComponent(this.tableName);\n"
            "  },\n"
            "};\n"
        )

    print("\n  Wrote config.js. You're set.")
    print("  Local test:  python3 -m http.server 8000  →  http://localhost:8000")
    print("  Then deploy: git add -A && git commit -m 'config' && git push\n")


if __name__ == "__main__":
    main()
