import { User } from "../models/User.js";
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
      linkedAdmin: user.linkedAdmin
    }
  };
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const normalizedRole = role === "admin" ? "admin" : "candidate";
  const payload = {
    name,
    email: email.toLowerCase(),
    password,
    role: normalizedRole
  };

  if (normalizedRole === "admin") {
    payload.adminCode = await generateUniqueAdminCode();
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
  const user = await User.findById(req.user._id).select("_id name email role adminCode linkedAdmin");
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminCode: user.adminCode,
      linkedAdmin: user.linkedAdmin
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

  const filter = {
    role: "candidate",
    linkedAdmin: req.user._id,
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
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
