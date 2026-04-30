import { User } from "../models/User.js";
import { parse } from "csv-parse/sync";
import { signToken } from "../services/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAdminCode = () => {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `C2F-${randomPart}`;
};

const generateUniqueAdminCode = async () => {
  let code = generateAdminCode();
  let exists = await User.exists({ adminCode: code });

  while (exists) {
    code = generateAdminCode();
    exists = await User.exists({ adminCode: code });
  }

  return code;
};

const resolveAdminForOperation = async ({ requestUser, adminId }) => {
  if (requestUser.role === "admin") {
    return User.findOne({ _id: requestUser._id, role: "admin" });
  }

  if (requestUser.role === "super-admin") {
    if (!adminId) {
      return null;
    }
    return User.findOne({
      _id: adminId,
      role: "admin",
      linkedSuperAdmin: requestUser._id
    });
  }

  return null;
};

const toAuthResponse = (user) => {
  const token = signToken({ userId: user._id, role: user.role });
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminCode: user.adminCode,
      linkedAdmin: user.linkedAdmin,
      linkedSuperAdmin: user.linkedSuperAdmin
    }
  };
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode, superAdminCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const normalizedRole = role === "super-admin" ? "super-admin" : role === "admin" ? "admin" : "candidate";
  const payload = {
    name,
    email: email.toLowerCase(),
    password,
    role: normalizedRole
  };

  if (normalizedRole === "admin") {
    payload.adminCode = await generateUniqueAdminCode();

    if (superAdminCode) {
      const superAdmin = await User.findOne({
        adminCode: String(superAdminCode).trim().toUpperCase(),
        role: "super-admin"
      });
      if (!superAdmin) {
        return res.status(404).json({ message: "Invalid super-admin code" });
      }
      payload.linkedSuperAdmin = superAdmin._id;
    }
  }

  if (normalizedRole === "candidate") {
    if (!adminCode) {
      return res.status(400).json({ message: "adminCode is required for candidate registration" });
    }
    const admin = await User.findOne({ adminCode: String(adminCode).trim().toUpperCase(), role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Invalid admin registration code" });
    }
    payload.linkedAdmin = admin._id;
  }

  const user = await User.create({
    ...payload
  });

  return res.status(201).json(toAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json(toAuthResponse(user));
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("_id name email role adminCode linkedAdmin linkedSuperAdmin");
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminCode: user.adminCode,
      linkedAdmin: user.linkedAdmin,
      linkedSuperAdmin: user.linkedSuperAdmin
    }
  });
});

export const getAdminRegistrationInfo = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id).select("_id adminCode");
  if (!admin.adminCode) {
    admin.adminCode = await generateUniqueAdminCode();
    await admin.save();
  }

  const registrationLink = `${req.protocol}://${req.get("host")}/signup?adminCode=${admin.adminCode}&role=candidate`;
  return res.json({ adminCode: admin.adminCode, registrationLink });
});

export const regenerateAdminCode = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  admin.adminCode = await generateUniqueAdminCode();
  await admin.save();

  const registrationLink = `${req.protocol}://${req.get("host")}/signup?adminCode=${admin.adminCode}&role=candidate`;
  return res.json({ adminCode: admin.adminCode, registrationLink });
});

export const listAdminStudents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;
  const search = String(req.query.search || "").trim();

  const targetAdmin = await resolveAdminForOperation({
    requestUser: req.user,
    adminId: req.query.adminId
  });

  if (!targetAdmin) {
    return res.status(400).json({ message: "Valid admin is required" });
  }

  const filter = {
    role: "candidate",
    linkedAdmin: targetAdmin._id,
    ...(search ? { name: { $regex: search, $options: "i" } } : {})
  };

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return res.json({
    admin: {
      id: targetAdmin._id,
      name: targetAdmin.name,
      email: targetAdmin.email,
      adminCode: targetAdmin.adminCode
    },
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const createManagedAdmin = asyncHandler(async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "admin",
    adminCode: await generateUniqueAdminCode(),
    linkedSuperAdmin: req.user._id
  });

  return res.status(201).json({
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminCode: admin.adminCode
    }
  });
});

export const listManagedAdmins = asyncHandler(async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const admins = await User.find({ role: "admin", linkedSuperAdmin: req.user._id })
    .select("_id name email adminCode createdAt")
    .sort({ createdAt: -1 });

  return res.json({ items: admins });
});

export const importStudentsCsv = asyncHandler(async (req, res) => {
  const { csvContent, adminId } = req.body;

  if (!csvContent) {
    return res.status(400).json({ message: "csvContent is required" });
  }

  const targetAdmin = await resolveAdminForOperation({
    requestUser: req.user,
    adminId
  });

  if (!targetAdmin) {
    return res.status(400).json({ message: "Valid admin is required for import" });
  }

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!rows.length) {
    return res.status(400).json({ message: "CSV has no student rows" });
  }

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const name = String(row.name || "").trim();
    const email = String(row.email || "").trim().toLowerCase();
    const password = String(row.password || "").trim() || "C2F@12345";

    if (!name || !email) {
      errors.push({ row: index + 2, message: "name and email are required" });
      skipped += 1;
      continue;
    }

    const exists = await User.exists({ email });
    if (exists) {
      skipped += 1;
      continue;
    }

    await User.create({
      name,
      email,
      password,
      role: "candidate",
      linkedAdmin: targetAdmin._id
    });
    imported += 1;
  }

  return res.status(201).json({
    admin: {
      id: targetAdmin._id,
      name: targetAdmin.name,
      email: targetAdmin.email
    },
    imported,
    skipped,
    errors
  });
});
