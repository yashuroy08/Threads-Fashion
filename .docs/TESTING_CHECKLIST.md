# Product Variant Validation - Testing Checklist

**Date:** 2026-01-24T22:14:33+05:30  
**Tester:** You  
**Component:** Admin Product Form (Variant & Image Validation)

---

## 🎯 Test Objectives

1. Verify client-side validation catches errors before submission
2. Confirm backend validation provides clear error messages
3. Ensure info box displays correct available colors
4. Validate success paths work correctly

---

## ✅ Test Scenarios

### **Test 1: Duplicate Variant Detection** (Client-Side)
**Priority:** HIGH  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Navigate to Admin → Products → Create New Product
2. Fill in basic details (title, description, price, category)
3. Go to "Variants" tab
4. Add variant: Size = "M", Color = "Blue", Stock = 10
5. Add another variant: Size = "M", Color = "Blue", Stock = 5 (duplicate!)
6. Click "Save Changes"

**Expected Result:**
- ❌ Error toast appears: "Duplicate variant found: M / Blue. Please remove duplicates."
- Form does NOT submit
- No backend API call is made

**Actual Result:**
_[Fill in after testing]_

---

### **Test 2: Image Color Mismatch** (Client-Side)
**Priority:** HIGH  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create/Edit a product
2. Go to "Variants" tab
3. Add variant: Size = "M", Color = "Blue", Stock = 10
4. Go to "Media" tab
5. Verify info box shows "Available colors: Blue"
6. Add additional image with Color = "Black" (mismatch!)
7. Click "Save Changes"

**Expected Result:**
- ❌ Error toast: "Image 2: Color 'Black' doesn't match any variant. Available colors: blue"
- Form does NOT submit
- Info box correctly shows only "Blue" as available

**Actual Result:**
_[Fill in after testing]_

---

### **Test 3: Negative Stock Validation** (Client-Side)
**Priority:** MEDIUM  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create/Edit a product
2. Go to "Variants" tab
3. Add variant: Size = "L", Color = "Red", Stock = -5 (negative!)
4. Click "Save Changes"

**Expected Result:**
- ❌ Error toast: "Variant L/Red: Stock cannot be negative"
- Form does NOT submit

**Actual Result:**
_[Fill in after testing]_

---

### **Test 4: Info Box Live Updates** (UI)
**Priority:** MEDIUM  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create a new product
2. Go to "Media" tab first
3. Verify NO info box appears (no variants yet)
4. Go to "Variants" tab
5. Add variant: Size = "S", Color = "Red", Stock = 10
6. Go back to "Media" tab
7. Verify info box appears showing "Available colors: Red"
8. Add another variant: Size = "M", Color = "Blue", Stock = 10
9. Go back to "Media" tab
10. Verify info box now shows "Available colors: Red, Blue"

**Expected Result:**
- Info box appears/disappears based on variant existence
- Color list updates in real-time
- All variants' colors are shown

**Actual Result:**
_[Fill in after testing]_

---

### **Test 5: Success Path - Valid Product** (End-to-End)
**Priority:** HIGH  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create a new product with:
   - Title: "Test Validation Product"
   - Description: 20+ words
   - Price: 1999
   - Parent Category: Any
   - Child Category: Any
2. Go to "Variants" tab
3. Add variants:
   - M / Blue / 10
   - L / Blue / 5
   - M / Red / 8
4. Go to "Media" tab
5. Add main image (no color)
6. Add additional image with Color = "Blue"
7. Add additional image with Color = "Red"
8. Click "Save Changes"

**Expected Result:**
- ✅ Success toast: "Product created successfully!"
- Product is saved to database
- Redirected to product list
- sizes array = ["M", "L"] (auto-synced from variants)
- colors array = ["Blue", "Red"] (auto-synced from variants)

**Actual Result:**
_[Fill in after testing]_

---

### **Test 6: Backend Validation (Bypassing Client)** (API)
**Priority:** MEDIUM  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste and execute this code:

