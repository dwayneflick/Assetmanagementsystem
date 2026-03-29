import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv.tsx";

// ─── Supabase admin client ─────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── App ───────────────────────────────────────────────────
const app = new Hono().basePath("/make-server-5921d82e");

app.use("*", cors());
app.use("*", logger(console.log));

/**
 * Environment middleware
 * Reads `X-Env: test` header → sets key prefix to "test_"
 * Auth and user routes always use production prefix (kp = "")
 */
app.use("*", async (c, next) => {
  const env = c.req.header("X-Env");
  c.set("kp", env === "test" ? "test_" : "");
  await next();
});

// ─── Helpers ───────────────────────────────────────────────
function uid() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function now() {
  return new Date().toISOString();
}
function kp(c: any): string {
  return (c.get("kp") as string) || "";
}

/**
 * Robust user lookup by the ID the frontend knows about.
 * 1. Fast path: direct key `user:${id}` (new format).
 * 2. Slow path: scan all `user:*` entries and find where stored object's
 *    `id` field matches — handles legacy keys like `user:admin`.
 * Returns { user, key } or null.
 */
async function findUserById(id: string): Promise<{ user: any; key: string } | null> {
  // Fast path
  const direct = await kv.get(`user:${id}`);
  if (direct) return { user: direct, key: `user:${id}` };

  // Slow path — scan all user entries
  const allUsers = await kv.getByPrefix("user:");
  for (const u of allUsers) {
    if (u && u.id === id) {
      const candidateKeys = [`user:${u.username}`, `user:${u.id}`];
      for (const k of candidateKeys) {
        const val = await kv.get(k);
        if (val && val.id === id) return { user: val, key: k };
      }
    }
  }
  return null;
}

// ─── Seed default users on cold start ─────────────────────
async function seedDefaultUsers() {
  const existing = await kv.getByPrefix("user:");
  if (existing.length > 0) return;

  const defaultUsers = [
    { id: `user_${uid()}`, username: "admin",    name: "Admin",    role: "admin",  password: "P@ssw0rd", email: "", createdAt: now() },
    { id: `user_${uid()}`, username: "kingsley", name: "Kingsley", role: "admin",  password: "P@ssw0rd", email: "", createdAt: now() },
    { id: `user_${uid()}`, username: "lateef",   name: "Lateef",   role: "agent",  password: "P@ssw0rd", email: "", createdAt: now() },
    { id: `user_${uid()}`, username: "kelvin",   name: "Kelvin",   role: "agent",  password: "P@ssw0rd", email: "", createdAt: now() },
    { id: `user_${uid()}`, username: "mosun",    name: "Mosun",    role: "agent",  password: "P@ssw0rd", email: "", createdAt: now() },
    { id: `user_${uid()}`, username: "finance",  name: "Finance",  role: "viewer", password: "P@ssw0rd", email: "", createdAt: now() },
  ];

  for (const u of defaultUsers) {
    await kv.set(`user:${u.id}`, u);
    await kv.set(`user_by_username:${u.username}`, u.id);
  }
  console.log("Default users seeded.");
}

seedDefaultUsers().catch(console.error);

// ═══════════════════════════════════════════════════════════
//  AUTH  (always production — no kp prefix)
// ═══════════════════════════════════════════════════════════

app.post("/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) return c.json({ error: "Username and password are required" }, 400);

    const userId = await kv.get(`user_by_username:${username.toLowerCase()}`);

    let user: any = null;

    // Try direct lookup first
    if (userId) {
      user = await kv.get(`user:${userId}`);
      // If the index pointed to a stale/missing key, fall through to scan
    }

    // Fallback: scan all user entries by username (handles legacy key formats)
    if (!user) {
      const allUsers = await kv.getByPrefix("user:");
      user = allUsers.find(
        (u: any) => u && typeof u === "object" && u.username &&
          u.username.toLowerCase() === username.toLowerCase()
      ) || null;

      // If found via scan but index was missing/stale, repair the index
      if (user && user.id) {
        await kv.set(`user_by_username:${user.username.toLowerCase()}`, user.id);
        console.log(`Repaired user_by_username index for: ${user.username}`);
      }
    }

    if (!user || user.password !== password) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const { password: _pw, ...safeUser } = user;
    return c.json({ user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ error: `Login error: ${err}` }, 500);
  }
});

