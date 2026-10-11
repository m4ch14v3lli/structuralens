import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

def decode_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    base64_string += "=" * ((4 - len(base64_string) % 4) % 4)
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    return np.array(image)

def encode_image(cv_image):
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR))
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

def simulate_repair(base64_image):
    # 1. Decode original image
    img = decode_image(base64_image)
    
    # 2. Automatically find the dark cracks in the image
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    # Thresholding: Finds the darkest areas (the deep cracks)
    _, mask = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
    
    # Expand the mask slightly to cover the crack edges
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)
    
    # 3. AI Inpainting (Telea Algorithm)
    # This magically "heals" the crack by bleeding the surrounding brick/concrete texture into the masked area
    repaired_img = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
    
    return encode_image(repaired_img)
