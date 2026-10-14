"""Seed the curated Ocean Sound Library from the sample folder in docs/Ocean Sound.

Creates the 3 top categories (plus the 5 marine-species groups), every sound item
(audio / photo / spectrogram / document), copies the media files into MEDIA_ROOT and
fills descriptions from the group .docx summaries.

Usage:
    python manage.py seed_ocean_sounds
    python manage.py seed_ocean_sounds --source "I:/path/to/Ocean Sound"
    python manage.py seed_ocean_sounds --dry-run
    python manage.py seed_ocean_sounds --no-descriptions
"""

import html
import re
import shutil
import zipfile
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from ocean_sounds.models import SoundCategory, SoundItem

DEFAULT_SOURCE = Path(settings.BASE_DIR).parent.parent / "docs" / "Ocean Sound"

DOC_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", ".csv"}

STRUCTURE = [
    {
        "name": "Environmental and Anthropogenic Audio Image Spect",
        "slug": "environmental-anthropogenic-audio-image-spect",
        "folder": "1 Environmental and Anthropogenic_Audio_Image_Spect",
        "icon": "🌊",
        "description": (
            "Non-biological ocean soundscapes: natural environmental events and weather, "
            "plus quiet-ambient recordings of the sea."
        ),
        "document": None,
        "document_name": "",
        "item_folders": [
            "1 Earthquake",
            "2 Ice Calving",
            "3 Ice Singing",
            "4 Quiet Ocean",
            "5 Rain",
            "6 Soundscape",
            "7 Thunderstorm",
        ],
        "groups": None,
    },
    {
        "name": "Anthropogenic Audio Image Spect",
        "slug": "anthropogenic-audio-image-spect",
        "folder": "2 Anthropogenic_Audio_Image_Spect",
        "icon": "🚢",
        "description": (
            "Human-made (anthropogenic) underwater sounds: vessels, surveying, "
            "construction and other offshore activity."
        ),
        "document": None,
        "document_name": "",
        "item_folders": [
            "1 Echosounder",
            "2 Large Vessel",
            "3 Pile Driving (Offshore Wind Energy Construction)",
            "4 Seismic (Oil & Gas)",
            "5 Small Vessel",
        ],
        "groups": None,
    },
    {
        "name": "Marine Species Audio Image Spectrogram",
        "slug": "marine-species-audio-image-spectrogram",
        "folder": "3 Marine Species_Audio_Image_Spectrogram",
        "icon": "🐋",
        "description": "Sounds produced by marine animals - whales, seals, fish and invertebrates.",
        "document": "SoundsPageCitations-2023-0 (only for Citation Purpose).pdf",
        "document_name": "Sounds & Citations 2023 (References)",
        "item_folders": None,
        "groups": [
            {
                "name": "Mysticetes (Baleen Whales)",
                "folder": "1 Mysticetes (Baleen Whales)",
                "document": "7 Marine Mammals - Mysticetes (Baleen Whales) (If Possible add these at respective places).docx",
                "document_name": "Mysticetes (Baleen Whales) - Summary",
                "item_folders": [
                    "1 Blue Whale",
                    "2 Fin Whale",
                    "3 Humpback Whale",
                    "4 Minke Whale",
                    "5 North Atlantic Right Whale",
                    "6 Sei Whale",
                ],
            },
            {
                "name": "Odontocetes (Toothed Whales)",
                "folder": "2 Odontocetes (Toothed Whales)",
                "document": "17 Odontocetes (Toothed Whales) (If Possible add these at respective places).docx",
                "document_name": "Odontocetes (Toothed Whales) - Summary",
                "item_folders": [
                    "1 Atlantic Spotted Dolphin",
                    "2 Atlantic White-sided Dolphin",
                    "3 Beluga Whale",
                    "4 Bottlenose Dolphin",
                    "5 Cuvier's Beaked Whale",
                    "6 Harbor Porpoise",
                    "7 Humpback Dolphin",
                    "8 Killer Whale",
                    "9 Northern Bottlenose Whale",
                    "10 Pilot Whale",
                    "11 Risso's Dolphin",
                    "12 Short-Beaked Common Dolphin",
                    "13 Sperm Whale",
                    "14 Striped Dolphin",
                    "15 True's Beaked Whale",
                    "16 White-Beaked Dolphin",
                ],
            },
            {
                "name": "Pinnipeds",
                "folder": "3 Pinnipeds",
                "document": "11 General Summary on each Pinnipeds.docx",
                "document_name": "Pinnipeds - General Summary",
                "item_folders": [
                    "1 Bearded Seal",
                    "2 Crabeater Seal",
                    "3 Gray Seal",
                    "4 Harbor Seal",
                    "5 Harp Seal",
                    "6 Leopard Seal",
                    "7 Northern Fur Seal",
                    "8 Ross Seal",
                    "9 Walrus",
                    "10 Weddell Seal",
                ],
            },
            {
                "name": "Teleosts (Bony Fish)",
                "folder": "4 Teleosts (Bony Fish)",
                "document": "8 Teleosts (Bony Fish).docx",
                "document_name": "Teleosts (Bony Fish) - Summary",
                "item_folders": [
                    "1 Atlantic cod fish",
                    "2 Black Drum",
                    "3 Black Grouper",
                    "4 Haddock",
                    "5 Red Grouper",
                    "6 Silver Perch",
                    "7 Toad Fish",
                ],
            },
            {
                "name": "Invertebrates",
                "folder": "5 Invertebrates",
                "document": None,
                "document_name": "",
                "item_folders": ["1 Snapping Shrimp"],
                # The summary .docx lives inside the item folder; used for the item
                # description and shown as the item's document link.
                "item_documents": {
                    "1 Snapping Shrimp": ("Invertebrates.docx", "Invertebrates - Summary"),
                },
            },
        ],
    },
]