app.post("/auth/change-password", async (c) => {
  try {
    const { username, currentPassword, newPassword } = await c.req.json();
    if (!username || !currentPassword || !newPassword) return c.json({ error: "All fields are required" }, 400);

    const userId = await kv.get(`user_by_username:${username.toLowerCase()}`);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const user = await kv.get(`user:${userId}`);
    if (!user) return c.json({ error: "User not found" }, 404);
    if (user.password !== currentPassword) return c.json({ error: "Current password is incorrect" }, 401);

    user.password = newPassword;
    user.mustChangePassword = false;
    await kv.set(`user:${userId}`, user);
    return c.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    return c.json({ error: `Change password error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  USERS  (always production — no kp prefix)
// ═══════════════════════════════════════════════════════════

app.get("/users", async (c) => {
  try {
    const raw = await kv.getByPrefix("user:");
    // Only include valid user objects (must have id and username)
    const users = raw.filter(
      (u: any) => u && typeof u === "object" && u.id && u.username
    );
    const safe = users.map(({ password: _pw, ...u }: any) => u);
    return c.json({ users: safe });
  } catch (err) {
    return c.json({ error: `Get users error: ${err}` }, 500);
  }
});

app.post("/users", async (c) => {
  try {
    const { username, name, role, email, password } = await c.req.json();
    if (!username || !name || !role || !password) return c.json({ error: "username, name, role, and password are required" }, 400);

    const existing = await kv.get(`user_by_username:${username.toLowerCase()}`);
    if (existing) {
      // Verify the user actually exists (index may be stale)
      const existingUser = await kv.get(`user:${existing}`);
      if (existingUser) {
        return c.json({ error: "Username already exists. Please choose a different username." }, 409);
      }
      // Stale index — clean it up and proceed
      console.log(`Cleaning up stale user_by_username index for: ${username}`);
    }

    // Also scan all users to make sure username isn't taken under a different key
    const allUsers = await kv.getByPrefix("user:");
    const validUsers = allUsers.filter((u: any) => u && typeof u === "object" && u.id && u.username);
    const usernameTaken = validUsers.some(
      (u: any) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (usernameTaken) return c.json({ error: "Username already exists. Please choose a different username." }, 409);

    if (email) {
      const emailTaken = validUsers.some((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (emailTaken) return c.json({ error: "A user with this email address already exists." }, 409);
    }

    const id = `user_${uid()}`;
    const user = { id, username: username.toLowerCase(), name, role, email: email || "", password, mustChangePassword: true, createdAt: now() };
    await kv.set(`user:${id}`, user);
    await kv.set(`user_by_username:${username.toLowerCase()}`, id);

    const { password: _pw, ...safeUser } = user;
    return c.json({ user: safeUser }, 201);
  } catch (err) {
    return c.json({ error: `Create user error: ${err}` }, 500);
  }
});

app.post("/users/invite", async (c) => {
  try {
    const { email, role } = await c.req.json();
    if (!email || !role) return c.json({ error: "email and role are required" }, 400);

    const allUsers = await kv.getByPrefix("user:");
    const emailTaken = allUsers.some((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailTaken) return c.json({ error: "A user with this email address already exists." }, 409);

    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let username = baseUsername;
    let suffix = 1;
    while (await kv.get(`user_by_username:${username}`)) username = `${baseUsername}${suffix++}`;

    const tempPassword = `Tmp${Math.random().toString(36).substr(2, 6)}#1`;
    const id = `user_${uid()}`;
    const user = { id, username, name: username, role, email, password: tempPassword, mustChangePassword: true, createdAt: now() };
    await kv.set(`user:${id}`, user);
    await kv.set(`user_by_username:${username}`, id);

    let emailSent = false;
    const resendKey = "re_cQMvccse_35BSh8SqKAHUwNNvpyuREGRU";
    const fromEmail = "Andersen Asset Management <noreply@andersenams.com>";

    if (resendKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: "You've been invited to Andersen Asset Management System",
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#7a1020,#8b1a2a);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;">Andersen Asset Management System</h1>
<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">You've been invited to join our platform</p>
</div>
<div style="padding:32px;">
<p>You've been invited as a <strong style="color:#7a1020;">${role}</strong>.</p>
<div style="background:#fff5f5;border-left:4px solid #7a1020;padding:16px;margin:16px 0;border-radius:4px;">
<p style="margin:0 0 8px;font-weight:bold;color:#7a1020;">Your Login Credentials</p>
<p style="margin:0 0 4px;">Username: <code style="background:#eee;padding:2px 6px;border-radius:3px;">${username}</code></p>
<p style="margin:0;">Password: <code style="background:#eee;padding:2px 6px;border-radius:3px;">${tempPassword}</code></p>
</div>
<p style="color:#888;font-size:13px;">Please change your password after first login.</p>
</div>
</div></body></html>`,
          }),
        });

        const emailBody = await emailRes.json().catch(() => ({}));
        if (emailRes.ok) {
          emailSent = true;
        } else {
          return c.json({
            success: true,
            emailSent: false,
            resendError: `Resend [${emailRes.status}]: ${(emailBody as any)?.message || JSON.stringify(emailBody)}`,
            credentials: { email, username, password: tempPassword, role, emailSent: false },
          }, 201);
        }
      } catch (emailErr) {
        return c.json({
          success: true,
          emailSent: false,
          resendError: `Resend exception: ${emailErr}`,
          credentials: { email, username, password: tempPassword, role, emailSent: false },
        }, 201);
      }
    }

    return c.json({ success: true, emailSent, credentials: { email, username, password: tempPassword, role, emailSent } }, 201);
  } catch (err) {
    return c.json({ error: `Invite error: ${err}` }, 500);
  }
});

app.put("/users/:id/password", async (c) => {
  try {
    const { id } = c.req.param();
    const { password, currentPassword, newPassword } = await c.req.json();

    const found = await findUserById(id);
    if (!found) return c.json({ error: "User not found" }, 404);
    const { user, key } = found;

    if (currentPassword !== undefined) {
      if (user.password !== currentPassword) return c.json({ error: "Current password is incorrect" }, 401);
      user.password = newPassword || password;
    } else {
      user.password = password || newPassword;
    }

    // Clear first-login flag whenever password is explicitly changed
    user.mustChangePassword = false;

    await kv.set(key, user);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Change password error: ${err}` }, 500);
  }
});

app.put("/users/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const found = await findUserById(id);
    if (!found) return c.json({ error: "User not found" }, 404);
    const { user, key } = found;

    const updated = { ...user, ...body, id: user.id, username: user.username };
    await kv.set(key, updated);
    const { password: _pw, ...safeUser } = updated;
    return c.json({ user: safeUser });
  } catch (err) {
    return c.json({ error: `Update user error: ${err}` }, 500);
  }
});

