# Spec Delta

## ADDED Requirements

### Requirement: Image viewer
Clicking an entry image SHALL open it in a modal viewer over the page instead of a new tab, showing the image at up to the viewport size with its caption. The viewer SHALL offer previous and next for the other images of the same entry, react to the arrow keys, and close with Escape, a close button or a click outside the image. Clicks with a modifier key SHALL keep the browser's default behavior.

#### Scenario: Open image
- **WHEN** a reviewer clicks the after image of an entry
- **THEN** a modal shows that image and the page stays in place behind it

#### Scenario: Step to the before image
- **WHEN** the viewer shows the after image and the reviewer presses the left arrow key
- **THEN** the viewer shows the before image of the same entry

#### Scenario: Without JavaScript
- **WHEN** scripts are disabled and a reviewer clicks an image
- **THEN** the image opens as a page in the same tab
