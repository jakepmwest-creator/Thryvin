#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

# Create a clean, professional logo for Thryvin
width, height = 800, 200
img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
draw = ImageDraw.Draw(img)

# Try to use a nice font, fallback to default
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
except:
    font = ImageFont.load_default()

# Draw text in purple gradient color
text = "THRYVIN"
# Get text bounding box
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Center text
x = (width - text_width) // 2
y = (height - text_height) // 2

# Draw with purple color
draw.text((x, y), text, fill=(162, 89, 255, 255), font=font)

# Save
img.save('/app/apps/native/assets/images/thryvin-logo-text.png', 'PNG', optimize=True)
print(f"Created text logo: {img.size}")
print(f"Text size: {text_width}x{text_height}")