app.delete("/users/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const found = await findUserById(id);
    if (!found) return c.json({ error: "User not found" }, 404);
    const { user, key } = found;

    await kv.del(key);
    await kv.del(`user_by_username:${user.username}`);
    console.log(`Deleted user: ${user.username} (key: ${key})`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete user error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  ASSETS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/assets", async (c) => {
  try {
    const assets = await kv.getByPrefix(`${kp(c)}asset:`);
    return c.json({ assets });
  } catch (err) {
    return c.json({ error: `Get assets error: ${err}` }, 500);
  }
});

app.post("/assets", async (c) => {
  try {
    const body = await c.req.json();
    const id = `asset_${uid()}`;
    const asset = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}asset:${id}`, asset);
    return c.json({ asset }, 201);
  } catch (err) {
    return c.json({ error: `Create asset error: ${err}` }, 500);
  }
});

app.put("/assets/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}asset:${id}`);
    if (!existing) return c.json({ error: "Asset not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}asset:${id}`, updated);
    return c.json({ asset: updated });
  } catch (err) {
    return c.json({ error: `Update asset error: ${err}` }, 500);
  }
});

app.delete("/assets/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}asset:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete asset error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  SOFTWARE  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/software", async (c) => {
  try {
    const items = await kv.getByPrefix(`${kp(c)}software:`);
    return c.json({ software: items });
  } catch (err) {
    return c.json({ error: `Get software error: ${err}` }, 500);
  }
});