```javascript
fetch('/api/v1/admin/products', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Add your auth token if needed
    },
    body: JSON.stringify({
        title: "Backend Test",
        slug: "backend-test-" + Date.now(),
        description: "This is a test product with at least twenty words to satisfy the description validation requirement for the backend system.",
        price: { amount: 199900, currency: 'INR' },
        images: [
            { url: "https://example.com/1.jpg", altText: "Main", color: "Purple" }
        ],
        variants: [
            { size: "M", color: "Blue", stock: 10 }
        ],
        parentCategoryId: "YOUR_PARENT_CATEGORY_ID",
        childCategoryId: "YOUR_CHILD_CATEGORY_ID",
        stock: 10
    })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

**Expected Result:**
- ❌ 400 Bad Request
- Error message: "Image 1: Color 'Purple' doesn't match any variant. Available: blue"
- Backend validation catches what client validation would have caught

**Actual Result:**
_[Fill in after testing]_

---

### **Test 7: Auto-Generate Combinations Button** (Feature)
**Priority:** LOW  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create/Edit a product
2. Go to "Variants" tab
3. Manually add a few variants (e.g., M/Blue, L/Red)
4. Note the current stock values
5. Click "Auto-Generate Combinations" button
6. Verify all size/color combinations are created
7. Verify existing stock values are preserved

**Expected Result:**
- All combinations generated
- Existing stock preserved
- New combinations have stock = 0

**Actual Result:**
_[Fill in after testing]_

---

### **Test 8: Color Image Slots Button** (Feature)
**Priority:** LOW  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create/Edit a product
2. Add variants with colors: Blue, Red, Black
3. Go to "Media" tab
4. Click "Auto-Generate Color Slots" button
5. Verify image slots are created for each color

**Expected Result:**
- 3 image slots created (one per color)
- Each slot has the color pre-filled
- No duplicates

**Actual Result:**
_[Fill in after testing]_

---

### **Test 9: Incomplete Variant Filtering** (Edge Case)
**Priority:** LOW  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create a new product
2. Go to "Variants" tab
3. Add complete variant: M / Blue / 10
4. Add incomplete variant: (empty size) / Red / 5
5. Add incomplete variant: L / (empty color) / 8
6. Click "Save Changes"

**Expected Result:**
- Only the complete variant (M/Blue/10) is sent to backend
- Incomplete variants are silently filtered out
- Product saves successfully
- Success toast appears

**Actual Result:**
_[Fill in after testing]_

---

### **Test 10: Update Existing Product** (Regression)
**Priority:** HIGH  
**Status:** [ ] Not Started | [ ] Passed | [ ] Failed

**Steps:**
1. Create a valid product first (follow Test 5)
2. Go to product list
3. Click "Edit" on the newly created product
4. Verify form loads correctly with existing data
5. Change a variant's stock value
6. Click "Save Changes"

**Expected Result:**
- ✅ Success toast: "Product updated successfully!"
- Changes are saved
- No validation errors (unless you introduce invalid data)

**Actual Result:**
_[Fill in after testing]_

---

## 📊 Summary

| Test | Status | Priority | Notes |
|------|--------|----------|-------|
| 1. Duplicate Variant | ⏸️ | HIGH | |
| 2. Image Color Mismatch | ⏸️ | HIGH | |
| 3. Negative Stock | ⏸️ | MEDIUM | |
| 4. Info Box Updates | ⏸️ | MEDIUM | |
| 5. Success Path | ⏸️ | HIGH | |
| 6. Backend Validation | ⏸️ | MEDIUM | |
| 7. Auto-Generate Combos | ⏸️ | LOW | |
| 8. Color Image Slots | ⏸️ | LOW | |
| 9. Incomplete Filtering | ⏸️ | LOW | |
| 10. Update Product | ⏸️ | HIGH | |

**Overall Status:** [ ] All Passed | [ ] Some Failed | [ ] In Progress

---

## 🐛 Issues Found

_Document any bugs or unexpected behavior here:_

1. 
2. 
3. 

---

## ✅ Sign-off

- [ ] All HIGH priority tests passed
- [ ] All validation errors are clear and helpful
- [ ] Info box updates correctly
- [ ] Success messages appear
- [ ] Ready for production

**Tested By:** _______________  
**Date:** _______________  
**Approved:** [ ] Yes | [ ] No (needs fixes)
