# Spec Delta

## ADDED Requirements

### Requirement: Supported media types
Every media path SHALL end in a supported extension: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` for images (also as `before`/`after`) and `.mp4`, `.webm` for videos. Video files SHALL only be referenced as `video`, images only as `image`, `before` or `after`.

#### Scenario: SVG image
- **WHEN** an entry references `image: media/logo.svg`
- **THEN** an error names the field `media.0.image` and lists the supported extensions, and the exit code is 1

#### Scenario: Video as image
- **WHEN** an entry references `image: media/flow.webm`
- **THEN** an error names the field `media.0.image` and the exit code is 1