app.post("/software", async (c) => {
  try {
    const body = await c.req.json();
    const id = `software_${uid()}`;
    const item = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}software:${id}`, item);
    return c.json({ software: item }, 201);
  } catch (err) {
    return c.json({ error: `Create software error: ${err}` }, 500);
  }
});

app.put("/software/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}software:${id}`);
    if (!existing) return c.json({ error: "Software not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}software:${id}`, updated);
    return c.json({ software: updated });
  } catch (err) {
    return c.json({ error: `Update software error: ${err}` }, 500);
  }
});

app.delete("/software/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}software:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete software error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  INCIDENTS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/incidents", async (c) => {
  try {
    const incidents = await kv.getByPrefix(`${kp(c)}incident:`);
    return c.json({ incidents });
  } catch (err) {
    return c.json({ error: `Get incidents error: ${err}` }, 500);
  }
});

app.post("/incidents", async (c) => {
  try {
    const body = await c.req.json();
    const id = `incident_${uid()}`;
    const incident = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}incident:${id}`, incident);
    return c.json({ incident }, 201);
  } catch (err) {
    return c.json({ error: `Create incident error: ${err}` }, 500);
  }
});

app.put("/incidents/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}incident:${id}`);
    if (!existing) return c.json({ error: "Incident not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}incident:${id}`, updated);
    return c.json({ incident: updated });
  } catch (err) {
    return c.json({ error: `Update incident error: ${err}` }, 500);
  }
});

app.delete("/incidents/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}incident:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete incident error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  IT ISSUE LOGS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/it-issues", async (c) => {
  try {
    const issues = await kv.getByPrefix(`${kp(c)}it_issue:`);
    return c.json({ issues });
  } catch (err) {
    return c.json({ error: `Get IT issues error: ${err}` }, 500);
  }
});

app.get("/it-issue-logs", async (c) => {
  try {
    const issues = await kv.getByPrefix(`${kp(c)}it_issue:`);
    return c.json({ issues });
  } catch (err) {
    return c.json({ error: `Get IT issue logs error: ${err}` }, 500);
  }
});

app.post("/it-issue-logs", async (c) => {
  try {
    const body = await c.req.json();
    const id = `it_issue_${uid()}`;
    const issue = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}it_issue:${id}`, issue);
    return c.json({ issue }, 201);
  } catch (err) {
    return c.json({ error: `Create IT issue log error: ${err}` }, 500);
  }
});

app.put("/it-issue-logs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}it_issue:${id}`);
    if (!existing) return c.json({ error: "IT issue log not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}it_issue:${id}`, updated);
    return c.json({ issue: updated });
  } catch (err) {
    return c.json({ error: `Update IT issue log error: ${err}` }, 500);
  }
});

app.delete("/it-issue-logs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}it_issue:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete IT issue log error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  DEREGISTRATIONS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/deregistrations", async (c) => {
  try {
    const deregistrations = await kv.getByPrefix(`${kp(c)}dereg:`);
    return c.json({ deregistrations });
  } catch (err) {
    return c.json({ error: `Get deregistrations error: ${err}` }, 500);
  }
});

app.post("/deregistrations", async (c) => {
  try {
    const body = await c.req.json();
    const id = `dereg_${uid()}`;
    const record = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}dereg:${id}`, record);
    return c.json({ deregistration: record }, 201);
  } catch (err) {
    return c.json({ error: `Create deregistration error: ${err}` }, 500);
  }
});

app.put("/deregistrations/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}dereg:${id}`);
    if (!existing) return c.json({ error: "Deregistration not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}dereg:${id}`, updated);
    return c.json({ deregistration: updated });
  } catch (err) {
    return c.json({ error: `Update deregistration error: ${err}` }, 500);
  }
});

