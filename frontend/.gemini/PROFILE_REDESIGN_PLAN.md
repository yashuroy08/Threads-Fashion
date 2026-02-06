# Profile Page Redesign - Implementation Plan

## Overview
Complete redesign of the Profile page to match the reference design with clean, modern UI for both mobile and desktop.

## Design Requirements (from reference images)

### Mobile Layout:
1. **User Card** (top section)
   - Circular avatar with gradient background and initials
   - User name and email
   - Logout button (outlined, red)

2. **Tab Navigation**
   - Account Settings
   - My Orders  
   - Help & Support
   - Horizontal scroll on mobile

3. **Account Settings Tab**
   - Section: "Account Information"
   - Menu items with icons:
     - Personal Information (blue user icon)
     - Saved Addresses (green location icon)
     - Payment Methods (purple card icon)
     - Notifications (orange bell icon)

4. **My Orders Tab**
   - Section: "Order History"
   - Order cards showing:
     - Order ID
     - Date
     - Status badge (colored: pending/delivered/cancelled)
     - Item count
     - Total amount
     - "View Details" button

5. **Help & Support Tab**
   - Section: "Help & Support"
   - Menu items:
     - FAQs
     - Contact Support
     - Return & Refund Policy
     - Track Order

### Desktop Layout:
- "My Profile" header with logout in top right
- Same tab navigation (horizontal)
- Wider, more spacious layout
- No user card (cleaner design)

## Implementation Steps

### Step 1: Update Profile.tsx Structure
- Simplify component to use tab-based navigation
- Remove complex state management where not needed
- Add user initials generation
- Implement clean tab switching

### Step 2: Create Sub-Routes (Optional)
- /profile/account - Account Settings
- /profile/orders - My Orders
- /profile/help - Help & Support

### Step 3: Component Sections

#### Account Settings Section:
```tsx
<div className="menu-list">
  <Link to="/profile/personal-info" className="menu-item">
    <div className="menu-icon blue">
      <User size={20} />
    </div>
    <div className="menu-content">
      <div className="menu-title">Personal Information</div>
      <div className="menu-description">Name, email, phone</div>
    </div>
    <ChevronRight className="menu-arrow" size={20} />
  </Link>
  {/* More items... */}
</div>
```

#### Order History Section:
```tsx
<div className="order-card">
  <div className="order-header">
    <div className="order-id-section">
      <div className="order-id">ORD-{orderId}</div>
      <div className="order-date">{date}</div>
    </div>
    <span className="order-status pending">PENDING</span>
  </div>
  <div className="order-details">
    <span className="order-items-count">{itemCount} items</span>
    <span className="order-total">₹{total}</span>
  </div>
  <button className="view-details-btn">View Details</button>
</div>
```

### Step 4: Responsive Behavior
- Mobile: Show user card, compact layout
- Desktop: Hide user card, show header with logout
- Tab navigation scrollable on mobile
- Proper spacing adjustments

### Step 5: Icon Colors
- Personal Info: Blue (#3b82f6)
- Saved Addresses: Green (#22c55e)
- Payment Methods: Purple (#a855f7)
- Notifications: Orange (#f97316)

### Step 6: Status Badge Colors
- Pending: Yellow background (#fef3c7), dark yellow text
- Delivered: Green background (#d1fae5), dark green text
- Cancelled: Red background (#fee2e2), dark red text
- Processing: Blue background (#dbeafe), dark blue text

## Files to Modify
1. ✅ `/frontend/src/styles/profile.css` - Complete CSS redesign (DONE)
2. `/frontend/src/pages/Profile.tsx` - Component restructure (NEXT)
3. Potentially create sub-components:
   - `ProfileAccountSettings.tsx`
   - `ProfileOrders.tsx`
   - `ProfileHelp.tsx`

## Next Actions
1. Backup current Profile.tsx
2. Restructure component with new design
3. Test mobile and desktop layouts
4. Ensure all routes work correctly
5. Verify data fetching and display