# Paragraphs that open a taxonomy block or are link leftovers - never shown as description.
_SKIP_PARAGRAPHS = {
    "scientific classification",
    "taxonomic classification",
    "classification",
    "taxonomy",
    "about the species",
    "scientific name",
    "common name",
    "references",
    "reference",
}
_STOP_AT = {"scientific classification", "taxonomic classification", "taxonomy"}


def clean_name(folder_name):
    """'1 North Atlantic Right Whale' -> 'North Atlantic Right Whale'."""
    return re.sub(r"^\d+\s+", "", folder_name).strip()


def _normalize(text):
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def resolve_child(parent, name):
    """Find a child of `parent` by name, tolerant of apostrophe/spacing differences.

    The sample folders mix straight (') and typographic (') apostrophes.
    """
    direct = Path(parent) / name
    if direct.exists():
        return direct
    wanted = _normalize(name)
    if Path(parent).is_dir():
        for child in Path(parent).iterdir():
            if _normalize(child.name) == wanted:
                return child
    return direct


def docx_paragraphs(path):
    """Plain-text paragraphs of a .docx (no third-party dependency)."""
    try:
        with zipfile.ZipFile(path) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
    except (OSError, KeyError, zipfile.BadZipFile):
        return []
    paragraphs = []
    for chunk in re.findall(r"<w:p[ >].*?</w:p>|<w:p/>", xml, re.S):
        text = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", chunk, re.S))
        text = html.unescape(re.sub(r"<[^>]+>", "", text)).strip()
        if text:
            paragraphs.append(text)
    return paragraphs


def extract_descriptions(path, item_names, title=""):
    """Split a group .docx into a group intro + one description per item.

    The sample documents list every species as its own heading paragraph, followed by
    its text and a 'Scientific Classification' block.
    """
    paragraphs = docx_paragraphs(path)
    if not paragraphs:
        return "", {name: "" for name in item_names}

    headings = []
    cursor = 0
    for name in item_names:
        wanted = _normalize(name)
        found = None
        for index in range(cursor, len(paragraphs)):
            if _normalize(paragraphs[index]) == wanted:
                found = index
                break
        if found is None:
            for index in range(cursor, len(paragraphs)):
                if wanted in _normalize(paragraphs[index]):
                    found = index
                    break
        if found is not None:
            headings.append((name, found))
            cursor = found + 1

    if headings:
        intro = paragraphs[: headings[0][1]]
        if title and intro and _normalize(intro[0]) == _normalize(title):
            intro = intro[1:]
    else:
        intro = paragraphs[:1]

    group_description = "\n\n".join(
        paragraph
        for paragraph in intro
        if _normalize(paragraph) not in _SKIP_PARAGRAPHS and " | " not in paragraph
    )

    descriptions = {name: "" for name in item_names}
    for position, (name, start) in enumerate(headings):
        end = headings[position + 1][1] if position + 1 < len(headings) else len(paragraphs)
        body = []
        for paragraph in paragraphs[start + 1 : end]:
            normalized = _normalize(paragraph)
            if normalized in _STOP_AT:
                break
            if normalized in _SKIP_PARAGRAPHS:
                continue
            if " | " in paragraph:
                continue
            if re.fullmatch(r"[A-Z][a-z]+\s+[a-z]+", paragraph):
                continue  # the scientific-name line directly under the heading
            body.append(paragraph)
        descriptions[name] = "\n\n".join(body)
    return group_description, descriptions