app.delete("/deregistrations/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}dereg:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete deregistration error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  MAINTENANCE LOGS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/maintenance-logs", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}maint:`);
    return c.json({ logs });
  } catch (err) {
    return c.json({ error: `Get maintenance logs error: ${err}` }, 500);
  }
});

app.post("/maintenance-logs", async (c) => {
  try {
    const body = await c.req.json();
    const id = `maint_${uid()}`;
    const log = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}maint:${id}`, log);
    return c.json({ log }, 201);
  } catch (err) {
    return c.json({ error: `Create maintenance log error: ${err}` }, 500);
  }
});

app.put("/maintenance-logs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}maint:${id}`);
    if (!existing) return c.json({ error: "Maintenance log not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}maint:${id}`, updated);
    return c.json({ log: updated });
  } catch (err) {
    return c.json({ error: `Update maintenance log error: ${err}` }, 500);
  }
});

app.delete("/maintenance-logs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}maint:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete maintenance log error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  FAULTY ASSETS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/faulty-assets", async (c) => {
  try {
    const records = await kv.getByPrefix(`${kp(c)}faulty:`);
    return c.json({ records });
  } catch (err) {
    return c.json({ error: `Get faulty assets error: ${err}` }, 500);
  }
});

app.post("/faulty-assets", async (c) => {
  try {
    const body = await c.req.json();
    const id = `faulty_${uid()}`;
    const record = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}faulty:${id}`, record);
    return c.json({ record }, 201);
  } catch (err) {
    return c.json({ error: `Create faulty asset error: ${err}` }, 500);
  }
});

app.put("/faulty-assets/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}faulty:${id}`);
    if (!existing) return c.json({ error: "Faulty asset record not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}faulty:${id}`, updated);
    return c.json({ record: updated });
  } catch (err) {
    return c.json({ error: `Update faulty asset error: ${err}` }, 500);
  }
});

app.delete("/faulty-assets/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}faulty:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete faulty asset error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  FORUMS / KNOWLEDGE BASE  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/forums", async (c) => {
  try {
    const forums = await kv.getByPrefix(`${kp(c)}forum:`);
    return c.json({ forums });
  } catch (err) {
    return c.json({ error: `Get forums error: ${err}` }, 500);
  }
});

app.post("/forums", async (c) => {
  try {
    const body = await c.req.json();
    const id = `forum_${uid()}`;
    const topic = { id, ...body, replies: [], createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}forum:${id}`, topic);
    return c.json({ topic }, 201);
  } catch (err) {
    return c.json({ error: `Create forum topic error: ${err}` }, 500);
  }
});

app.post("/forums/:id/reply", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}forum:${id}`);
    if (!existing) return c.json({ error: "Forum topic not found" }, 404);
    const reply = { id: `reply_${uid()}`, ...body, createdAt: now() };
    const replies = [...(existing.replies || []), reply];
    const updated = { ...existing, replies, updatedAt: now() };
    await kv.set(`${kp(c)}forum:${id}`, updated);
    return c.json({ topic: updated });
  } catch (err) {
    return c.json({ error: `Add reply error: ${err}` }, 500);
  }
});

app.put("/forums/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}forum:${id}`);
    if (!existing) return c.json({ error: "Forum topic not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}forum:${id}`, updated);
    return c.json({ topic: updated });
  } catch (err) {
    return c.json({ error: `Update forum topic error: ${err}` }, 500);
  }
});

app.delete("/forums/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}forum:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete forum topic error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  PURCHASE ORDERS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/purchase-orders", async (c) => {
  try {
    const purchaseOrders = await kv.getByPrefix(`${kp(c)}po:`);
    return c.json({ purchaseOrders });
  } catch (err) {
    return c.json({ error: `Get purchase orders error: ${err}` }, 500);
  }
});

