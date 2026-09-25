"""
Añade las traducciones extra al español al archivo .mo de futurecoder y guarda
también una copia legible (.po) para poder revisarla o editarla.

    python -m translations.extra.apply_extra_es
"""
from pathlib import Path

import polib

from translations.extra import es_creating_key_value_pairs as extra

locale_dir = Path(__file__).parent.parent / "locales/es/LC_MESSAGES"
mo_path = locale_dir / "futurecoder.mo"
po_path = locale_dir / "futurecoder.po"


def main():
    mo = polib.mofile(str(mo_path))
    by_id = {e.msgid: e for e in mo}

    for msgid, msgstr in extra.all_entries():
        entry = by_id.get(msgid)
        if entry:
            entry.msgstr = msgstr
        else:
            entry = polib.MOEntry(msgid=msgid, msgstr=msgstr)
            mo.append(entry)
            by_id[msgid] = entry

    for msgid, replacements in extra.FIXES.items():
        entry = by_id[msgid]
        for old, new in replacements:
            entry.msgstr = entry.msgstr.replace(old, new)

    mo.save(str(mo_path))

    po = polib.POFile()
    po.metadata = mo.metadata
    for entry in sorted(mo, key=lambda e: e.msgid):
        po.append(polib.POEntry(msgid=entry.msgid, msgstr=entry.msgstr))
    po.save(str(po_path))
    print(f"Guardado {mo_path} ({len(mo)} cadenas)")


if __name__ == "__main__":
    main()
