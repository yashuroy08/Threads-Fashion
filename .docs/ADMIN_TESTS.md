# Admin Product Page Tests (New Features)

Let's test the specific improvements we just made to the Admin Product Page.

---

## 🧪 **TEST 1: Main Image Color Isolation**
**Goal:** Verify that the "Black" main image disappears when "Blue" is selected by the customer.

**Steps:**
1.  Go to **Admin** -> **Edit Product** (your Jacket).
2.  Go to **Media** tab.
3.  Find "Default / Cover Image".
4.  In the new **Color** box, type: `Black`
5.  Click **Save Changes**.
6.  Go to the **Product Page** (Customer View).
7.  Select **Black Swatch** -> Should see Main Image ✅
8.  Select **Blue Swatch** -> Should **NOT** see Black Main Image anymore ✅

---

## 🧪 **TEST 2: Stock Level Warning**
**Goal:** Remove the red "10 left" warning by increasing stock.

**Steps:**
1.  Go to **Admin** -> **Edit Product**.
2.  Go to **Variants** tab.
3.  Find a variant (e.g., M / Blue) that has 10 stock.
4.  Change stock to **25**.
5.  Click **Save Changes**.
6.  Go to **Product Page**.
7.  Select M / Blue.
8.  Warning "10 left" should be gone ✅

---

## 🧪 **TEST 3: Auto-Generate "Ghost" Variants**
**Goal:** Ensure incomplete variants (missing size/color) are ignored and don't break the page.

**Steps:**
1.  Go to **Admin** -> **Variants** tab.
2.  Click "Add Variant".
3.  Leave Size empty.
4.  Enter Color: `Green`.
5.  Enter Stock: `50`.
6.  Click **Save Changes**.
    *   *The system should auto-clean this invalid entry.*
7.  Reload the page (Edit again).
8.  The "Green/Empty" variant should be **gone** ✅

---

## 🧪 **TEST 4: Image Slots Auto-Generator**
**Goal:** Test the "Auto-Generate Color Slots" button effectiveness.

**Steps:**
1.  Create a **New Product**.
2.  Go to **Variants** tab.
3.  Add:
    *   M / Red
    *   M / Blue
    *   M / Green
4.  Go to **Media** tab.
5.  Click **"Auto-Generate Color Slots"**.
6.  **Verify:** 3 new image upload boxes should appear (one for Red, Blue, Green) ✅

---

**Let me know which of these you try and if they pass!** 🚀