app.post("/purchase-orders", async (c) => {
  try {
    const body = await c.req.json();
    const id = `po_${uid()}`;
    const po = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}po:${id}`, po);
    if (po.poNumber) await kv.set(`${kp(c)}po_by_number:${po.poNumber}`, id);
    return c.json({ purchaseOrder: po }, 201);
  } catch (err) {
    return c.json({ error: `Create purchase order error: ${err}` }, 500);
  }
});

app.put("/purchase-orders/:poNumber", async (c) => {
  try {
    const { poNumber } = c.req.param();
    const body = await c.req.json();
    // Look up by poNumber first
    const poId = await kv.get(`${kp(c)}po_by_number:${poNumber}`);
    const key = poId ? `${kp(c)}po:${poId}` : null;
    const existing = key ? await kv.get(key) : null;
    if (!existing || !key) return c.json({ error: "Purchase order not found" }, 404);
    const updated = { ...existing, ...body, updatedAt: now() };
    await kv.set(key, updated);
    return c.json({ purchaseOrder: updated });
  } catch (err) {
    return c.json({ error: `Update purchase order error: ${err}` }, 500);
  }
});

app.delete("/purchase-orders/:poNumber", async (c) => {
  try {
    const { poNumber } = c.req.param();
    const poId = await kv.get(`${kp(c)}po_by_number:${poNumber}`);
    if (poId) {
      await kv.del(`${kp(c)}po:${poId}`);
      await kv.del(`${kp(c)}po_by_number:${poNumber}`);
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete purchase order error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/notifications/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const all = await kv.getByPrefix(`${kp(c)}notif:`);
    const notifications = all.filter((n: any) => n.userId === userId || n.targetUserId === userId);
    return c.json({ notifications });
  } catch (err) {
    return c.json({ error: `Get notifications error: ${err}` }, 500);
  }
});

app.put("/notifications/:id/read", async (c) => {
  try {
    const { id } = c.req.param();
    const existing = await kv.get(`${kp(c)}notif:${id}`);
    if (!existing) return c.json({ error: "Notification not found" }, 404);
    const updated = { ...existing, read: true, readAt: now() };
    await kv.set(`${kp(c)}notif:${id}`, updated);
    return c.json({ notification: updated });
  } catch (err) {
    return c.json({ error: `Mark notification read error: ${err}` }, 500);
  }
});

app.delete("/notifications/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}notif:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete notification error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  ACCESS CONTROL  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/access-control", async (c) => {
  try {
    const settings = await kv.get(`${kp(c)}access_control_settings`);
    return c.json({ settings: settings || {} });
  } catch (err) {
    return c.json({ error: `Get access control error: ${err}` }, 500);
  }
});

app.put("/access-control", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set(`${kp(c)}access_control_settings`, body);
    return c.json({ settings: body });
  } catch (err) {
    return c.json({ error: `Update access control error: ${err}` }, 500);
  }
});

// ���══════════════════════════════════════════════════════════
//  WORKFLOWS  (env-aware)
// ═══════════════════════════════════════════════════════════

app.get("/workflows", async (c) => {
  try {
    const workflows = await kv.getByPrefix(`${kp(c)}workflow:`);
    return c.json({ workflows });
  } catch (err) {
    return c.json({ error: `Get workflows error: ${err}` }, 500);
  }
});

app.post("/workflows", async (c) => {
  try {
    const body = await c.req.json();
    const id = `workflow_${uid()}`;
    const workflow = { id, ...body, createdAt: now(), updatedAt: now() };
    await kv.set(`${kp(c)}workflow:${id}`, workflow);
    return c.json({ workflow }, 201);
  } catch (err) {
    return c.json({ error: `Create workflow error: ${err}` }, 500);
  }
});

app.put("/workflows/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const existing = await kv.get(`${kp(c)}workflow:${id}`);
    if (!existing) return c.json({ error: "Workflow not found" }, 404);
    const updated = { ...existing, ...body, id, updatedAt: now() };
    await kv.set(`${kp(c)}workflow:${id}`, updated);
    return c.json({ workflow: updated });
  } catch (err) {
    return c.json({ error: `Update workflow error: ${err}` }, 500);
  }
});

app.delete("/workflows/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`${kp(c)}workflow:${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Delete workflow error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  LOGGING  (env-aware)
// ═══════════════════════════════════════════════════════════

app.post("/log-error", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `error_${uid()}`;
    await kv.set(`${kp(c)}errlog:${id}`, { ...body, id });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Log error failed: ${err}` }, 500);
  }
});

app.post("/log-audit", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `audit_${uid()}`;
    await kv.set(`${kp(c)}auditlog:${id}`, { ...body, id });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Log audit failed: ${err}` }, 500);
  }
});

