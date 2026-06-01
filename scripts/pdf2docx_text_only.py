"""Monkeypatch pdf2docx to text/table-only mode (no embedded images — Smallpdf-style)."""


def apply_text_only_patches() -> None:
    from pdf2docx.page.RawPageFitz import RawPageFitz
    from pdf2docx.shape.Paths import Paths

    def _no_images(self, **settings):  # noqa: ANN001
        return []

    def _shapes_only(
        self,
        min_svg_gap_dx=15,
        min_svg_gap_dy=15,
        min_w=2,
        min_h=2,
        clip_image_res_ratio=3.0,
    ):
        return self.to_shapes(), []

    RawPageFitz._preprocess_images = _no_images  # type: ignore[method-assign]
    Paths.to_shapes_and_images = _shapes_only  # type: ignore[method-assign]