class Command(BaseCommand):
    help = "Seed the Ocean Sound Library (categories, sounds, media files) from docs/Ocean Sound."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Path to the 'Ocean Sound' sample folder")
        parser.add_argument("--dry-run", action="store_true", help="Show what would be created without writing")
        parser.add_argument("--no-copy", action="store_true", help="Do not copy media files, only create records")
        parser.add_argument("--no-descriptions", action="store_true", help="Skip .docx description extraction")
        parser.add_argument("--force-copy", action="store_true", help="Re-copy media files even if already present")

    def handle(self, *args, **options):
        source = Path(options["source"])
        if not source.exists():
            raise CommandError(f"Source folder not found: {source}")

        self.dry_run = options["dry_run"]
        self.copy_files = not options["no_copy"]
        self.with_descriptions = not options["no_descriptions"]
        self.force_copy = options["force_copy"]
        self.media_root = Path(settings.MEDIA_ROOT)
        self.created_categories = 0
        self.updated_categories = 0
        self.created_items = 0
        self.updated_items = 0
        self.copied_files = 0
        self.descriptions_found = 0
        self.missing_files = []

        for category_spec in STRUCTURE:
            self._seed_category(source, category_spec, parent=None)

        if self.dry_run:
            self.stdout.write(self.style.WARNING("Dry run - no changes were written."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Categories: {self.created_categories} created / {self.updated_categories} updated | "
                f"Sounds: {self.created_items} created / {self.updated_items} updated | "
                f"Files copied: {self.copied_files} | Descriptions: {self.descriptions_found} | "
                f"Missing: {len(self.missing_files)}"
            )
        )
        for missing in self.missing_files:
            self.stdout.write(self.style.WARNING(f"  missing: {missing}"))

    # ------------------------------------------------------------- categories
    def _seed_category(self, source, spec, parent):
        folder = source / spec["folder"]
        category = self._save_category(spec, parent)
        self._attach_document(category, folder, spec.get("document"), spec.get("document_name", ""))

        if spec.get("item_folders"):
            _, descriptions = self._descriptions(folder, spec, spec["item_folders"])
            for order, item_folder in enumerate(spec["item_folders"], start=1):
                self._seed_item(folder, item_folder, category, order, descriptions.get(item_folder, ""))

        for group in spec.get("groups") or []:
            group_folder = resolve_child(folder, group["folder"])
            group_category = self._save_category(
                {
                    "name": group["name"],
                    "slug": slugify(group["name"]),
                    "icon": spec.get("icon", ""),
                },
                category,
            )
            self._attach_document(group_category, group_folder, group.get("document"), group.get("document_name", ""))
            group_description, descriptions = self._descriptions(group_folder, group, group["item_folders"])
            self._apply_description(group_category, group_description)
            for order, item_folder in enumerate(group["item_folders"], start=1):
                self._seed_item(
                    group_folder,
                    item_folder,
                    group_category,
                    order,
                    descriptions.get(item_folder, ""),
                    document_display_name=(group.get("item_documents") or {}).get(item_folder, (None, ""))[1],
                )
        return category

    def _save_category(self, spec, parent):
        slug = spec["slug"]
        defaults = {
            "name": spec["name"],
            "parent": parent,
            "icon": spec.get("icon", ""),
        }
        if "description" in spec:
            defaults["description"] = spec.get("description", "")
        if self.dry_run:
            if SoundCategory.objects.filter(slug=slug).exists():
                self.updated_categories += 1
            else:
                self.created_categories += 1
            return SoundCategory(slug=slug, **defaults)
        category, created = SoundCategory.objects.update_or_create(slug=slug, defaults=defaults)
        if created:
            self.created_categories += 1
        else:
            self.updated_categories += 1
        return category

    def _apply_description(self, category, description):
        if not description or self.dry_run:
            return
        if category.description and category.description.strip():
            return
        category.description = description
        category.save(update_fields=["description"])

    def _descriptions(self, folder, spec, item_folders):
        """(group intro, per-item descriptions) parsed from the group .docx."""
        if not self.with_descriptions or not item_folders:
            return "", {}

        path = None
        document = spec.get("document")
        if document and str(document).lower().endswith(".docx"):
            path = resolve_child(folder, document)
        else:
            item_documents = spec.get("item_documents") or {}
            for item_folder in item_documents:
                if item_folder in item_folders:
                    item_path = resolve_child(folder, item_folder)
                    path = resolve_child(item_path, item_documents[item_folder][0])
                    break
        if not path or not path.exists():
            return "", {}

        names = [clean_name(item_folder) for item_folder in item_folders]
        group_description, descriptions = extract_descriptions(path, names, title=spec.get("name", ""))
        result = {}
        for item_folder, name in zip(item_folders, names):
            text = descriptions.get(name, "")
            if text:
                self.descriptions_found += 1
            result[item_folder] = text
        return group_description, result

    # ------------------------------------------------------------------ items
    def _seed_item(self, folder, item_folder, category, order, description, document_display_name=""):
        item_path = resolve_child(folder, item_folder)
        if not item_path.is_dir():
            self.missing_files.append(str(item_path))
            return

        base_name = clean_name(item_path.name)
        sets = self._media_sets(item_path, base_name)
        if not sets:
            self.missing_files.append(f"{item_path} (no audio found)")
            return

        for position, media in enumerate(sets, start=1):
            name = media.pop("name")
            slug = slugify(name) if len(sets) == 1 else f"{slugify(base_name)}-{position}"
            documents = list(media["documents"])

            defaults = {
                "name": name,
                "category": category,
                "description": description if position == 1 else "",
                "sort_order": (order - 1) * 10 + position,
                "audio_file": self._store(media["audio"], "audio", slug),
                "photo_file": self._store(media["photo"], "photos", slug),
                "spectrogram_file": self._store(media["spectrogram"], "spectrograms", slug),
            }
            if documents:
                stored = self._store(documents[0], "docs", f"{slug}-doc")
                defaults["document"] = stored
                defaults["document_name"] = document_display_name
            elif document_display_name and len(sets) == 1:
                defaults["document_name"] = document_display_name

            if self.dry_run:
                if SoundItem.objects.filter(slug=slug).exists():
                    self.updated_items += 1
                else:
                    self.created_items += 1
                continue

            item, created = SoundItem.objects.update_or_create(slug=slug, defaults=defaults)
            if created:
                self.created_items += 1
                continue
            self.updated_items += 1
            if description and not item.description:
                item.description = description
                item.save(update_fields=["description"])

    def _media_sets(self, item_path, base_name):
        """Return one entry per set of audio/photo/spectrogram files in a folder.

        Handles folders holding a single set directly and folders holding several
        numbered sets (e.g. North Atlantic Right Whale 1 / 2).
        """
        files = self._classify(item_path)
        if files["audio"]:
            return [{"name": base_name, **files}]

        subsets = []
        for child in sorted(path for path in item_path.iterdir() if path.is_dir()):
            child_files = self._classify(child)
            if child_files["audio"]:
                subsets.append(child_files)
        results = []
        for position, child_files in enumerate(subsets, start=1):
            name = base_name if position == 1 else f"{base_name} ({position})"
            results.append({"name": name, **child_files})
        return results

    def _classify(self, folder):
        audio = photo = spectrogram = None
        documents = []
        for path in sorted(folder.iterdir()):
            if not path.is_file():
                continue
            lowered = path.name.lower()
            if lowered.startswith("audio_"):
                audio = path
            elif lowered.startswith("photo_"):
                photo = path
            elif lowered.startswith("spec_"):
                spectrogram = path
            elif path.suffix.lower() in DOC_EXTENSIONS:
                documents.append(path)
        return {"audio": audio, "photo": photo, "spectrogram": spectrogram, "documents": documents}

    # ------------------------------------------------------------------ media
    def _attach_document(self, category, folder, document, document_name):
        if not document:
            return
        path = folder / document
        if not path.exists():
            self.missing_files.append(str(path))
            return
        stored = self._store(path, "docs", f"{category.slug}-ref")
        if self.dry_run or not stored:
            return
        category.document = stored
        category.document_name = document_name or category.document_name
        category.save(update_fields=["document", "document_name"])

    def _store(self, source_path, subfolder, basename):
        """Copy a source file to MEDIA_ROOT/sounds/library/<subfolder>/<basename><ext>."""
        if not source_path:
            return ""
        source_path = Path(source_path)
        if not source_path.exists():
            self.missing_files.append(str(source_path))
            return ""
        suffix = source_path.suffix.lower()
        relative = f"sounds/library/{subfolder}/{basename}{suffix}".replace("\\", "/")
        if not self.copy_files:
            return relative
        target = self.media_root / relative
        if self.dry_run:
            if not target.exists() or target.stat().st_size != source_path.stat().st_size:
                self.copied_files += 1
            return relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if self.force_copy or not target.exists() or target.stat().st_size != source_path.stat().st_size:
            shutil.copy2(source_path, target)
            self.copied_files += 1
        return relative