app.get("/logs/errors", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}errlog:`);
    return c.json({ logs });
  } catch (err) {
    return c.json({ error: `Get error logs error: ${err}` }, 500);
  }
});

app.get("/logs/audit", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}auditlog:`);
    return c.json({ logs });
  } catch (err) {
    return c.json({ error: `Get audit logs error: ${err}` }, 500);
  }
});

app.get("/audit-logs", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}auditlog:`);
    return c.json({ logs });
  } catch (err) {
    return c.json({ error: `Get audit logs error: ${err}` }, 500);
  }
});

app.delete("/logs/errors", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}errlog:`);
    const keys = logs.map((l: any) => `${kp(c)}errlog:${l.id}`);
    if (keys.length > 0) await kv.mdel(keys);
    return c.json({ success: true, deleted: keys.length });
  } catch (err) {
    return c.json({ error: `Clear error logs error: ${err}` }, 500);
  }
});

app.delete("/logs/audit", async (c) => {
  try {
    const logs = await kv.getByPrefix(`${kp(c)}auditlog:`);
    const keys = logs.map((l: any) => `${kp(c)}auditlog:${l.id}`);
    if (keys.length > 0) await kv.mdel(keys);
    return c.json({ success: true, deleted: keys.length });
  } catch (err) {
    return c.json({ error: `Clear audit logs error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  BULK UPLOAD  (env-aware)
// ═══════════════════════════════════════════════════════════

app.post("/bulk-upload/:type", async (c) => {
  try {
    const { type } = c.req.param();
    const body = await c.req.json();
    const records = body.records || [];
    const prefixMap: Record<string, string> = {
      assets: "asset",
      software: "software",
      incidents: "incident",
      "maintenance-logs": "maint",
      deregistrations: "dereg",
      "faulty-assets": "faulty",
    };
    const entityPrefix = prefixMap[type] || type;
    const created: any[] = [];

    for (const record of records) {
      const id = `${entityPrefix}_${uid()}`;
      const item = { id, ...record, createdAt: now(), updatedAt: now() };
      await kv.set(`${kp(c)}${entityPrefix}:${id}`, item);
      created.push(item);
    }
    return c.json({ success: true, created: created.length, records: created }, 201);
  } catch (err) {
    return c.json({ error: `Bulk upload error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN DEMO DATA  (env-aware)
// ═══════════════════════════════════════════════════════════

app.post("/seed-demo-logs", async (c) => {
  try {
    const users = ["Admin", "Kingsley", "Lateef", "Kelvin", "Mosun"];
    const actions = ["Create", "Update", "Delete", "Login", "Logout"];
    const modules = ["Asset Management", "Software Management", "Incident Reports", "IT Deregistration", "IT Maintenance"];
    const statuses: ("success" | "failed")[] = ["success", "success", "success", "failed"];

    for (let i = 0; i < 20; i++) {
      const id = `audit_demo_${uid()}`;
      const log = {
        id,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        module: modules[Math.floor(Math.random() * modules.length)],
        details: "Demo log entry",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
      };
      await kv.set(`${kp(c)}auditlog:${id}`, log);
    }

    for (let i = 0; i < 10; i++) {
      const id = `error_demo_${uid()}`;
      const log = {
        id,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        severity: ["error", "warning", "info", "critical"][Math.floor(Math.random() * 4)],
        module: modules[Math.floor(Math.random() * modules.length)],
        errorMessage: "Demo error log entry",
        user: users[Math.floor(Math.random() * users.length)],
      };
      await kv.set(`${kp(c)}errlog:${id}`, log);
    }

    return c.json({ success: true, message: "Demo logs seeded" });
  } catch (err) {
    return c.json({ error: `Seed demo logs error: ${err}` }, 500);
  }
});

app.post("/seed-demo-maintenance", async (c) => {
  try {
    const technicians = ["Lateef", "Kelvin", "Mosun"];
    const statuses = ["Pending", "In Progress", "Completed"];
    const types = ["Preventive", "Corrective", "Emergency"];

    for (let i = 0; i < 10; i++) {
      const id = `maint_demo_${uid()}`;
      const log = {
        id,
        assetName: `Asset ${i + 1}`,
        serviceTag: `ST-DEMO-${i + 1}`,
        maintenanceType: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        technician: technicians[Math.floor(Math.random() * technicians.length)],
        scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: "Demo maintenance entry",
        createdAt: now(),
        updatedAt: now(),
      };
      await kv.set(`${kp(c)}maint:${id}`, log);
    }

    return c.json({ success: true, message: "Demo maintenance logs seeded" });
  } catch (err) {
    return c.json({ error: `Seed demo maintenance error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  CLEAR ALL DATA  (env-aware — only clears the active namespace)
// ═══════════════════════════════════════════════════════════

app.delete("/clear-all-data", async (c) => {
  try {
    const prefix = kp(c);
    const dataPrefixes = [
      "asset:", "software:", "incident:", "it_issue:", "dereg:",
      "maint:", "faulty:", "forum:", "po:", "notif:",
      "errlog:", "auditlog:", "workflow:",
    ];
    let totalDeleted = 0;

    for (const dp of dataPrefixes) {
      const items = await kv.getByPrefix(`${prefix}${dp}`);
      const keys = items.map((item: any) => `${prefix}${dp}${item.id}`);
      if (keys.length > 0) {
        await kv.mdel(keys);
        totalDeleted += keys.length;
      }
    }

    console.log(`Cleared ${totalDeleted} records from ${prefix || "production"} namespace`);
    return c.json({ success: true, deleted: totalDeleted, environment: prefix === "test_" ? "test" : "production" });
  } catch (err) {
    console.error("Clear data error:", err);
    return c.json({ error: `Clear data error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  DEPARTMENTS  (env-aware)
// ═══════════════════════════════════════════════════════════

const DEFAULT_DEPARTMENTS = [
  "TP","CP","EMM","RDS","PCFW","BAS","FAS & PMG",
  "Internal Audit and Enterprise Risk Services",
  "Forensic, Cybersecurity and Compliance Services",
  "Accounting Advisory","F&A","HR","M&B","ITS",
];

app.get("/departments", async (c) => {
  try {
    const stored = await kv.get(`${kp(c)}departments_config`);
    if (stored && Array.isArray(stored.departments)) {
      return c.json({ departments: stored.departments });
    }
    return c.json({ departments: DEFAULT_DEPARTMENTS });
  } catch (err) {
    return c.json({ error: `Get departments error: ${err}` }, 500);
  }
});

app.put("/departments", async (c) => {
  try {
    const { departments } = await c.req.json();
    if (!Array.isArray(departments)) return c.json({ error: "departments must be an array" }, 400);
    await kv.set(`${kp(c)}departments_config`, { departments, updatedAt: now() });
    return c.json({ departments });
  } catch (err) {
    return c.json({ error: `Update departments error: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
//  UNITS  (env-aware)
// ═══════════════════════════════════════════════════════════

const DEFAULT_UNITS = ["ITS", "Finance", "HR", "Marketing"];

app.get("/units", async (c) => {
  try {
    const stored = await kv.get(`${kp(c)}units_config`);
    if (stored && Array.isArray(stored.units)) {
      return c.json({ units: stored.units });
    }
    return c.json({ units: DEFAULT_UNITS });
  } catch (err) {
    return c.json({ error: `Get units error: ${err}` }, 500);
  }
});

app.put("/units", async (c) => {
  try {
    const { units } = await c.req.json();
    if (!Array.isArray(units)) return c.json({ error: "units must be an array" }, 400);
    await kv.set(`${kp(c)}units_config`, { units, updatedAt: now() });
    return c.json({ units });
  } catch (err) {
    return c.json({ error: `Update units error: ${err}` }, 500);
  }
});

// ─── Start ─────────────────────────────────────────────────
Deno.serve(app.fetch);