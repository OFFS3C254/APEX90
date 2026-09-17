import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("public/icons", exist_ok=True)

def create_icon(size, is_maskable=False):
    img = Image.new("RGBA", (size, size), (9, 10, 15, 255))
    draw = ImageDraw.Draw(img)

    center = size / 2
    padding = size * 0.12 if is_maskable else size * 0.08
    radius = (size / 2) - padding

    # Outer glow circle
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=(18, 20, 30, 255),
        outline=(124, 58, 237, 255), # Vivid purple
        width=max(2, int(size * 0.03))
    )

    # Inner hexagon/diamond polygon
    poly_points = [
        (center, center - radius * 0.75),
        (center + radius * 0.7, center - radius * 0.25),
        (center + radius * 0.7, center + radius * 0.35),
        (center, center + radius * 0.8),
        (center - radius * 0.7, center + radius * 0.35),
        (center - radius * 0.7, center - radius * 0.25),
    ]
    draw.polygon(poly_points, fill=(28, 24, 52, 255), outline=(139, 92, 246, 255))

    # Draw bold sports "A" and "90"
    # Fallback to bold geometric shapes if system font isn't available
    # Top chevron of "A"
    apex_top = center - radius * 0.45
    apex_bottom = center + radius * 0.35
    leg_offset = radius * 0.42
    bar_thick = max(3, int(size * 0.055))

    # Left leg of A
    draw.line([(center, apex_top), (center - leg_offset, apex_bottom)], fill=(255, 255, 255, 255), width=bar_thick)
    # Right leg of A
    draw.line([(center, apex_top), (center + leg_offset, apex_bottom)], fill=(124, 58, 237, 255), width=bar_thick)
    # Crossbar
    bar_y = center + radius * 0.05
    draw.line([(center - leg_offset * 0.55, bar_y), (center + leg_offset * 0.55, bar_y)], fill=(255, 255, 255, 255), width=bar_thick)

    # Accent neon dot (live sports green)
    dot_radius = max(3, int(size * 0.04))
    draw.ellipse(
        [center - dot_radius, apex_top - dot_radius * 2.2, center + dot_radius, apex_top - dot_radius * 0.2],
        fill=(16, 185, 129, 255) # Emerald
    )

    return img

# Generate all sizes
create_icon(192).save("public/icons/icon-192x192.png")
create_icon(512).save("public/icons/icon-512x512.png")
create_icon(512, is_maskable=True).save("public/icons/icon-maskable-512x512.png")
create_icon(180).save("public/icons/apple-touch-icon.png")
create_icon(32).save("public/favicon.ico")

print("Generated all PWA icons successfully!")
