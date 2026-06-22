require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/auth");

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: "Too many requests." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts." },
});
app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/entries',   require('./routes/entries'));
app.use('/api/personal-entries', require('./routes/personalEntries'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/master-data', require('./routes/masterData'));
app.use('/api/reports', require('./routes/report'));
app.use('/api/analysis',  require('./routes/analysis'));
app.use('/api/msp',       require('./routes/msp'));


app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    message: "CropLoss API is running",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  }),
);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` }));

// Error handler
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  await seedInitialData();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🌾 CropLoss Management Portal`);
    console.log(`🚀 Backend running: http://localhost:${PORT}`);
    console.log(`📡 API base: http://localhost:${PORT}/api`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`\n📋 Default login: admin@icar.gov.in / Admin@2025\n`);
  });
};

// ── Seed initial data ─────────────────────────────────────────────────────
async function seedInitialData() {
  const User = require("./models/User");
  const { CROPS } = require("./config/constants");

  const adminExists = await User.findOne({ role: "super_admin" });
  if (!adminExists) {
    console.log("🌱 Seeding initial users...");

    // Super Admin
    await User.create({
      name: "Dr. IIOR Admin",
      email: "admin@icar.gov.in",
      phone: "+919876543210",
      password: "Admin@2025",
      role: "super_admin",
      designation: "System Administrator",
      assignedCrops: CROPS,
      reviewCrops: CROPS,
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    // Crop Head - Castor & Sunflower
    await User.create({
      name: "Dr. S. Kumar",
      email: "head@icar.gov.in",
      phone: "+918765432109",
      password: "Head@2025",
      role: "crop_head",
      designation: "Senior Scientist",
      assignedCrops: ["castor", "sunflower"],
      reviewCrops: ["castor", "sunflower"],
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    // Crop Head - Sesame, Niger, Linseed
    await User.create({
      name: "Dr. M. Reddy",
      email: "mreddy@icar.gov.in",
      phone: "+917654321098",
      password: "Head@2025",
      role: "crop_head",
      designation: "Principal Scientist",
      assignedCrops: ["sesame", "niger", "linseed"],
      reviewCrops: ["sesame", "niger", "linseed"],
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    // Crop Head - Safflower
    await User.create({
      name: "Dr. P. Joshi",
      email: "pjoshi@icar.gov.in",
      phone: "+916543210987",
      password: "Head@2025",
      role: "crop_head",
      designation: "Scientist",
      assignedCrops: ["safflower"],
      reviewCrops: ["safflower"],
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    // Center User - Castor
    await User.create({
      name: "Mr. A. Shah",
      email: "user@center.in",
      phone: "+915432109876",
      password: "User@2025",
      role: "center_user",
      designation: "Research Associate",
      centerName: "RARS Junagadh",
      centerState: "Gujarat",
      centerDistrict: "Junagadh",
      assignedCrops: ["castor"],
      reviewCrops: [],
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    // Center User - Sunflower, Safflower
    await User.create({
      name: "Ms. P. Sharma",
      email: "psharma@center.in",
      phone: "+914321098765",
      password: "User@2025",
      role: "center_user",
      designation: "Research Associate",
      centerName: "RARS Hyderabad",
      centerState: "Telangana",
      centerDistrict: "Hyderabad",
      assignedCrops: ["sunflower", "safflower"],
      reviewCrops: [],
      notifyWhatsApp: true,
      notifyEmail: true,
    });

    console.log("✅ Initial users seeded successfully");
    console.log("   admin@icar.gov.in    / Admin@2025 (Super Admin)");
    console.log("   head@icar.gov.in     / Head@2025  (Crop Head – Castor, Sunflower)");
    console.log("   mreddy@icar.gov.in   / Head@2025  (Crop Head – Sesame, Niger, Linseed)");
    console.log("   user@center.in       / User@2025  (Center User – Castor)");
    console.log("   psharma@center.in    / User@2025  (Center User – Sunflower, Safflower)");
  }
}

startServer();

module.exports = app;
