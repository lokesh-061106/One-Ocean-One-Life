from django import forms


class RichTextWidget(forms.Textarea):
    """Textarea upgraded to a WYSIWYG HTML editor by ``o3l/js/rich_text_editor.js``."""

    class Media:
        css = {"all": ("o3l/css/rich_text_editor.css",)}
        js = ("o3l/js/rich_text_editor.js",)

    def __init__(self, attrs=None):
        default_attrs = {
            "class": "o3l-richtext-source",
            "rows": 12,
            "spellcheck": "true",
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context["widget"]["editor"] = True
        return context
