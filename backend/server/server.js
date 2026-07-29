// Auth (login/verify/logout) – works for both admin & user, role checked after verification
// app.use("/api/auth", userAuthRoutes);

// Admin routes (require admin role)
// app.use("/api/admin", authRoutes); // login/verify/logout for admin (same as auth? we keep)
// appuse("/api/admin", adminRoutes);

// Instead, we rely on the Next.js API routes for authentication.
// The backend protects its endpoints by validating the JWT and session.
// The frontend will obtain tokens from the Next.js auth endpoints.
const orderRoutes = require('./routes/orders');

// Keep other routes
app.use("/api/contact", contactRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/pedidos", orderRoutes);

// Auth (login/verify/logot) – handled by Next.js API routes
// Admin and editor routes are protected by middleware
app.use("/api/admin", adminRoutes);
app.use("/api/editor", editorRoutes);
app.use("/api/rss", rssRoutes);