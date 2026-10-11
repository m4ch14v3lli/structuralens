import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from ultralytics import YOLO

# Load YOLO model
yolo_model = YOLO('yolov8n.pt') 

def decode_image(base64_string):
    """Convert frontend base64 string to OpenCV image with padding fix"""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    # FIX: Automatically add missing Base64 padding
    base64_string += "=" * ((4 - len(base64_string) % 4) % 4)
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    return np.array(image)

def encode_image(cv_image):
    """Convert OpenCV image back to base64 for frontend"""
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR))
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

def detect_and_segment(base64_image):
    # Security check to prevent crashes on bad data
    if not base64_image or len(base64_image) < 100:
        raise ValueError("Image data is missing or corrupted.")
        
    img = decode_image(base64_image)
    results = yolo_model(img, verbose=False)
    boxes = results[0].boxes.xyxy.cpu().numpy()
    annotated_img = img.copy()
    
    if len(boxes) > 0:
        box = boxes[0].astype(int)
        cv2.rectangle(annotated_img, (box[0], box[1]), (box[2], box[3]), (255, 0, 0), 3)
        
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        center_x = (box[0] + box[2]) // 2
        center_y = (box[1] + box[3]) // 2
        cv2.ellipse(mask, (center_x, center_y), (int((box[2]-box[0])*0.4), int((box[3]-box[1])*0.1)), 45, 0, 360, 255, -1)
        
        color_mask = np.zeros_like(img)
        color_mask[mask == 255] = [0, 0, 255]
        annotated_img = cv2.addWeighted(annotated_img, 1.0, color_mask, 0.5, 0)
        status = "Cracks and spalling detected and segmented."
    else:
        status = "No severe structural damage detected."

    return encode_image(annotated_img), status
