---
description: Automate the build and basic verification of the storefront features.
---

1. Ensure all styles and components are correctly imported.
2. Check for missing closing tags or syntax errors in `Products.tsx` and `Home.tsx`.
// turbo
3. Run the frontend build to verify no regressions:
```bash
cd frontend && npm run build
```
4. Verify that the homepage (`/`) now renders the `Home` component instead of `Products`.
5. Test the Dark Mode toggle in the Navbar to ensure `data-theme` attribute is toggled on `html` element.
