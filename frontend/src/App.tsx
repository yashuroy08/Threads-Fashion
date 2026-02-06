import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Cart from '././pages/Cart';
import { ProtectedRoute } from './components/ProtectedRoute';
import PlaceOrder from './pages/PlaceOrder';
import { Navbar } from './components/Navbar';
// Removed MobileBottomBar import to fix duplicate nav
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Login from './pages/Login';
import OrderTracking from './pages/OrderTracking';
import ProductDetails from './pages/ProductDetails';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Logout from './pages/Logout';
import VerifyPhone from './pages/VerifyPhone';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OrderSuccess from './pages/OrderSuccess';
import { WishlistProvider } from './context/WishlistContext';
import Wishlist from './pages/Wishlist';
// Removed navbar-mobile-fix.css import

// MobileNavbar Import
import MobileNavbar from './components/MobileNavbar';

// Layout Wrapper to conditionally render Public Navbar/Footer
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCheckoutRoute = location.pathname === '/checkout';
  const isProductDetailRoute = location.pathname.match(/^\/products\/[^/]+$/);
  const isOrderTrackingRoute = location.pathname.startsWith('/order-tracking/');
  const isCartRoute = location.pathname === '/cart';

  const isWishlistRoute = location.pathname === '/wishlist';

  const isOrderSuccessRoute = location.pathname.startsWith('/order-success/');
  const isCategoriesRoute = location.pathname === '/categories';

  // Auth pages where nav/bottom bar should be hidden
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/terms', '/privacy'].includes(location.pathname) || location.pathname.startsWith('/reset-password');

  // Set data attribute on body for CSS targeting on mobile
  useEffect(() => {
    if (isOrderTrackingRoute || isProductDetailRoute) {
      document.body.setAttribute('data-hide-navbar', 'true');
    } else {
      document.body.removeAttribute('data-hide-navbar');
    }

    if (isCategoriesRoute) {
      document.body.setAttribute('data-page-categories', 'true');
    } else {
      document.body.removeAttribute('data-page-categories');
    }

    return () => {
      document.body.removeAttribute('data-hide-navbar');
      document.body.removeAttribute('data-page-categories');
    };
  }, [isOrderTrackingRoute, isProductDetailRoute, isCategoriesRoute]);

  return (
    <>
      {!isAdminRoute && !isCheckoutRoute && !isOrderTrackingRoute && !isCartRoute && !isOrderSuccessRoute && !isWishlistRoute && !isAuthRoute && <Navbar />}
      {children}
      {!isAdminRoute && !isCheckoutRoute && !isOrderTrackingRoute && !isOrderSuccessRoute && !isWishlistRoute && !isAuthRoute && <MobileNavbar />}
      {!isAdminRoute && !isAuthRoute && <BackToTop />}
      {!isAdminRoute && location.pathname === '/' && <Footer />}
    </>
  );
};

function App() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Re-observe when DOM changes (for routing)
    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll('.reveal:not(.active)');
      newElements.forEach(el => observer.observe(el));
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Scroll Percentage Listener (Apple Style)
    const handleScroll = () => {
      const scrollables = document.querySelectorAll('.sticky-container');
      scrollables.forEach(container => {
        const rect = container.getBoundingClientRect();
        const height = container.clientHeight;
        const viewportHeight = window.innerHeight;

        // Calculate progress: 0 when top is at bottom of viewport, 1 when bottom is at top
        // But for sticky reveals, we want progress while the sticky element is stuck.
        // Usually: top of container enters -> stuck. 
        // Let's calculate based on how much of the container height has been scrolled.
        const progress = -rect.top / (height - viewportHeight);
        const clampedProgress = Math.max(0, Math.min(1, progress));

        // Drive CSS Variable
        (container as HTMLElement).style.setProperty('--scroll-progress', clampedProgress.toString());
        // Drive Scale Variable (e.g. scale from 1.5 to 1.0)
        const scale = 1.5 - (clampedProgress * 0.5);
        (container as HTMLElement).style.setProperty('--scroll-scale', scale.toString());
        // Drive Opacity Variable
        const opacity = clampedProgress > 0.8 ? 1 - ((clampedProgress - 0.8) * 5) : 1;
        (container as HTMLElement).style.setProperty('--scroll-opacity', opacity.toString());
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <NotificationProvider>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <WishlistProvider>
              <BrowserRouter>
                <LayoutWrapper>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/logout" element={<Logout />} />

                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/verify-phone"
                      element={
                        <ProtectedRoute>
                          <VerifyPhone />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <PlaceOrder />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/order-tracking/:orderId"
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      }
                    />

                    {/* Alias for cleaner URL and email links */}
                    <Route
                      path="/orders/:orderId"
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/order-success/:orderId"
                      element={
                        <ProtectedRoute>
                          <OrderSuccess />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminProducts />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminOrders />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/audit"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminAudit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute role="admin">
                          <AdminSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/wishlist"
                      element={
                        <ProtectedRoute>
                          <Wishlist />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </LayoutWrapper>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
export default App;