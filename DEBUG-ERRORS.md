# Debugging Product Creation Errors

## Common Issues and Solutions

### 1. Check the Terminal Error Message
When you try to create a product, look at your backend server terminal. You should see:
- `Product creation request received`
- `Content-Type: ...`
- `Received product data: ...`
- `File uploaded: ...` or `File uploaded: none`
- Any error messages

**Please copy and paste the exact error message here.**

### 2. Common Errors:

#### Error: "Missing required fields"
- **Cause**: One or more required fields are empty
- **Solution**: Make sure all fields with * are filled in

#### Error: "Invalid price" or "Invalid stock"
- **Cause**: Price or stock is not a valid number
- **Solution**: Enter numbers only (e.g., 799.99, 15)

#### Error: "File upload error" or Multer errors
- **Cause**: Image file is too large or wrong format
- **Solution**: 
  - Use images under 5MB
  - Use formats: jpeg, jpg, png, gif, webp
  - Or use image URL instead

#### Error: "Failed to create product" or Database errors
- **Cause**: Database issue
- **Solution**: Check if database file exists and is accessible

### 3. Quick Test Without Image
Try creating a product with just an image URL (not file upload) to see if the issue is with file upload or something else.

### 4. Check Server Logs
The server should show detailed logs. Look for:
- `Error creating product:` followed by the error
- `Error stack:` showing where the error occurred

## What to Share
Please share:
1. The exact error message from the terminal
2. Whether you're uploading a file or using a URL
3. What fields you filled in


