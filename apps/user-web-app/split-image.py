from PIL import Image

# Open the image
img_path = r"c:\payparq.ai\apps\user-web-app\public\email-images\original.png"
img = Image.open(img_path)

width, height = img.size
print(f"Image size: {width}x{height}")

# Split into top half and bottom half
mid = height // 2

# Top half
top_half = img.crop((0, 0, width, mid))
top_path = r"c:\payparq.ai\apps\user-web-app\public\email-images\top-half.png"
top_half.save(top_path)
print(f"Saved top half: {top_path}")

# Bottom half
bottom_half = img.crop((0, mid, width, height))
bottom_path = r"c:\payparq.ai\apps\user-web-app\public\email-images\bottom-half.png"
bottom_half.save(bottom_path)
print(f"Saved bottom half: {bottom_path}")
