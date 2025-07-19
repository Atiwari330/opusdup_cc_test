from PIL import Image, ImageDraw

# Create simple blue square icons
sizes = [16, 48, 128]
color = (59, 130, 246)  # Blue color

for size in sizes:
    # Create new image with blue background
    img = Image.new('RGB', (size, size), color)
    
    # Add a white circle in center (microphone icon representation)
    draw = ImageDraw.Draw(img)
    margin = size // 4
    draw.ellipse([margin, margin, size-margin, size-margin], fill='white')
    
    # Save as PNG
    img.save(f'icon-{size}.png')
    print(f'Created icon-{size}.png')

print('Icons created successfully!')