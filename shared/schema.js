// Simple schema definitions for JavaScript
export const createUserSchema = {
  name: { type: "string", required: true },
  email: { type: "string", required: true }
};

export const userSchema = {
  id: { type: "number" },
  name: { type: "string" },
  email: { type: "string" },
  createdAt: { type: "string" }
};
