const SESSION_COOKIE = "lidire_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 100000;
const encoder = new TextEncoder();

function withSecurityHeaders(response, isApi = false) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  if (isApi) {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async scheduled(controller, env, ctx) {
    // MVP-1.0I: tarefas agendadas do Gmail desativadas.
    return;
  },
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return withSecurityHeaders(await handleApi(request, env, url), true);
      } catch (error) {
        console.error("LiDire API error:", error);
        return withSecurityHeaders(Response.json(
          {
            error: "internal_error",
            message: "Não foi possível concluir a solicitação."
          },
          { status: 500 }
        ), true);
      }
    }

    // Dedicated share pages keep social crawlers away from the SPA shell.
    // WhatsApp/Facebook receive a small, static HTML document with absolute
    // OG image URLs; normal users can continue into the real invitation flow.
    if (url.pathname === "/convite") {
      return buildSharePage(url, "invite");
    }
    if (url.pathname === "/divulgacao") {
      return buildSharePage(url, "promo");
    }

    // Explicit image routes make social previews reliable on Cloudflare Workers.
    // Some crawlers do not treat an asset served through the generic fallback
    // exactly like a direct image response.
    if (url.pathname === "/lidire-social-preview.png" || url.pathname === "/lidire-invite-preview.png" || url.pathname === "/logo-lidire-oficial.png" || url.pathname === "/lidire-simbolo-coracao.png") {
      const imageResponse = await env.ASSETS.fetch(new Request(new URL(url.pathname, url.origin), request));
      const headers = new Headers(imageResponse.headers);
      headers.set("Content-Type", "image/png");
      headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(imageResponse.body, {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        headers
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);

    // Keep the root URL usable for the app itself. Social crawlers for
    // invitations should use /convite?token=..., which has a dedicated page.
    const contentType = assetResponse.headers.get("content-type") || "";
    if (url.pathname === "/" && contentType.includes("text/html")) {
      const html = await assetResponse.text();
      const imagePath = "/lidire-social-preview.png";
      const title = "LiDire — Seu Copiloto para a Vida";
      const description = "Organize sua rotina, compartilhe o que importa e viva melhor com a LiDire.";
      const canonicalUrl = `${url.origin}/`;
      const absoluteImage = `${url.origin}${imagePath}`;
      let body = html.replaceAll("__LIDIRE_ORIGIN__", url.origin);
      body = body.replaceAll("__LIDIRE_SOCIAL_TITLE__", escapeHtml(title));
      body = body.replaceAll("__LIDIRE_SOCIAL_DESCRIPTION__", escapeHtml(description));
      body = body.replaceAll("__LIDIRE_SOCIAL_URL__", escapeHtml(canonicalUrl));
      body = body.replaceAll("__LIDIRE_SOCIAL_IMAGE__", escapeHtml(absoluteImage));
      const headers = new Headers(assetResponse.headers);
      headers.delete("content-length");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      return new Response(body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    return assetResponse;
  }
};

function buildSharePage(url, type) {
  const token = type === "invite" ? (url.searchParams.get("token") || "") : "";
  const isInvite = type === "invite";
  const inviteLanguage = "pt-BR";
  const isEnglish = false;
  const title = isInvite
    ? (isEnglish ? "You received an invitation to LiDire 💜" : "Você recebeu um convite para a LiDire 💜")
    : "LiDire — Seu Copiloto para a Vida";
  const description = isInvite
    ? (isEnglish ? "Join my family on LiDire and share what matters." : "Venha fazer parte da minha família na LiDire e compartilhar o que importa.")
    : "Organize sua rotina, compartilhe o que importa e viva melhor com a LiDire.";
  const imagePath = isInvite ? "/lidire-invite-preview.png" : "/lidire-social-preview.png";
  const absoluteImage = `${url.origin}${imagePath}`;
  const destination = isInvite && token
    ? `${url.origin}/?convite=${encodeURIComponent(token)}`
    : `${url.origin}/`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url.href);
  const safeImage = escapeHtml(absoluteImage);
  const safeDestination = escapeHtml(destination);
  const html = `<!doctype html>
<html lang="${inviteLanguage}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LiDire">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:url" content="${safeUrl}">
<meta property="og:image" content="${safeImage}">
<meta property="og:image:secure_url" content="${safeImage}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${safeTitle}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="${safeImage}">
<style>
html,body{margin:0;min-height:100%;background:#070c22;color:#fff;font-family:Arial,Helvetica,sans-serif}
main{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;box-sizing:border-box}
.card{width:min(560px,100%);padding:32px;border:1px solid rgba(132,95,255,.28);border-radius:28px;background:linear-gradient(145deg,#11183b,#17133b);box-shadow:0 24px 80px rgba(0,0,0,.35);text-align:center;box-sizing:border-box}
img{display:block;width:100%;max-width:500px;height:auto;aspect-ratio:1200/630;object-fit:cover;margin:0 auto 24px;border-radius:18px;border:1px solid rgba(132,95,255,.28);box-shadow:0 18px 45px rgba(0,0,0,.28)}.eyebrow{font-size:12px;letter-spacing:.18em;color:#9da7d0;font-weight:700}.title{font-size:30px;line-height:1.15;margin:14px 0}.text{font-size:17px;line-height:1.55;color:#b8bfd9}.button{display:inline-block;margin-top:18px;padding:14px 22px;border-radius:14px;text-decoration:none;color:#fff;font-weight:700;background:linear-gradient(90deg,#7652f6,#4e83ff)}
</style>
</head>
<body><main><section class="card">
<img src="${safeImage}" alt="LiDire">
<div class="eyebrow">${isInvite ? (isEnglish ? "FAMILY INVITATION" : "CONVITE FAMILIAR") : "LIDIRE"}</div>
<div class="title">${safeTitle}</div>
<div class="text">${safeDescription}</div>
<a class="button" href="${safeDestination}">${isInvite ? (isEnglish ? "Continue to LiDire" : "Continuar para a LiDire") : (isEnglish ? "Explore LiDire" : "Conhecer a LiDire")}</a>
</section></main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}


function decodeInviteLanguage(token) { return "pt-BR"; }

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function handleApi(request, env, url) {
  // MVP-1.0I: integração Gmail desativada. Nenhuma rota OAuth, mensagens ou acompanhamentos é atendida.
  if (url.pathname.startsWith("/api/gmail/") || url.pathname.startsWith("/api/connections/gmail")) {
    return Response.json(
      { error: "A integração com Gmail foi desativada nesta versão." },
      { status: 410, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (request.method === "GET" && url.pathname === "/api/health") {
    return Response.json({
      ok: true,
      app: "LiDire TRIGÉSIMO",
      database: !!env.DB
    });
  }

  if (!env.DB) {
    return Response.json(
      { error: "database_unavailable", message: "Banco D1 não configurado." },
      { status: 503 }
    );
  }

  if (url.pathname === "/api/register" && request.method === "POST") {
    return register(request, env, url);
  }

  if (url.pathname === "/api/email/verification/resend" && request.method === "POST") {
    return resendEmailVerification(request, env, url);
  }

  if (url.pathname === "/api/email/verify" && request.method === "GET") {
    return verifyEmail(request, env, url);
  }

  if (url.pathname === "/api/login/challenge" && request.method === "POST") {
    return loginChallenge(request, env);
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    return login(request, env);
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    return logout(request, env);
  }

  if (url.pathname === "/api/connections" && request.method === "GET") {
    return listConnections(request, env);
  }

  if (url.pathname === "/api/connections/google" && request.method === "POST") {
    return connectGoogle(request, env);
  }

  if (url.pathname === "/api/connections/gmail/start" && request.method === "GET") return startGmailConnection(request, env, url);
  if (url.pathname === "/api/connections/gmail/callback" && request.method === "GET") return gmailConnectionCallback(request, env, url);
  if (url.pathname === "/api/gmail/messages" && request.method === "GET") return listGmailMessages(request, env, url);
  if (url.pathname === "/api/gmail/important-senders" && request.method === "GET") return listGmailImportantSenders(request, env);
  if (url.pathname === "/api/gmail/important-senders" && request.method === "POST") return saveGmailImportantSender(request, env);
  if (url.pathname.startsWith("/api/gmail/important-senders/") && request.method === "DELETE") return deleteGmailImportantSender(request, env, url);
  if (url.pathname === "/api/gmail/followups" && request.method === "GET") return listGmailFollowups(request, env);
  if (url.pathname === "/api/connections/gmail" && request.method === "DELETE") return disconnectGmail(request, env);

  if (url.pathname === "/api/connections/apple/start" && request.method === "GET") {
    return startAppleConnection(request, env, url);
  }

  if (url.pathname === "/api/connections/apple/callback" && request.method === "POST") {
    return appleConnectionCallback(request, env, url);
  }

  if (url.pathname === "/api/me" && request.method === "GET") {
    const user = await getSessionUser(request, env);
    return Response.json({ user, database: true });
  }

  if (url.pathname === "/api/profile" && request.method === "GET") {
    const user = await getSessionUser(request, env);
    return Response.json({ user, database: true });
  }

  // MVP-1.0C: fluxo de convites de Família/Grupos congelado. Dados existentes não são apagados.
  if (url.pathname === "/api/family/invitations" || url.pathname.startsWith("/api/family/invitations/") || url.pathname === "/api/groups/invitations" || url.pathname.startsWith("/api/groups/invitations/")) {
    return Response.json({ error: "family_module_disabled", message: "O módulo Família está temporariamente desativado nesta versão." }, { status: 410 });
  }

  if (url.pathname === "/api/groups/invitations" && request.method === "GET") return listGroupInvitations(request, env);
  if (url.pathname === "/api/groups/invitations" && request.method === "POST") return createGroupInvitation(request, env);
  if (url.pathname.startsWith("/api/groups/invitations/") && request.method === "POST") return respondGroupInvitation(request, env, url);
  if (url.pathname.startsWith("/api/groups/invitations/") && request.method === "DELETE") return deleteGroupInvitation(request, env, url);

  if (url.pathname === "/api/family" && request.method === "GET") {
    return listFamily(request, env);
  }

  if (url.pathname === "/api/family/check-email" && request.method === "GET") {
    return checkFamilyEmail(request, env, url);
  }

  if (url.pathname === "/api/family/members" && request.method === "POST") {
    return createFamilyMember(request, env);
  }

  if (url.pathname.startsWith("/api/family/members/") && request.method === "PUT") {
    return updateFamilyMember(request, env, url);
  }

  if (url.pathname.startsWith("/api/family/members/") && request.method === "DELETE") {
    return deleteFamilyMember(request, env, url);
  }

  if (url.pathname === "/api/family/shared/tasks" && request.method === "GET") {
    return listSharedFamilyTasks(request, env);
  }

  if (url.pathname === "/api/family/shared/tasks/sync" && request.method === "POST") {
    return syncSharedFamilyTasks(request, env);
  }

  const sharedModuleRoute = url.pathname.match(/^\/api\/family\/shared\/(agenda|compras|estudos|treinos|hidratacao|alimentacao|financas|objetivos|lembretes)(?:\/sync)?$/);
  if (sharedModuleRoute && request.method === "GET" && !url.pathname.endsWith("/sync")) {
    return listSharedFamilyResources(request, env, sharedModuleRoute[1]);
  }
  if (sharedModuleRoute && request.method === "POST" && url.pathname.endsWith("/sync")) {
    return syncSharedFamilyResources(request, env, sharedModuleRoute[1]);
  }

  if (url.pathname === "/api/family/notifications" && request.method === "POST") {
    return sendFamilyNotification(request, env);
  }

  if (url.pathname === "/api/family/invitations" && request.method === "GET") {
    return listFamilyInvitations(request, env);
  }

  if (url.pathname.startsWith("/api/family/invitations/") && request.method === "POST") {
    return respondFamilyInvitation(request, env, url);
  }

  if (url.pathname === "/api/cycle/periods" && request.method === "GET") {
    return listCyclePeriods(request, env);
  }

  if (url.pathname === "/api/cycle/periods" && request.method === "POST") {
    return createCyclePeriod(request, env);
  }

  if (url.pathname.startsWith("/api/cycle/periods/") && request.method === "PUT") {
    return updateCyclePeriod(request, env, url);
  }

  if (url.pathname.startsWith("/api/cycle/periods/") && request.method === "DELETE") {
    return deleteCyclePeriod(request, env, url);
  }

  if (url.pathname === "/api/notes" && request.method === "GET") {
    return listNotes(request, env);
  }

  if (url.pathname === "/api/notes" && request.method === "POST") {
    return createNote(request, env);
  }

  if (url.pathname.startsWith("/api/notes/") && request.method === "PUT") {
    return updateNote(request, env, url);
  }

  if (url.pathname.startsWith("/api/notes/") && request.method === "DELETE") {
    return deleteNote(request, env, url);
  }

  if (url.pathname === "/api/notifications" && request.method === "GET") {
    return listNotifications(request, env, url);
  }

  if (url.pathname === "/api/notifications/trash" && request.method === "DELETE") {
    return emptyFamilyNotificationTrash(request, env);
  }

  if (url.pathname.startsWith("/api/notifications/") && url.pathname.endsWith("/reply") && request.method === "POST") {
    return respondToFamilyNotification(request, env, url);
  }

  if (url.pathname.startsWith("/api/notifications/") && request.method === "DELETE") {
    return deleteFamilyNotification(request, env, url);
  }

  if (url.pathname.startsWith("/api/notifications/") && request.method === "POST") {
    return markNotificationRead(request, env, url);
  }

  if (url.pathname === "/api/places/autocomplete" && request.method === "GET") {
    return autocompletePlaces(request, env, url);
  }

  if (url.pathname === "/api/routes" && request.method === "POST") {
    return calculateRoute(request, env);
  }

  if (url.pathname === "/api/ai/assistant" && request.method === "POST") {
    return assistantAI(request, env);
  }

  if (url.pathname === "/api/profile" && request.method === "PUT") {
    return updateProfile(request, env);
  }

  if (url.pathname === "/api/password-change/challenge" && request.method === "POST") {
    return passwordChangeChallenge(request, env);
  }

  if (url.pathname === "/api/password-change" && request.method === "POST") {
    return passwordChange(request, env);
  }

  if (url.pathname === "/api/security/app-lock" && request.method === "GET") {
    return getAppLockSettings(request, env);
  }

  if (url.pathname === "/api/security/app-lock" && request.method === "PUT") {
    return updateAppLockSettings(request, env);
  }

  if (url.pathname === "/api/security/app-lock/verify" && request.method === "POST") {
    return verifyAppLock(request, env);
  }

  if (url.pathname === "/api/password-reset/request" && request.method === "POST") {
    return requestPasswordReset(request, env);
  }

  if (url.pathname === "/api/password-reset/complete" && request.method === "POST") {
    return completePasswordReset(request, env);
  }

  if (url.pathname === "/api/account/export" && ["GET", "POST"].includes(request.method)) {
    return exportPersonalData(request, env);
  }

  if (url.pathname === "/api/account" && request.method === "DELETE") {
    return deleteAccount(request, env);
  }

  return Response.json(
    {
      error: "not_found",
      message: "Endpoint não implementado.",
      path: url.pathname
    },
    { status: 404 }
  );
}


async function ensureFamilyFeatureTables(db) {
  // Create current tables first; then safely upgrade older D1 schemas in place.
  await db.prepare(`CREATE TABLE IF NOT EXISTS family_groups (id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS family_members (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT, name TEXT, relation TEXT, email TEXT, address TEXT, role TEXT DEFAULT 'member', status TEXT DEFAULT 'pending', permissions_json TEXT DEFAULT '{}', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();

  const addColumn = async (table, column, definition) => {
    const info = await db.prepare(`PRAGMA table_info(${table})`).all();
    if (!(info.results || []).some(x => x.name === column)) {
      await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    }
  };

  // Older deployments may have created these tables with only a subset of columns.
  // Add every column used by the current family endpoints before querying them.
  for (const [column, definition] of [
    ['id', 'TEXT'], ['owner_user_id', 'TEXT'], ['name', 'TEXT'], ['created_at', 'TEXT']
  ]) await addColumn('family_groups', column, definition);

  for (const [column, definition] of [
    ['id', 'TEXT'], ['group_id', 'TEXT'], ['user_id', 'TEXT'], ['name', 'TEXT'],
    ['relation', 'TEXT'], ['email', 'TEXT'], ['address', 'TEXT'], ['role', "TEXT DEFAULT 'member'"],
    ['status', "TEXT DEFAULT 'pending'"], ['permissions_json', "TEXT DEFAULT '{}'"],
    ['created_at', 'TEXT'], ['updated_at', 'TEXT']
  ]) await addColumn('family_members', column, definition);

  // Older D1 versions declared family_members.user_id NOT NULL. An unregistered
  // family member has no users.id yet, so this column must allow NULL. Rebuild
  // the table only when the existing schema requires it, preserving all rows.
  const familyMemberColumns = await db.prepare(`PRAGMA table_info(family_members)`).all();
  const userIdColumn = (familyMemberColumns.results || []).find(x => x.name === 'user_id');
  if (userIdColumn && Number(userIdColumn.notnull) === 1) {
    await db.prepare(`CREATE TABLE family_members__v34 (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT,
      relation TEXT,
      email TEXT,
      address TEXT,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      permissions_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await db.prepare(`INSERT INTO family_members__v34
      (id, group_id, user_id, name, relation, email, address, role, status, permissions_json, created_at, updated_at)
      SELECT id, group_id, user_id, name, relation, email, address, role, status, permissions_json,
             COALESCE(created_at, CURRENT_TIMESTAMP), COALESCE(updated_at, CURRENT_TIMESTAMP)
      FROM family_members`).run();
    await db.prepare(`DROP TABLE family_members`).run();
    await db.prepare(`ALTER TABLE family_members__v34 RENAME TO family_members`).run();
  }

  await db.prepare(`UPDATE family_groups SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL`).run();
  await db.prepare(`UPDATE family_members SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL`).run();
  await db.prepare(`UPDATE family_members SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS family_invites (
    id TEXT PRIMARY KEY, family_member_id TEXT, group_id TEXT,
    owner_user_id TEXT, recipient_user_id TEXT,
    invitee_email TEXT NOT NULL DEFAULT '', invitee_name TEXT NOT NULL DEFAULT 'Familiar',
    status TEXT DEFAULT 'pending', token TEXT NOT NULL DEFAULT '', permissions_json TEXT NOT NULL DEFAULT '{}', created_at TEXT DEFAULT CURRENT_TIMESTAMP, responded_at TEXT
  )`).run();
  // Upgrade a pre-existing family_invites table before creating indexes that use its columns.
  // Older D1 schemas may require invitee_email; always provide it on inserts below.
  for (const [column, definition] of [
    ['id', 'TEXT'], ['family_member_id', 'TEXT'], ['group_id', 'TEXT'],
    ['owner_user_id', 'TEXT'], ['recipient_user_id', 'TEXT'], ['invitee_email', "TEXT NOT NULL DEFAULT ''"],
    ['invitee_name', "TEXT NOT NULL DEFAULT 'Familiar'"],
    ['status', "TEXT DEFAULT 'pending'"], ['token', "TEXT NOT NULL DEFAULT ''"], ['permissions_json', "TEXT NOT NULL DEFAULT '{}'"], ['created_at', 'TEXT'], ['responded_at', 'TEXT']
  ]) await addColumn('family_invites', column, definition);
  await db.prepare(`UPDATE family_invites SET status = COALESCE(status, 'pending'), token = CASE WHEN token IS NULL OR token = '' THEN id ELSE token END, created_at = COALESCE(created_at, CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_family_invites_recipient ON family_invites(recipient_user_id, status)`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS family_notifications (id TEXT PRIMARY KEY, sender_user_id TEXT NOT NULL, recipient_user_id TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, read_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  for (const [column, definition] of [
    ['id', 'TEXT'], ['sender_user_id', 'TEXT'], ['recipient_user_id', 'TEXT'],
    ['title', 'TEXT'], ['message', 'TEXT'], ['read_at', 'TEXT'], ['created_at', 'TEXT'],
    ['family_member_id', 'TEXT'], ['resource_type', 'TEXT'], ['action', 'TEXT'],
    ['resource_id', 'TEXT'], ['response_to_id', 'TEXT'], ['response_status', 'TEXT'], ['deleted_at', 'TEXT'], ['acknowledged_at', 'TEXT']
  ]) await addColumn('family_notifications', column, definition);
  await db.prepare(`UPDATE family_notifications SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_family_notifications_recipient ON family_notifications(recipient_user_id, created_at)`).run();
}

async function requireUser(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return null;
  await ensureFamilyFeatureTables(env.DB);
  return user;
}

async function ensureUserFamilyGroup(db, userId) {
  let group = await db.prepare(`SELECT id, name FROM family_groups WHERE owner_user_id = ? ORDER BY created_at LIMIT 1`).bind(userId).first();
  if (!group) {
    const id = crypto.randomUUID();
    await db.prepare(`INSERT INTO family_groups (id, owner_user_id, name) VALUES (?, ?, ?)`).bind(id, userId, "Minha família").run();
    group = { id, name: "Minha família" };
  }
  return group;
}

function safeJson(value, fallback = {}) {
  try { return JSON.parse(String(value || "")); } catch { return fallback; }
}

let groupInvitationTableReady = false;
let groupInvitationTableSetupPromise = null;
async function ensureGroupInvitationTable(db) {
  if (groupInvitationTableReady) return;
  if (groupInvitationTableSetupPromise) return groupInvitationTableSetupPromise;
  groupInvitationTableSetupPromise = (async () => {
  await db.prepare(`CREATE TABLE IF NOT EXISTS group_invitations (
    id TEXT PRIMARY KEY, group_id TEXT NOT NULL, group_name TEXT NOT NULL,
    owner_user_id TEXT NOT NULL, recipient_user_id TEXT NOT NULL, recipient_email TEXT NOT NULL,
    resources_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, responded_at TEXT
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_group_invitations_recipient ON group_invitations(recipient_user_id, status)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_group_invitations_owner ON group_invitations(owner_user_id, status)`).run();
  // Ciência/exclusão feita por cada lado fica gravada no servidor (antes era só local e o convite voltava).
  for (const column of ["owner_hidden_at", "recipient_hidden_at"]) {
    try { await db.prepare(`ALTER TABLE group_invitations ADD COLUMN ${column} TEXT`).run(); } catch (_) { /* coluna já existe */ }
  }
  groupInvitationTableReady = true;
  })();
  try { await groupInvitationTableSetupPromise; }
  finally { groupInvitationTableSetupPromise = null; }
}

let familySharedTasksTableReady = false;
let familySharedTasksSetupPromise = null;
async function ensureFamilySharedTasksTable(db) {
  if (familySharedTasksTableReady) return;
  if (familySharedTasksSetupPromise) return familySharedTasksSetupPromise;
  familySharedTasksSetupPromise = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS family_shared_tasks (
      owner_user_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      task_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (owner_user_id, task_id)
    )`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_family_shared_tasks_owner_updated
      ON family_shared_tasks(owner_user_id, updated_at)`).run();
    familySharedTasksTableReady = true;
  })();
  try { await familySharedTasksSetupPromise; }
  finally { familySharedTasksSetupPromise = null; }
}

async function createGroupInvitation(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureGroupInvitationTable(env.DB);
  const body = await readJson(request);
  const groupId = String(body.groupId || "").trim().slice(0, 120);
  const groupName = String(body.groupName || "").trim().slice(0, 120);
  const email = normalizeEmail(body.recipientEmail || "");
  const resources = Array.isArray(body.resources) ? body.resources.map(x => String(x).slice(0,80)).slice(0,30) : [];
  if (!groupId || !groupName || !isValidEmail(email)) return Response.json({ error:"invalid_input", message:"Informe um grupo e um e-mail válido." }, {status:400});
  if (email === normalizeEmail(user.email)) return Response.json({ error:"self_invite", message:"Você não pode convidar sua própria conta." }, {status:400});
  const recipient = await env.DB.prepare(`SELECT id, name, email FROM users WHERE lower(email)=lower(?) LIMIT 1`).bind(email).first();
  if (!recipient) return Response.json({ error:"recipient_not_registered", message:"Usuário não cadastrado na LiDire com esse e-mail." }, {status:404});
  const existing = await env.DB.prepare(`SELECT id,status FROM group_invitations WHERE group_id=? AND owner_user_id=? AND recipient_user_id=? AND status='pending' LIMIT 1`).bind(groupId,user.id,recipient.id).first();
  if (existing) {
    // Reenvio explícito: mantém o convite pendente e cria uma nova notificação in-app.
    await env.DB.prepare(`INSERT INTO family_notifications
        (id,sender_user_id,recipient_user_id,family_member_id,resource_type,action,title,message,resource_id,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(crypto.randomUUID(),user.id,recipient.id,groupId,"group_invitation","open_groups",
        `Convite para o grupo ${groupName}`,
        `${user.name || user.email} reenviou o convite para o grupo ${groupName}. Abra LiDire > Família > Convites > GRUPOS para aceitar ou recusar.`,
        existing.id).run();
    return Response.json({ok:true,duplicate:true,invitation:existing,resent:true});
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO group_invitations (id,group_id,group_name,owner_user_id,recipient_user_id,recipient_email,resources_json,status) VALUES (?,?,?,?,?,?,?,'pending')`)
    .bind(id,groupId,groupName,user.id,recipient.id,email,JSON.stringify(resources)).run();
  // Cria também uma notificação in-app para o convidado; o convite permanece na tabela própria.
  await env.DB.prepare(`INSERT INTO family_notifications
      (id,sender_user_id,recipient_user_id,family_member_id,resource_type,action,title,message,resource_id,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(crypto.randomUUID(),user.id,recipient.id,groupId,`group_invitation`,`open_groups`,
      `Convite para o grupo ${groupName}`,
      `${user.name || user.email} convidou você para o grupo ${groupName}. Abra LiDire > Família > Convites > GRUPOS para aceitar ou recusar.`,
      id).run();
  return Response.json({ok:true, invitation:{id,groupId,groupName,recipientEmail:email,recipientId:recipient.id,status:'pending',resources}});
}

async function listGroupInvitations(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({error:"unauthorized",message:"Entre na sua conta."},{status:401});
  await ensureGroupInvitationTable(env.DB);
  const rows = await env.DB.prepare(`SELECT i.*, sender.name AS sender_name, sender.email AS sender_email, recipient.name AS recipient_name
    FROM group_invitations i LEFT JOIN users sender ON sender.id=i.owner_user_id LEFT JOIN users recipient ON recipient.id=i.recipient_user_id
    WHERE (i.recipient_user_id=? AND i.recipient_hidden_at IS NULL) OR (i.owner_user_id=? AND i.owner_hidden_at IS NULL) ORDER BY i.created_at DESC LIMIT 200`).bind(user.id,user.id).all();
  return Response.json({ok:true,invitations:(rows.results||[]).map(r=>({...r,resources:safeJson(r.resources_json,[]),direction:r.recipient_user_id===user.id?'received':'sent'}))});
}

async function deleteGroupInvitation(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({error:"unauthorized",message:"Entre na sua conta."},{status:401});
  await ensureGroupInvitationTable(env.DB);
  const id = decodeURIComponent(url.pathname.split('/').pop() || '');
  const invite = await env.DB.prepare(`SELECT id,status,owner_user_id,recipient_user_id FROM group_invitations WHERE id=? AND (owner_user_id=? OR recipient_user_id=?) LIMIT 1`).bind(id,user.id,user.id).first();
  if (!invite) return Response.json({error:"invitation_not_found",message:"Convite não encontrado."},{status:404});
  const status = String(invite.status || "").toLowerCase();
  if (invite.owner_user_id === user.id) {
    // Titular: convite pendente é cancelado (some para os dois lados); já respondido só sai da lista dele.
    if (status === "pending") {
      await env.DB.prepare(`DELETE FROM group_invitations WHERE id=? AND owner_user_id=?`).bind(id,user.id).run();
      return Response.json({ok:true,id,removed:true});
    }
    await env.DB.prepare(`UPDATE group_invitations SET owner_hidden_at=CURRENT_TIMESTAMP WHERE id=? AND owner_user_id=?`).bind(id,user.id).run();
  } else {
    // Destinatário: precisa responder antes; depois a ciência/exclusão fica gravada para ele.
    if (status === "pending") return Response.json({error:"invitation_pending",message:"Aceite ou recuse o convite antes de retirá-lo da lista."},{status:409});
    await env.DB.prepare(`UPDATE group_invitations SET recipient_hidden_at=CURRENT_TIMESTAMP WHERE id=? AND recipient_user_id=?`).bind(id,user.id).run();
  }
  await env.DB.prepare(`DELETE FROM group_invitations WHERE id=? AND owner_hidden_at IS NOT NULL AND recipient_hidden_at IS NOT NULL`).bind(id).run();
  return Response.json({ok:true,id,hidden:true});
}

async function respondGroupInvitation(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({error:"unauthorized",message:"Entre na sua conta."},{status:401});
  await ensureGroupInvitationTable(env.DB);
  const id = decodeURIComponent(url.pathname.split('/').pop() || '');
  const body = await readJson(request);
  const decision = String(body.decision||'').toLowerCase();
  if (!['accept','reject'].includes(decision)) return Response.json({error:'invalid_decision',message:'Escolha aceitar ou recusar.'},{status:400});
  const invite = await env.DB.prepare(`SELECT * FROM group_invitations WHERE id=? AND recipient_user_id=? AND status='pending' LIMIT 1`).bind(id,user.id).first();
  if (!invite) return Response.json({error:'invitation_not_found',message:'Convite pendente não encontrado.'},{status:404});
  const status = decision==='accept'?'accepted':'rejected';
  await env.DB.prepare(`UPDATE group_invitations SET status=?,responded_at=CURRENT_TIMESTAMP WHERE id=? AND recipient_user_id=?`).bind(status,id,user.id).run();
  return Response.json({ok:true,id,status,groupId:invite.group_id,groupName:invite.group_name});
}

// B2: consentimento de compartilhamento.
// shareConsentVersion só é gravado quando o titular confirma explicitamente as permissões no formulário
// (shareConsentConfirmed === true). Permissões antigas, sem esse selo, nunca valem como consentimento.
const FAMILY_SHARE_PERMISSION_KEYS = ["shareTasksData","tarefas","agenda","compras","estudos","treinos","hidratacao","alimentacao","financas","objetivos","lembretes","cicloMenstrual"];
function effectiveFamilyPermissions(raw) {
  const stored = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  if (stored.shareConsentVersion === 1) return { ...stored };
  const result = { ...stored };
  delete result.shareConsentVersion;
  for (const key of FAMILY_SHARE_PERMISSION_KEYS) result[key] = false;
  result.consentRequired = true;
  return result;
}
function buildFamilyPermissionsForSave(body, existingPermissions) {
  const confirmed = body?.shareConsentConfirmed === true;
  const incoming = body?.permissions && typeof body.permissions === "object" && !Array.isArray(body.permissions) ? body.permissions : null;
  if (!incoming || !confirmed) {
    // Sem confirmação explícita: nada novo é concedido. Cadastro novo nasce sem compartilhamento;
    // edição mantém o que já estava gravado (com ou sem consentimento).
    const base = existingPermissions && typeof existingPermissions === "object" ? { ...existingPermissions } : {};
    if (!existingPermissions) for (const key of FAMILY_SHARE_PERMISSION_KEYS) base[key] = false;
    return base;
  }
  const clean = {};
  for (const key of FAMILY_SHARE_PERMISSION_KEYS) clean[key] = incoming[key] === true;
  clean.shareConsentVersion = 1;
  return clean;
}
async function listFamily(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const group = await ensureUserFamilyGroup(env.DB, user.id);
  const rows = await env.DB.prepare(`SELECT id, user_id, name, relation, email, address, role, status, permissions_json, created_at, updated_at FROM family_members WHERE group_id = ? ORDER BY created_at`).bind(group.id).all();
  return Response.json({ ok: true, group, members: (rows.results || []).map(x => ({ ...x, permissions: effectiveFamilyPermissions(safeJson(x.permissions_json, {})) })) });
}

async function checkFamilyEmail(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });

  const email = normalizeEmail(url.searchParams.get("email") || "");
  if (!isValidEmail(email)) {
    return Response.json({ error: "invalid_email", message: "Informe um e-mail válido." }, { status: 400 });
  }

  const group = await ensureUserFamilyGroup(env.DB, user.id);
  const familyMember = await env.DB.prepare(
    `SELECT id, user_id, name, relation, email, status FROM family_members WHERE group_id = ? AND lower(email) = lower(?) LIMIT 1`
  ).bind(group.id, email).first();

  const account = await env.DB.prepare(
    `SELECT id, name, email FROM users WHERE lower(email) = lower(?) LIMIT 1`
  ).bind(email).first();

  return Response.json({
    ok: true,
    email,
    alreadyFamilyMember: !!familyMember,
    familyMember: familyMember || null,
    accountExists: !!account,
    account: account ? { id: account.id, name: account.name, email: account.email } : null,
    status: familyMember?.status || (account ? "registered" : "not_registered")
  });
}

async function createFamilyMember(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });

  const body = await readJson(request);
  const name = String(body.name || "").trim();
  const relation = String(body.relation || "Membro").trim();
  const email = normalizeEmail(body.email || "");
  const address = String(body.address || "").trim();
  const permissions = buildFamilyPermissionsForSave(body, null);
  if (name.length < 2 || !isValidEmail(email)) return Response.json({ error: "invalid_member", message: "Informe nome e e-mail válidos." }, { status: 400 });
  const group = await ensureUserFamilyGroup(env.DB, user.id);
  const existing = await env.DB.prepare(`SELECT id FROM family_members WHERE group_id = ? AND lower(email) = lower(?) LIMIT 1`).bind(group.id, email).first();
  if (existing) return Response.json({ error: "member_exists", message: "Esse familiar já está cadastrado." }, { status: 409 });
  const account = await env.DB.prepare(`SELECT id, name, email FROM users WHERE lower(email) = lower(?) LIMIT 1`).bind(email).first();
  const id = crypto.randomUUID();
  const status = account && account.id !== user.id ? "pending_acceptance" : "pending";
  await env.DB.prepare(`INSERT INTO family_members (id, group_id, user_id, name, relation, email, address, role, status, permissions_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'member', ?, ?, CURRENT_TIMESTAMP)`).bind(id, group.id, account?.id || null, name, relation, email, address, status, JSON.stringify(permissions)).run();
  let inviteId = null;
  if (account && account.id !== user.id) {
    inviteId = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO family_invites (id, family_member_id, group_id, owner_user_id, recipient_user_id, invitee_email, invitee_name, status, token, permissions_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`).bind(inviteId, id, group.id, user.id, account.id, email, name, inviteId, JSON.stringify(permissions || {})).run();
    await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, title, message) VALUES (?, ?, ?, ?, 'family_invitation', 'open_family', ?, ?)`).bind(crypto.randomUUID(), user.id, account.id, id, "Convite familiar pendente", `${user.name || "Uma pessoa"} convidou você para compartilhar a família na LiDire. Entre no aplicativo e aceite ou recuse o convite na área Família.`).run();
  }
  return Response.json({ ok: true, invitationCreated: !!inviteId, member: { id, group_id: group.id, user_id: account?.id || null, name, relation, email, address, status, permissions: effectiveFamilyPermissions(permissions), inviteId } });
}

// B5: a cópia compartilhada no servidor só pode existir enquanto houver ao menos um destinatário
// autorizado (ativo/aceito, com shareConsentVersion e a permissão do módulo). Chamada sempre que um vínculo
// ou permissão deixa de valer (edição, exclusão, recusa de convite, exclusão de conta do destinatário),
// sem depender de o app do titular reenviar a sincronização.
async function purgeUnauthorizedSharedCopies(db, ownerId) {
  await ensureFamilySharedTasksTable(db);
  await ensureFamilySharedResourcesTable(db);
  const group = await db.prepare(`SELECT id FROM family_groups WHERE owner_user_id = ? ORDER BY created_at LIMIT 1`).bind(ownerId).first();
  const rows = group
    ? ((await db.prepare(`SELECT status, permissions_json FROM family_members WHERE group_id = ? AND user_id IS NOT NULL`).bind(group.id).all()).results || [])
    : [];
  const members = rows.map(row => ({ status: String(row.status || "").toLowerCase(), permissions: safeJson(row.permissions_json, {}) }));
  const authorized = permission => members.some(member =>
    ["active", "accepted"].includes(member.status) && member.permissions.shareConsentVersion === 1 && member.permissions[permission] === true);
  const statements = [];
  if (!authorized("shareTasksData")) statements.push(db.prepare(`DELETE FROM family_shared_tasks WHERE owner_user_id = ?`).bind(ownerId));
  for (const [moduleKey, meta] of Object.entries(SHARED_RESOURCE_MODULES)) {
    if (!authorized(meta.permission)) statements.push(db.prepare(`DELETE FROM family_shared_resources WHERE owner_user_id = ? AND module_key = ?`).bind(ownerId, moduleKey));
  }
  if (statements.length) await db.batch(statements);
  return statements.length;
}
async function purgeUnauthorizedSharedCopiesSafe(db, ownerId) {
  try { await purgeUnauthorizedSharedCopies(db, ownerId); }
  catch (error) { console.warn("Falha ao limpar cópias compartilhadas:", error?.message || error); }
}

// Cria o convite pendente (e a notificação) para um membro que já tem conta LiDire.
// O vínculo só vira "active" quando o destinatário aceita em respondFamilyInvitation.
async function createPendingFamilyInvite(env, { owner, member, account, email, name, permissions }) {
  const pending = await env.DB.prepare(`SELECT id FROM family_invites WHERE family_member_id = ? AND recipient_user_id = ? AND status = 'pending' LIMIT 1`).bind(member.id, account.id).first();
  if (pending) return pending.id;
  const inviteId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO family_invites (id, family_member_id, group_id, owner_user_id, recipient_user_id, invitee_email, invitee_name, status, token, permissions_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`).bind(inviteId, member.id, member.group_id, owner.id, account.id, email, name, inviteId, JSON.stringify(permissions || {})).run();
  await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, title, message) VALUES (?, ?, ?, ?, 'family_invitation', 'open_family', ?, ?)`).bind(crypto.randomUUID(), owner.id, account.id, member.id, "Convite familiar pendente", `${owner.name || "Uma pessoa"} convidou você para compartilhar a família na LiDire. Entre no aplicativo e aceite ou recuse o convite na área Família.`).run();
  return inviteId;
}

async function listFamilyInvitations(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });


  // Repair invitations that were not created when the family member was first saved,
  // including records added before the recipient had a LiDire account.
  const email = normalizeEmail(user.email || "");
  if (email) {
    const pendingMembers = await env.DB.prepare(`
      SELECT m.id, m.group_id, m.user_id, m.name, m.email, m.permissions_json, g.owner_user_id,
             u.name AS owner_name
      FROM family_members m
      JOIN family_groups g ON g.id = m.group_id
      LEFT JOIN users u ON u.id = g.owner_user_id
      WHERE lower(m.email) = lower(?)
        AND g.owner_user_id <> ?
        AND (m.user_id IS NULL OR m.user_id = ?)
        AND m.status IN ('pending', 'pending_acceptance', 'invited')
      LIMIT 50
    `).bind(email, user.id, user.id).all();

    for (const member of (pendingMembers.results || [])) {
      await env.DB.prepare(`UPDATE family_members SET user_id = ?, status = 'pending_acceptance', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(user.id, member.id).run();
      const existingInvite = await env.DB.prepare(`
        SELECT id FROM family_invites
        WHERE family_member_id = ? AND recipient_user_id = ? AND status = 'pending' LIMIT 1
      `).bind(member.id, user.id).first();
      if (!existingInvite) {
        const inviteId = crypto.randomUUID();
        const inviteeName = String(member.name || user.name || user.email || 'Familiar').trim() || 'Familiar';
        await env.DB.prepare(`
          INSERT INTO family_invites (id, family_member_id, group_id, owner_user_id, recipient_user_id, invitee_email, invitee_name, status, token, permissions_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
        `).bind(inviteId, member.id, member.group_id, member.owner_user_id, user.id, email, inviteeName, inviteId, JSON.stringify(safeJson(member.permissions_json, {}))).run();
        await env.DB.prepare(`
          INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, title, message)
          VALUES (?, ?, ?, ?, 'family_invitation', 'open_family', ?, ?)
        `).bind(
          crypto.randomUUID(), member.owner_user_id, user.id, member.id, "Convite familiar pendente",
          `${member.owner_name || "Uma pessoa"} convidou você para compartilhar a família na LiDire. Abra a área Família para aceitar ou recusar o convite.`
        ).run();
      }
    }
  }

  const rows = await env.DB.prepare(`
    SELECT i.id, i.family_member_id, i.group_id, i.owner_user_id, i.status, i.created_at,
           m.name AS member_name, m.email AS member_email, m.relation,
           u.name AS inviter_name, u.email AS inviter_email
    FROM family_invites i
    JOIN family_members m ON m.id = i.family_member_id
    LEFT JOIN users u ON u.id = i.owner_user_id
    WHERE i.recipient_user_id = ? AND i.status = 'pending'
    ORDER BY i.created_at DESC LIMIT 20
  `).bind(user.id).all();
  return Response.json({ ok: true, invitations: rows.results || [] });
}

async function respondFamilyInvitation(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });

  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const body = await readJson(request);
  const decision = String(body.decision || "").toLowerCase();
  if (!["accept", "reject"].includes(decision)) return Response.json({ error: "invalid_decision", message: "Escolha aceitar ou recusar." }, { status: 400 });
  const invite = await env.DB.prepare(`SELECT * FROM family_invites WHERE id = ? AND recipient_user_id = ? AND status = 'pending' LIMIT 1`).bind(id, user.id).first();
  if (!invite) return Response.json({ error: "invite_not_found", message: "Este convite não está mais pendente." }, { status: 404 });
  if (decision === "reject") {
    await env.DB.prepare(`UPDATE family_invites SET status = 'rejected', responded_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
    await env.DB.prepare(`UPDATE family_members SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND group_id = ?`).bind(invite.family_member_id, invite.group_id).run();
    await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, title, message) VALUES (?, ?, ?, ?, 'family_invitation', 'open_family', ?, ?)`).bind(crypto.randomUUID(), user.id, invite.owner_user_id, invite.family_member_id, "Convite familiar recusado", `${user.name || "O familiar"} recusou o convite da LiDire.`).run();
    await purgeUnauthorizedSharedCopiesSafe(env.DB, invite.owner_user_id);
    return Response.json({ ok: true, status: "rejected" });
  }
  const owner = await env.DB.prepare(`SELECT id, name, email FROM users WHERE id = ? LIMIT 1`).bind(invite.owner_user_id).first();
  const sourceMember = await env.DB.prepare(`SELECT * FROM family_members WHERE id = ? AND group_id = ? LIMIT 1`).bind(invite.family_member_id, invite.group_id).first();
  if (!sourceMember || !owner) return Response.json({ error: "invite_invalid", message: "Os dados deste convite não estão disponíveis." }, { status: 409 });
  await env.DB.prepare(`UPDATE family_invites SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(id).run();
  await env.DB.prepare(`UPDATE family_members SET status = 'active', user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(user.id, sourceMember.id).run();
  const recipientGroup = await ensureUserFamilyGroup(env.DB, user.id);
  const reverse = await env.DB.prepare(`SELECT id FROM family_members WHERE group_id = ? AND lower(email) = lower(?) LIMIT 1`).bind(recipientGroup.id, normalizeEmail(owner.email || "")).first();
  if (!reverse && owner.email) {
    await env.DB.prepare(`INSERT INTO family_members (id, group_id, user_id, name, relation, email, address, role, status, permissions_json, updated_at) VALUES (?, ?, ?, ?, 'Familiar', ?, '', 'member', 'active', '{}', CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), recipientGroup.id, owner.id, owner.name || owner.email, normalizeEmail(owner.email)).run();
  } else if (reverse) {
    await env.DB.prepare(`UPDATE family_members SET user_id = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(owner.id, reverse.id).run();
  }
  await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, title, message) VALUES (?, ?, ?, ?, 'family_invitation', 'open_family', ?, ?)`).bind(crypto.randomUUID(), user.id, invite.owner_user_id, invite.family_member_id, "Convite familiar aceito", `${user.name || "O familiar"} aceitou o convite da LiDire.`).run();
  return Response.json({ ok: true, status: "accepted" });
}

async function updateFamilyMember(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const group = await ensureUserFamilyGroup(env.DB, user.id);
  const existing = await env.DB.prepare(`SELECT * FROM family_members WHERE id = ? AND group_id = ? LIMIT 1`).bind(id, group.id).first();
  if (!existing) return Response.json({ error: "not_found", message: "Membro não encontrado." }, { status: 404 });
  const body = await readJson(request);
  const name = String(body.name ?? existing.name ?? "").trim();
  const relation = String(body.relation ?? existing.relation ?? "Membro").trim();
  const email = normalizeEmail(body.email ?? existing.email ?? "");
  const address = String(body.address ?? existing.address ?? "").trim();
  const emailChanged = email !== normalizeEmail(existing.email || "");
  // Trocar o e-mail troca a pessoa: o vínculo anterior e as permissões concedidas não se transferem.
  const permissions = buildFamilyPermissionsForSave(body, emailChanged ? null : safeJson(existing.permissions_json, {}));
  if (name.length < 2 || !isValidEmail(email)) return Response.json({ error: "invalid_member", message: "Informe nome e e-mail válidos." }, { status: 400 });
  const found = await env.DB.prepare(`SELECT id, name FROM users WHERE lower(email) = lower(?) LIMIT 1`).bind(email).first();
  const account = found && found.id !== user.id ? found : null;
  let userId, status, inviteId = null;
  if (emailChanged) {
    userId = account?.id || null;
    status = account ? "pending_acceptance" : "pending";
    await env.DB.prepare(`UPDATE family_invites SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP WHERE family_member_id = ? AND status = 'pending'`).bind(id).run();
  } else {
    // Editar dados/permissões nunca aceita convite por ninguém: mantém o estado atual (inclusive "rejected").
    userId = existing.user_id || null;
    status = String(existing.status || "pending").toLowerCase();
    if (account && !userId && ["pending", "invited"].includes(status)) { userId = account.id; status = "pending_acceptance"; }
  }
  await env.DB.prepare(`UPDATE family_members SET user_id = ?, name = ?, relation = ?, email = ?, address = ?, status = ?, permissions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND group_id = ?`).bind(userId, name, relation, email, address, status, JSON.stringify(permissions), id, group.id).run();
  await purgeUnauthorizedSharedCopiesSafe(env.DB, user.id);
  if (account && status === "pending_acceptance") {
    inviteId = await createPendingFamilyInvite(env, { owner: user, member: { id, group_id: group.id }, account, email, name, permissions });
  }
  return Response.json({ ok: true, invitationCreated: !!inviteId, member: { id, user_id: userId, name, relation, email, address, status, permissions: effectiveFamilyPermissions(permissions), inviteId } });
}

async function deleteFamilyMember(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const group = await ensureUserFamilyGroup(env.DB, user.id);
  await env.DB.prepare(`UPDATE family_invites SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP WHERE family_member_id = ? AND status = 'pending'`).bind(id).run();
  await env.DB.prepare(`DELETE FROM family_members WHERE id = ? AND group_id = ?`).bind(id, group.id).run();
  await purgeUnauthorizedSharedCopiesSafe(env.DB, user.id);
  return Response.json({ ok: true });
}

function normalizeSharedTaskRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = String(value.id || "").trim().slice(0, 120);
  const title = String(value.title || "").trim().slice(0, 300);
  if (!id || !title) return null;
  const rawDate = String(value.date || "");
  const rawTime = String(value.time || "");
  return {
    id,
    title,
    priority: String(value.priority || "Normal").trim().slice(0, 24),
    date: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "",
    time: /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : "",
    done: value.done === true
  };
}

async function listActiveTaskShareRecipients(db, ownerId) {
  const group = await db.prepare(`SELECT id FROM family_groups WHERE owner_user_id = ? ORDER BY created_at LIMIT 1`).bind(ownerId).first();
  if (!group) return [];
  const rows = await db.prepare(`SELECT id, user_id, name, status, permissions_json
    FROM family_members WHERE group_id = ? AND user_id IS NOT NULL`).bind(group.id).all();
  return (rows.results || []).filter(member =>
    ["active", "accepted"].includes(String(member.status || "").toLowerCase()) &&
    safeJson(member.permissions_json, {}).shareConsentVersion === 1 && safeJson(member.permissions_json, {}).shareTasksData === true
  );
}

async function listSharedFamilyTasks(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureFamilySharedTasksTable(env.DB);

  const links = await env.DB.prepare(`SELECT DISTINCT
      contact.user_id AS owner_user_id,
      contact.name AS shared_by,
      contact.status AS contact_status,
      owner_grant.status AS grant_status,
      owner_grant.permissions_json
    FROM family_groups recipient_group
    JOIN family_members contact ON contact.group_id = recipient_group.id
    JOIN family_groups owner_group ON owner_group.owner_user_id = contact.user_id
    JOIN family_members owner_grant ON owner_grant.group_id = owner_group.id AND owner_grant.user_id = ?
    WHERE recipient_group.owner_user_id = ? AND contact.user_id IS NOT NULL AND contact.user_id <> ?`)
    .bind(user.id, user.id, user.id).all();
  const authorizedOwners = new Map();
  for (const link of (links.results || [])) {
    const ownerId = String(link.owner_user_id || "");
    if (!ownerId || !["active", "accepted"].includes(String(link.contact_status || "").toLowerCase()) ||
        !["active", "accepted"].includes(String(link.grant_status || "").toLowerCase()) ||
        !(safeJson(link.permissions_json, {}).shareConsentVersion === 1 && safeJson(link.permissions_json, {}).shareTasksData === true)) continue;
    authorizedOwners.set(ownerId, String(link.shared_by || "Contato"));
  }
  const ownerIds = [...authorizedOwners.keys()];
  if (!ownerIds.length) return Response.json({ ok: true, tasks: [] });
  const placeholders = ownerIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT owner_user_id, task_json, updated_at
      FROM family_shared_tasks WHERE owner_user_id IN (${placeholders}) ORDER BY updated_at DESC`).bind(...ownerIds).all();
  const tasks = [];
  for (const row of (rows.results || [])) {
    const task = normalizeSharedTaskRecord(safeJson(row.task_json, null));
    if (task) tasks.push({
      ...task,
      sharedBy: authorizedOwners.get(String(row.owner_user_id)) || "Contato",
      sharedAt: String(row.updated_at || "")
    });
  }
  return Response.json({ ok: true, tasks });
}

async function syncSharedFamilyTasks(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureFamilySharedTasksTable(env.DB);
  const body = await readJson(request);
  const upserts = Array.isArray(body.upserts) ? body.upserts : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];
  if (upserts.length > 50 || deletedIds.length > 50) {
    return Response.json({ error: "batch_too_large", message: "Envie no máximo 50 tarefas por lote." }, { status: 413 });
  }

  const recipients = await listActiveTaskShareRecipients(env.DB, user.id);
  if (!recipients.length) {
    const result = await env.DB.prepare(`DELETE FROM family_shared_tasks WHERE owner_user_id = ?`).bind(user.id).run();
    return Response.json({ ok: true, shared: false, cleared: Number(result.meta?.changes || 0) });
  }

  const statements = [];
  for (const raw of upserts) {
    const task = normalizeSharedTaskRecord(raw);
    if (!task) continue;
    statements.push(env.DB.prepare(`INSERT INTO family_shared_tasks (owner_user_id, task_id, task_json, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(owner_user_id, task_id) DO UPDATE SET task_json = excluded.task_json, updated_at = CURRENT_TIMESTAMP`)
      .bind(user.id, task.id, JSON.stringify(task)));
  }
  for (const rawId of deletedIds) {
    const id = String(rawId || "").trim().slice(0, 120);
    if (id) statements.push(env.DB.prepare(`DELETE FROM family_shared_tasks WHERE owner_user_id = ? AND task_id = ?`).bind(user.id, id));
  }
  if (statements.length) await env.DB.batch(statements);
  return Response.json({ ok: true, shared: true, upserted: upserts.length, deleted: deletedIds.length });
}


const SHARED_RESOURCE_MODULES = {
  agenda: { permission: "agenda", label: "Agenda" },
  compras: { permission: "compras", label: "Compras" },
  estudos: { permission: "estudos", label: "Estudos" },
  treinos: { permission: "treinos", label: "Treinos" },
  hidratacao: { permission: "hidratacao", label: "Hidratação" },
  alimentacao: { permission: "alimentacao", label: "Alimentação" },
  financas: { permission: "financas", label: "Finanças" },
  objetivos: { permission: "objetivos", label: "Objetivos" },
  lembretes: { permission: "lembretes", label: "Lembretes" }
};
let familySharedResourcesTableReady = false;
let familySharedResourcesSetupPromise = null;
async function ensureFamilySharedResourcesTable(db) {
  if (familySharedResourcesTableReady) return;
  if (familySharedResourcesSetupPromise) return familySharedResourcesSetupPromise;
  familySharedResourcesSetupPromise = (async () => {
    await db.prepare(`CREATE TABLE IF NOT EXISTS family_shared_resources (
      owner_user_id TEXT NOT NULL,
      module_key TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      resource_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(owner_user_id, module_key, resource_id)
    )`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_family_shared_resources_lookup
      ON family_shared_resources(module_key, owner_user_id, updated_at)`).run();
    familySharedResourcesTableReady = true;
  })();
  try { await familySharedResourcesSetupPromise; }
  finally { familySharedResourcesSetupPromise = null; }
}
function normalizeSharedResource(value, moduleKey) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = String(value.id || "").trim().slice(0, 120);
  if (!id) return null;
  // Never copy credentials, tokens, account identifiers or internal permission objects.
  const forbidden = /password|token|secret|session|credential|auth|user_id|owner_user_id|permissions|api.?key/i;
  const clean = {};
  for (const [key, raw] of Object.entries(value)) {
    const normalizedKey = String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (forbidden.test(normalizedKey) || key.startsWith("_")) continue;
    if (raw === undefined || typeof raw === "function") continue;
    let encoded;
    try { encoded = JSON.stringify(raw); } catch (_) { continue; }
    if (encoded.length > 12000) continue;
    clean[key] = raw;
  }
  clean.id = id;
  clean.title = String(value.title || value.name || value.subject || value.description || value.activity || value.type || SHARED_RESOURCE_MODULES[moduleKey].label).slice(0, 300);
  return clean;
}
async function listActiveResourceShareRecipients(db, ownerId, moduleKey) {
  const group = await db.prepare(`SELECT id FROM family_groups WHERE owner_user_id = ? ORDER BY created_at LIMIT 1`).bind(ownerId).first();
  if (!group) return [];
  const rows = await db.prepare(`SELECT id, user_id, status, permissions_json FROM family_members WHERE group_id = ? AND user_id IS NOT NULL`).bind(group.id).all();
  const permission = SHARED_RESOURCE_MODULES[moduleKey].permission;
  return (rows.results || []).filter(member =>
    ["active", "accepted"].includes(String(member.status || "").toLowerCase()) &&
    safeJson(member.permissions_json, {}).shareConsentVersion === 1 && safeJson(member.permissions_json, {})[permission] === true
  );
}
async function listSharedFamilyResources(request, env, moduleKey) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({error:"unauthorized",message:"Entre na sua conta."},{status:401});
  const meta = SHARED_RESOURCE_MODULES[moduleKey];
  if (!meta) return Response.json({error:"invalid_module"},{status:400});
  await ensureFamilySharedResourcesTable(env.DB);
  const links = await env.DB.prepare(`SELECT DISTINCT contact.user_id AS owner_user_id, contact.name AS shared_by,
      contact.status AS contact_status, owner_grant.status AS grant_status, owner_grant.permissions_json
    FROM family_groups recipient_group
    JOIN family_members contact ON contact.group_id = recipient_group.id
    JOIN family_groups owner_group ON owner_group.owner_user_id = contact.user_id
    JOIN family_members owner_grant ON owner_grant.group_id = owner_group.id AND owner_grant.user_id = ?
    WHERE recipient_group.owner_user_id = ? AND contact.user_id IS NOT NULL AND contact.user_id <> ?`)
    .bind(user.id,user.id,user.id).all();
  const owners = new Map();
  for (const link of links.results || []) {
    const ownerId = String(link.owner_user_id || "");
    if (!ownerId || !["active","accepted"].includes(String(link.contact_status||"").toLowerCase()) ||
        !["active","accepted"].includes(String(link.grant_status||"").toLowerCase()) ||
        !(safeJson(link.permissions_json, {}).shareConsentVersion === 1 && safeJson(link.permissions_json, {})[meta.permission] === true)) continue;
    owners.set(ownerId,String(link.shared_by||"Familiar"));
  }
  const ids=[...owners.keys()];
  if (!ids.length) return Response.json({ok:true,resources:[]});
  const placeholders=ids.map(()=>"?").join(",");
  const result=await env.DB.prepare(`SELECT owner_user_id,resource_json,updated_at
      FROM family_shared_resources WHERE module_key = ? AND owner_user_id IN (${placeholders}) ORDER BY updated_at DESC`).bind(moduleKey,...ids).all();
  const resources=[];
  for(const row of result.results||[]) {
    const item=normalizeSharedResource(safeJson(row.resource_json,null),moduleKey);
    if(item) resources.push({...item,sharedBy:owners.get(String(row.owner_user_id))||"Familiar",sharedAt:String(row.updated_at||"")});
  }
  return Response.json({ok:true,resources});
}
async function syncSharedFamilyResources(request, env, moduleKey) {
  const user=await requireUser(request,env);
  if(!user) return Response.json({error:"unauthorized",message:"Entre na sua conta."},{status:401});
  const meta=SHARED_RESOURCE_MODULES[moduleKey];
  if(!meta) return Response.json({error:"invalid_module"},{status:400});
  await ensureFamilySharedResourcesTable(env.DB);
  const body=await readJson(request);
  const upserts=Array.isArray(body.upserts)?body.upserts:[];
  const deletedIds=Array.isArray(body.deletedIds)?body.deletedIds:[];
  if(upserts.length>50||deletedIds.length>50) return Response.json({error:"batch_too_large"},{status:413});
  const recipients=await listActiveResourceShareRecipients(env.DB,user.id,moduleKey);
  if(!recipients.length) {
    const result=await env.DB.prepare(`DELETE FROM family_shared_resources WHERE owner_user_id=? AND module_key=?`).bind(user.id,moduleKey).run();
    return Response.json({ok:true,shared:false,cleared:Number(result.meta?.changes||0)});
  }
  const statements=[];
  for(const raw of upserts) {
    let item;
    try { item=normalizeSharedResource(raw,moduleKey); }
    catch (error) { return Response.json({error:"field_too_large",message:error.message},{status:400}); }
    if(!item) continue;
    statements.push(env.DB.prepare(`INSERT INTO family_shared_resources(owner_user_id,module_key,resource_id,resource_json,updated_at)
      VALUES(?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(owner_user_id,module_key,resource_id) DO UPDATE SET resource_json=excluded.resource_json,updated_at=CURRENT_TIMESTAMP`)
      .bind(user.id,moduleKey,item.id,JSON.stringify(item)));
  }
  for(const rawId of deletedIds) {
    const id=String(rawId||"").trim().slice(0,120);
    if(id) statements.push(env.DB.prepare(`DELETE FROM family_shared_resources WHERE owner_user_id=? AND module_key=? AND resource_id=?`).bind(user.id,moduleKey,id));
  }
  if(statements.length) await env.DB.batch(statements);
  return Response.json({ok:true,shared:true,upserted:upserts.length,deleted:deletedIds.length});
}

async function sendFamilyNotification(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });

  const body = await readJson(request);
  const group = await ensureUserFamilyGroup(env.DB, user.id);
  let member = null;
  if (body.memberId) member = await env.DB.prepare(`SELECT * FROM family_members WHERE id = ? AND group_id = ? LIMIT 1`).bind(String(body.memberId), group.id).first();
  if (!member && body.recipientEmail) member = await env.DB.prepare(`SELECT * FROM family_members WHERE group_id = ? AND lower(email) = lower(?) LIMIT 1`).bind(group.id, normalizeEmail(body.recipientEmail)).first();
  if (!member) return Response.json({ error: "member_not_found", message: "Não encontrei esse membro da família." }, { status: 404 });
  // Só entrega a quem aceitou o convite; esta rota não ativa nem vincula ninguém.
  if (!["active", "accepted"].includes(String(member.status || "").toLowerCase())) {
    return Response.json({ error: "invite_not_accepted", message: "Esse familiar ainda não aceitou o convite." }, { status: 409 });
  }
  const recipientId = member.user_id || null;
  if (!recipientId) return Response.json({ error: "recipient_not_registered", message: "Esse familiar ainda não criou uma conta LiDire com esse e-mail." }, { status: 409 });
  const title = String(body.title || "LiDire — Família").trim().slice(0, 120);
  const message = String(body.message || "Você recebeu uma atualização da sua família na LiDire.").trim().slice(0, 1000);
  const resourceType = ["commitment", "commitment_change", "family_message", "family_invitation", "shared_resource_update"].includes(String(body.resourceType || "")) ? String(body.resourceType) : "family_message";
  const action = resourceType === "commitment" || resourceType === "commitment_change" ? "review_commitment" : resourceType === "shared_resource_update" ? "open_shared_resource" : "open_family";
  const resourceId = body.resourceId ? String(body.resourceId).slice(0, 120) : null;
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, resource_id, title, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, user.id, recipientId, member.id, resourceType, action, resourceId, title, message).run();
  return Response.json({ ok: true, notification: { id, recipientId, title, message, resourceType, resourceId } });
}

async function listNotifications(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
  const trash = url.searchParams.get("trash") === "1";
  const deletedClause = trash ? "n.deleted_at IS NOT NULL" : "n.deleted_at IS NULL AND n.acknowledged_at IS NULL";
  const rows = await env.DB.prepare(`SELECT n.id, n.sender_user_id, COALESCE(NULLIF(TRIM(u.name), ''), 'Membro da família') AS sender_name, n.title, n.message, n.read_at, n.created_at, n.resource_type, n.action, n.resource_id, n.response_to_id, n.response_status, n.deleted_at FROM family_notifications n LEFT JOIN users u ON u.id = n.sender_user_id WHERE n.recipient_user_id = ? AND ${deletedClause} ORDER BY COALESCE(n.deleted_at, n.created_at) DESC LIMIT ${limit}`).bind(user.id).all();
  return Response.json({ ok: true, notifications: rows.results || [] }, { headers: { "Cache-Control": "no-store, private" } });
}

async function deleteFamilyNotification(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const parts = url.pathname.split("/").filter(Boolean);
  const id = decodeURIComponent(parts[parts.length - 1] || "");
  if (url.searchParams.get("permanent") === "1") {
    const result = await env.DB.prepare(`DELETE FROM family_notifications WHERE id = ? AND recipient_user_id = ? AND deleted_at IS NOT NULL`).bind(id, user.id).run();
    if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Item da lixeira não encontrado." }, { status: 404 });
    return Response.json({ ok: true, permanent: true });
  }
  const result = await env.DB.prepare(`UPDATE family_notifications SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_user_id = ? AND deleted_at IS NULL`).bind(id, user.id).run();
  if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Notificação não encontrada." }, { status: 404 });
  return Response.json({ ok: true, movedToTrash: true });
}

async function emptyFamilyNotificationTrash(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await env.DB.prepare(`DELETE FROM family_notifications WHERE recipient_user_id = ? AND deleted_at IS NOT NULL`).bind(user.id).run();
  return Response.json({ ok: true, emptied: true });
}

async function respondToFamilyNotification(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const parts = url.pathname.split("/").filter(Boolean);
  const id = decodeURIComponent(parts[parts.length - 2] || "");
  const original = await env.DB.prepare(`SELECT id, sender_user_id, recipient_user_id, family_member_id, title, resource_type, resource_id FROM family_notifications WHERE id = ? AND recipient_user_id = ? LIMIT 1`).bind(id, user.id).first();
  if (!original) return Response.json({ error: "not_found", message: "Notificação não encontrada." }, { status: 404 });
  const body = await readJson(request);
  const kind = String(body.kind || "reply");
  if (!["reply", "confirm", "suggest"].includes(kind)) return Response.json({ error: "invalid_kind", message: "Tipo de resposta inválido." }, { status: 400 });
  if ((kind === "confirm" || kind === "suggest") && !["commitment", "commitment_change"].includes(original.resource_type)) return Response.json({ error: "not_commitment", message: "Esta notificação não está vinculada a um compromisso compartilhado." }, { status: 400 });
  const message = String(body.message || (kind === "confirm" ? "Confirmo o compromisso/alteração." : "")).trim().slice(0, 1000);
  if (!message) return Response.json({ error: "message_required", message: "Escreva uma mensagem antes de enviar." }, { status: 400 });
  const title = kind === "confirm" ? "Compromisso confirmado" : kind === "suggest" ? "Sugestão sobre compromisso" : `Resposta: ${String(body.title || original.title || "Notificação").slice(0, 90)}`;
  const replyId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO family_notifications (id, sender_user_id, recipient_user_id, family_member_id, resource_type, action, resource_id, response_to_id, title, message) VALUES (?, ?, ?, ?, ?, 'open_family', ?, ?, ?, ?)`).bind(replyId, user.id, original.sender_user_id, original.family_member_id || null, original.resource_type || "family_message", original.resource_id || null, original.id, title, message).run();
  const status = kind === "confirm" ? "confirmed" : kind === "suggest" ? "suggested" : "replied";
  await env.DB.prepare(`UPDATE family_notifications SET response_status = ?, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_user_id = ?`).bind(status, original.id, user.id).run();
  return Response.json({ ok: true, responseId: replyId, status });
}

async function markNotificationRead(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  let body = {};
  try { body = await readJson(request); } catch (_) { body = {}; }
  if (body && body.acknowledge === true) {
    const result = await env.DB.prepare(`UPDATE family_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP), acknowledged_at = COALESCE(acknowledged_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_user_id = ? AND deleted_at IS NULL`).bind(id, user.id).run();
    if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Notificação não encontrada." }, { status: 404 });
    return Response.json({ ok: true, acknowledged: true });
  }
  const result = await env.DB.prepare(`UPDATE family_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_user_id = ? AND deleted_at IS NULL`).bind(id, user.id).run();
  if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Notificação não encontrada." }, { status: 404 });
  return Response.json({ ok: true, read: true });
}

async function ensureCyclePeriodsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS menstrual_cycles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT DEFAULT '',
      flow TEXT DEFAULT 'Moderado',
      duration INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const info = await db.prepare(`PRAGMA table_info(menstrual_cycles)`).all();
  const columns = new Set((info.results || []).map(row => String(row.name)));
  const additions = [
    ["end_date", "TEXT DEFAULT ''"],
    ["flow", "TEXT DEFAULT 'Moderado'"],
    ["duration", "INTEGER"],
    ["notes", "TEXT DEFAULT ''"],
    ["created_at", "TEXT DEFAULT CURRENT_TIMESTAMP"],
    ["updated_at", "TEXT DEFAULT CURRENT_TIMESTAMP"]
  ];
  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      await db.prepare(`ALTER TABLE menstrual_cycles ADD COLUMN ${name} ${definition}`).run();
    }
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_menstrual_cycles_user_start ON menstrual_cycles(user_id, start_date DESC)`).run();
}

function normalizeCyclePeriod(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    start: row.start_date || "",
    end: row.end_date || "",
    flow: row.flow || "Moderado",
    duration: row.duration ?? "",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  };
}

function cycleDuration(start, end) {
  if (!start || !end) return null;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  const value = Math.round((b - a) / 86400000) + 1;
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function listCyclePeriods(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureCyclePeriodsTable(env.DB);
  const rows = await env.DB.prepare(`SELECT id, user_id, start_date, end_date, flow, duration, notes, created_at, updated_at FROM menstrual_cycles WHERE user_id = ? ORDER BY start_date DESC, created_at DESC`).bind(user.id).all();
  return Response.json({ ok: true, periods: (rows.results || []).map(normalizeCyclePeriod) });
}

async function createCyclePeriod(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Sua sessão expirou. Entre novamente na LiDire." }, { status: 401 });
  try {
    await ensureCyclePeriodsTable(env.DB);
  } catch (error) {
    console.error("Erro ao preparar menstrual_cycles:", error);
    return Response.json({ error: "cycle_table_error", message: "Não foi possível preparar o armazenamento do ciclo no D1." }, { status: 500 });
  }
  const body = await readJson(request);
  const start = String(body.start || "").trim();
  const end = String(body.end || "").trim();
  const flow = String(body.flow || "Moderado").trim().slice(0, 30) || "Moderado";
  const notes = String(body.notes || "").trim().slice(0, 2000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return Response.json({ error: "invalid_start", message: "Informe uma data válida para o início da menstruação." }, { status: 400 });
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) return Response.json({ error: "invalid_end", message: "Informe uma data válida para o fim da menstruação." }, { status: 400 });
  if (end && end < start) return Response.json({ error: "invalid_range", message: "A data de fim não pode ser anterior ao início." }, { status: 400 });
  const id = crypto.randomUUID();
  const duration = cycleDuration(start, end);
  await env.DB.prepare(`INSERT INTO menstrual_cycles (id, user_id, start_date, end_date, flow, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, user.id, start, end, flow, duration, notes).run();
  const row = await env.DB.prepare(`SELECT id, user_id, start_date, end_date, flow, duration, notes, created_at, updated_at FROM menstrual_cycles WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
  return Response.json({ ok: true, period: normalizeCyclePeriod(row) });
}

async function updateCyclePeriod(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureCyclePeriodsTable(env.DB);
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const existing = await env.DB.prepare(`SELECT * FROM menstrual_cycles WHERE id = ? AND user_id = ? LIMIT 1`).bind(id, user.id).first();
  if (!existing) return Response.json({ error: "not_found", message: "Registro de ciclo não encontrado." }, { status: 404 });
  const body = await readJson(request);
  const start = String(body.start ?? existing.start_date ?? "").trim();
  const end = String(body.end ?? existing.end_date ?? "").trim();
  const flow = String(body.flow ?? existing.flow ?? "Moderado").trim().slice(0, 30) || "Moderado";
  const notes = String(body.notes ?? existing.notes ?? "").trim().slice(0, 2000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return Response.json({ error: "invalid_start", message: "Informe uma data válida para o início da menstruação." }, { status: 400 });
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) return Response.json({ error: "invalid_end", message: "Informe uma data válida para o fim da menstruação." }, { status: 400 });
  if (end && end < start) return Response.json({ error: "invalid_range", message: "A data de fim não pode ser anterior ao início." }, { status: 400 });
  await env.DB.prepare(`UPDATE menstrual_cycles SET start_date = ?, end_date = ?, flow = ?, duration = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(start, end, flow, cycleDuration(start, end), notes, id, user.id).run();
  const row = await env.DB.prepare(`SELECT id, user_id, start_date, end_date, flow, duration, notes, created_at, updated_at FROM menstrual_cycles WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
  return Response.json({ ok: true, period: normalizeCyclePeriod(row) });
}

async function deleteCyclePeriod(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureCyclePeriodsTable(env.DB);
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const result = await env.DB.prepare(`DELETE FROM menstrual_cycles WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
  if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Registro de ciclo não encontrado." }, { status: 404 });
  return Response.json({ ok: true });
}

async function ensureNotesTable(db) {
  // A tabela pode já existir em versões anteriores da LiDire com menos
  // colunas. Por isso fazemos uma migração incremental e idempotente aqui,
  // em vez de depender somente de CREATE TABLE IF NOT EXISTS.
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Geral',
      tags TEXT DEFAULT '',
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const info = await db.prepare(`PRAGMA table_info(notes)`).all();
  const columns = new Set((info.results || []).map(row => String(row.name)));
  const addColumn = async (name, definition) => {
    if (!columns.has(name)) {
      await db.prepare(`ALTER TABLE notes ADD COLUMN ${name} ${definition}`).run();
      columns.add(name);
    }
  };

  // Colunas opcionais introduzidas pelo bloco de notas funcional.
  await addColumn("category", "TEXT DEFAULT 'Geral'");
  await addColumn("tags", "TEXT DEFAULT ''");
  await addColumn("is_favorite", "INTEGER DEFAULT 0");
  await addColumn("created_at", "TEXT");
  await addColumn("updated_at", "TEXT");

  // Preenche registros antigos que receberam as colunas sem DEFAULT.
  await db.prepare(`UPDATE notes SET category = COALESCE(category, 'Geral') WHERE category IS NULL OR category = ''`).run();
  await db.prepare(`UPDATE notes SET tags = COALESCE(tags, '') WHERE tags IS NULL`).run();
  await db.prepare(`UPDATE notes SET is_favorite = COALESCE(is_favorite, 0) WHERE is_favorite IS NULL`).run();
  await db.prepare(`UPDATE notes SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE created_at IS NULL`).run();
  await db.prepare(`UPDATE notes SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_notes_user_category ON notes(user_id, category)`).run();
}

function normalizeNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || "",
    content: row.content || "",
    category: row.category || "Geral",
    tags: row.tags || "",
    is_favorite: !!row.is_favorite,
    created_at: row.created_at || "",
    updated_at: row.updated_at || row.created_at || ""
  };
}

async function listNotes(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureNotesTable(env.DB);
  const rows = await env.DB.prepare(`SELECT id, user_id, title, content, category, tags, is_favorite, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY is_favorite DESC, updated_at DESC`).bind(user.id).all();
  return Response.json({ ok: true, notes: (rows.results || []).map(normalizeNote) });
}

async function createNote(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureNotesTable(env.DB);
  const body = await readJson(request);
  const title = String(body.title || "").trim().slice(0, 120);
  const content = String(body.content || "").trim().slice(0, 12000);
  const category = String(body.category || "Geral").trim().slice(0, 60) || "Geral";
  const tags = String(body.tags || "").trim().slice(0, 300);
  const favorite = body.is_favorite === true || body.is_favorite === 1 || body.is_favorite === "true";
  if (!title || !content) return Response.json({ error: "invalid_note", message: "Informe título e conteúdo da anotação." }, { status: 400 });
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO notes (id, user_id, title, content, category, tags, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, user.id, title, content, category, tags, favorite ? 1 : 0).run();
  const row = await env.DB.prepare(`SELECT id, user_id, title, content, category, tags, is_favorite, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
  return Response.json({ ok: true, note: normalizeNote(row) });
}

async function updateNote(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureNotesTable(env.DB);
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const existing = await env.DB.prepare(`SELECT * FROM notes WHERE id = ? AND user_id = ? LIMIT 1`).bind(id, user.id).first();
  if (!existing) return Response.json({ error: "not_found", message: "Anotação não encontrada." }, { status: 404 });
  const body = await readJson(request);
  const title = String(body.title ?? existing.title ?? "").trim().slice(0, 120);
  const content = String(body.content ?? existing.content ?? "").trim().slice(0, 12000);
  const category = String(body.category ?? existing.category ?? "Geral").trim().slice(0, 60) || "Geral";
  const tags = String(body.tags ?? existing.tags ?? "").trim().slice(0, 300);
  const favorite = body.is_favorite === undefined ? !!existing.is_favorite : (body.is_favorite === true || body.is_favorite === 1 || body.is_favorite === "true");
  if (!title || !content) return Response.json({ error: "invalid_note", message: "Informe título e conteúdo da anotação." }, { status: 400 });
  await env.DB.prepare(`UPDATE notes SET title = ?, content = ?, category = ?, tags = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(title, content, category, tags, favorite ? 1 : 0, id, user.id).run();
  const row = await env.DB.prepare(`SELECT id, user_id, title, content, category, tags, is_favorite, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
  return Response.json({ ok: true, note: normalizeNote(row) });
}

async function deleteNote(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureNotesTable(env.DB);
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  const result = await env.DB.prepare(`DELETE FROM notes WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
  if (!result.meta?.changes) return Response.json({ error: "not_found", message: "Anotação não encontrada." }, { status: 404 });
  return Response.json({ ok: true });
}

async function autocompletePlaces(request, env, url) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const input = String(url.searchParams.get("input") || "").trim().slice(0, 200);
  if (input.length < 3) return Response.json({ suggestions: [] });
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Response.json({ error: "places_not_configured", message: "O preenchimento automático exige a API Places habilitada na chave GOOGLE_MAPS_API_KEY do Cloudflare." }, { status: 503 });
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat" },
    body: JSON.stringify({ input, languageCode: "pt-BR", regionCode: "BR", includedRegionCodes: ["br"] })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return Response.json({ error: "places_autocomplete_failed", message: "Não foi possível buscar sugestões de endereço agora." }, { status: 502 });
  const suggestions = (data.suggestions || []).map(item => item.placePrediction).filter(Boolean).map(p => ({ placeId: p.placeId || String(p.place || "").replace(/^places\//, ""), text: String(p.text?.text || "") })).filter(p => p.text);
  return Response.json({ suggestions });
}

async function calculateRoute(request, env) {
  const user = await requireUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  const body = await readJson(request);
  const origin = body.origin && typeof body.origin === "object" ? body.origin : { address: String(body.origin || "") };
  const destination = body.destination && typeof body.destination === "object" ? body.destination : { address: String(body.destination || "") };
  const travelMode = String(body.travelMode || "DRIVE").toUpperCase();
  const departureTime = String(body.departureTime || "").trim();
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Response.json({ error: "routes_not_configured", message: "A API de rotas ainda não foi configurada. Adicione GOOGLE_MAPS_API_KEY no Cloudflare." }, { status: 503 });
  const allowed = new Set(["DRIVE","WALK","BICYCLE","TWO_WHEELER","TRANSIT"]);
  if (!allowed.has(travelMode)) return Response.json({ error: "invalid_travel_mode", message: "Meio de transporte inválido." }, { status: 400 });
  const payload = { origin, destination, travelMode, routingPreference: (travelMode === "DRIVE" || travelMode === "TWO_WHEELER") ? (departureTime ? "TRAFFIC_AWARE_OPTIMAL" : "TRAFFIC_AWARE") : undefined, departureTime: departureTime || undefined, computeAlternativeRoutes: false, languageCode: "pt-BR", units: "METRIC" };
  if (!departureTime) delete payload.departureTime;
  if (!payload.routingPreference) delete payload.routingPreference;
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.routes?.length) return Response.json({ error: "route_failed", message: "Não foi possível calcular a rota agora.", details: data?.error?.message || "" }, { status: response.status || 502 });
  const route = data.routes[0];
  return Response.json({ ok: true, duration: route.duration || "", distanceMeters: route.distanceMeters || 0, polyline: route.polyline?.encodedPolyline || "", legs: route.legs || [] });
}

async function assistantAI(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) {
    return Response.json({ error: "unauthorized", message: "Entre na sua conta para usar a IA LiDire." }, { status: 401 });
  }

  // Provedor selecionável por configuração do Worker. Gemini continua sendo o padrão.
  const provider = String(env.AI_PROVIDER || "gemini").trim().toLowerCase();
  const isGemini = provider === "gemini";
  const apiKey = isGemini ? env.GEMINI_API_KEY : env.AI_API_KEY;
  if (!apiKey) {
    const secretName = isGemini ? "GEMINI_API_KEY" : "AI_API_KEY";
    return Response.json({
      error: "ai_not_configured",
      message: `A IA LiDire ainda não foi configurada. Adicione o segredo ${secretName} no Cloudflare.`
    }, { status: 503 });
  }
  if (!isGemini && !["openai", "groq", "openai-compatible"].includes(provider)) {
    return Response.json({ error: "ai_provider_not_supported", message: "Provedor de IA não reconhecido. Use gemini, openai, groq ou openai-compatible." }, { status: 503 });
  }

  const body = await readJson(request);
  const question = String(body.question || "").trim().slice(0, 4000);
  if (!question) {
    return Response.json({ error: "invalid_question", message: "Digite uma pergunta para a LiDire." }, { status: 400 });
  }

  const language = "pt-BR";
  const useWeb = body.useWeb === true || body.useWeb === "true" || body.useWeb === 1;
  const context = sanitizeAIContext(body.context, language).slice(0, 14000);
  const history = Array.isArray(body.history) ? body.history.slice(-6).map(item => ({
    role: item?.role === "model" ? "model" : "user",
    text: String(item?.text || "").slice(0, 1200)
  })).filter(item => item.text) : [];

  const model = isGemini
    ? String(env.GEMINI_MODEL || "gemini-3.5-flash-lite").replace(/^models\//, "")
    : String(env.AI_MODEL || (provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4.1-mini"));
  // Fallbacks entre modelos são mantidos apenas no Gemini. Os demais provedores
  // usam um modelo configurável para evitar tentativas inesperadas/custos adicionais.
  const modelCandidates = isGemini
    ? Array.from(new Set([model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])).slice(0, 3)
    : [model];
  const systemText = `Você é a IA LiDire, o copiloto pessoal de organização dentro do aplicativo LiDire. Responda em português do Brasil.

Sua função NÃO é apenas conversar: quando o usuário pedir para criar, incluir, alterar, registrar ou salvar algo que o próprio aplicativo consegue armazenar, você deve identificar a ação e devolvê-la no campo actions para que o aplicativo a execute. Nunca diga que não pode alterar os dados do aplicativo quando uma das ações abaixo for aplicável.

MÓDULO GESTAÇÃO E SEGURANÇA EM SAÚDE:
- Quando a conversa estiver relacionada à gestação, sintomas, dúvidas de saúde ou recomendações médicas, responda com cautela, sem diagnosticar nem afirmar que um sintoma é necessariamente normal. Oriente a usuária a procurar profissional habilitado quando apropriado.
- Em TODA resposta que trate de sintomas ou dúvidas de saúde relacionadas à gestação, inclua integralmente este aviso, sem alterar a redação: “IMPORTANTE: A LiDire te ajuda a registrar e organizar dados sobre sua gestação. As informações aqui compartilhadas não substituem o acompanhamento médico. Fique atenta aos sintomas. Para esclarecimentos de dúvidas e recomendações, procure um profissional habilitado.”
- Não recomende interromper ou alterar medicamentos ou tratamentos prescritos. Se forem relatados sinais potencialmente urgentes, recomende procurar atendimento médico urgente.
- Não afirme que registrou sintomas da gestação se a ação não tiver sido realmente executada pelo aplicativo.

CONTEXTO DA AGENDA E ROTAS:
- Consulte sempre context.agenda quando a pergunta mencionar compromissos, consultas, reuniões, eventos ou horários cadastrados. A agenda enviada pelo aplicativo contém título, data, horário, local e endereço quando disponíveis. Use esses dados nas respostas; não afirme que não consegue ver um compromisso se ele estiver no contexto.
- context.homeAddress é o endereço residencial cadastrado no perfil. Quando o usuário disser “casa”, “minha casa” ou “endereço de casa” ao pedir uma rota, use esse endereço como origem ou destino conforme a frase. Nunca revele o endereço sem relação com a solicitação de rota.
- Se o usuário pedir rota para um compromisso específico, encontre o compromisso correspondente em context.agenda e use o endereço dele como destino. Se houver mais de um compromisso possível ou faltar endereço, peça esclarecimento.

Ações permitidas:
- create_task: preparar uma tarefa. Campos úteis: title, date (YYYY-MM-DD), time (HH:MM), priority (baixa, normal ou alta). IMPORTANTE: tarefas devem pedir confirmação ao usuário antes de serem gravadas.
- create_reminder: preparar um lembrete. Campos úteis: title, date, time, message, repeat. IMPORTANTE: lembretes devem pedir confirmação ao usuário antes de serem gravados.
- create_appointment: registrar um compromisso SOMENTE em Agenda. Campos: title, date, time, location, address.
- create_study: registrar um estudo SOMENTE em Estudos. Campos: subject, topic, date, time, duration, notes, link. NUNCA transforme pedido de estudo em tarefa.
- create_shopping_list: criar uma lista SOMENTE em Compras. Campos: name, items (array de objetos ou strings com name, quantity).
- create_workout: registrar um treino SOMENTE em Treinos. Campos: name, workoutType, date, time, duration, distance, pace, observations.
- log_hydration: registrar água SOMENTE em Hidratação. Campos: amount (ml), date.
- create_meal: registrar uma refeição SOMENTE em Alimentação. Campos: name, time, date, foods (array com name, quantity, unit, calories).
- create_finance: registrar um lançamento SOMENTE em Finanças. Campos: financeType, title, value, category, date, currency.
- create_goal: criar um objetivo SOMENTE em Objetivos. Campos: title, deadline, progress, moneyGoal, moneyCurrency, financeCategory, observations.
- update_goal_savings: adicionar um valor arrecadado a um objetivo financeiro existente. Campos: title ou targetId, amount, currency. Use esta ação quando o usuário disser que arrecadou, guardou, recebeu ou quer incluir um valor no objetivo. NUNCA altere o objetivo diretamente sem confirmação explícita no aplicativo.
- delete_task: excluir uma tarefa existente por targetId ou title. SEMPRE pedir confirmação no aplicativo.
- delete_reminder: excluir um lembrete existente por targetId ou title. SEMPRE pedir confirmação no aplicativo.
- complete_task: marcar uma tarefa como concluída por targetId ou title. SEMPRE pedir confirmação no aplicativo.
- complete_reminder: marcar um lembrete como concluído por targetId ou title. SEMPRE pedir confirmação no aplicativo.
- upsert_place: cadastrar ou atualizar um lugar frequente com name, address, aliases e notes.
- upsert_food: cadastrar ou atualizar um alimento. Para calorias, use totalCalories + forQuantity + quantityUnit quando o usuário informar calorias para uma quantidade específica. O aplicativo converte isso para kcal por 100 g/ml ou por unidade. Também pode usar caloriesPer100 quando o valor já estiver normalizado.
- create_recipe: salvar uma receita. Campos úteis: name, ingredients, instructions, servings, calories.
- update_food: atualizar um alimento existente. Use os mesmos campos de calorias de upsert_food.
- log_cycle_start: registrar o início/fim da menstruação quando o usuário pedir.
- log_cycle_symptom: registrar humor, dor, cólicas, acne, energia e observações quando o usuário pedir.
- add_family_member: preparar o cadastro de um membro da família com name, relation, email e permissions.
- send_family_notification: enviar uma notificação interna a um membro da família. Use memberId quando disponível ou recipientEmail.
- weather_lookup: consultar temperatura e previsão para uma localização informada. Use location.
- route_lookup: calcular rota e tempo estimado. Use origin, destination e travelMode (DRIVE, WALK, BICYCLE, TWO_WHEELER ou TRANSIT). Se o usuário disser “daqui/de onde estou”, use origin="current_location". Se disser “casa/minha casa”, use o endereço context.homeAddress como origem ou destino conforme a frase. Se pedir rota para um compromisso cadastrado, use o endereço do compromisso em context.agenda. Se informar horário de chegada, use arrivalTime (HH:MM) e date (YYYY-MM-DD); o aplicativo calcula a hora estimada de saída. Lugares e familiares cadastrados podem ser referenciados pelo nome.

Exemplos importantes:
1) “Adicione 1300 calorias para os 395 gramas de leite condensado” => action upsert_food, name “leite condensado”, totalCalories 1300, forQuantity 395, quantityUnit “g”.
2) “Adicione 450 calorias para 200 ml de creme de leite” => action upsert_food, name “creme de leite”, totalCalories 450, forQuantity 200, quantityUnit “ml”.
3) “Inclua uma tarefa pintar o cabelo hoje às 15 horas” => action create_task.
4) “Me lembre de ligar para minha mãe às 16:30” => action create_reminder.
5) “Salve a receita do brigadeiro de prestígio” => action create_recipe se houver dados suficientes; se faltarem ingredientes ou preparo, faça uma pergunta objetiva e não crie uma receita incompleta.
6) “Cadastre minha menstruação começou hoje” => action log_cycle_start.
7) “Registre que estou com cólica moderada e humor baixo hoje” => action log_cycle_symptom.
8) “Cadastre minha mãe Edna, email edna@example.com” => action add_family_member.
9) “Avise minha mãe que o jantar mudou para 21h” => action send_family_notification quando houver membro correspondente.
10) “Como está o tempo em Nova Iguaçu?” => action weather_lookup.
11) “Quanto tempo levo daqui até a casa da minha mãe?” => action route_lookup com origin current_location e destination conforme endereço disponível; se faltar endereço, pergunte.
12) “Pra chegar à faculdade às 17h de carro, que horas preciso sair de onde estou?” => action route_lookup com origin current_location, destination “faculdade” ou o lugar correspondente, travelMode DRIVE, arrivalTime “17:00” e date conforme o contexto.

Regras:
- Use sempre o feminino para a nomenclatura da marca: escreva “uma LD” e “as LDs”, nunca “um LD”.
- Nunca invente dados do usuário.
- Se a data for “hoje”, use o campo today do contexto.
- Se a ação for clara, devolva-a em actions. O aplicativo decide se executa imediatamente ou pede confirmação.
- create_task e create_reminder NUNCA devem ser tratados como execução imediata: sempre exigem confirmação explícita do usuário no aplicativo.
- add_family_member só pode ser executado depois que o aplicativo consultar o D1 para verificar se o e-mail já pertence a um membro da família e se já existe uma conta LiDire. Nunca diga que o membro foi cadastrado antes do retorno positivo do servidor.
- log_cycle_start e log_cycle_symptom podem ser executados quando o pedido for explícito e completo.
- send_family_notification só pode ser usada quando houver um membro correspondente; se não houver, peça o nome/e-mail do destinatário.
- weather_lookup e route_lookup devem usar ferramentas/serviços externos do aplicativo, não invente temperatura, previsão, distância ou duração.
- Quando o usuário pedir "estudo", "estudar", "matéria", "prova", "revisão" ou planejamento de estudo, use create_study, nunca create_task.
- Quando o usuário pedir compra/lista de compras, use create_shopping_list, nunca create_task.
- Quando pedir treino, use create_workout; compromisso/consulta/evento vai para create_appointment; água vai para log_hydration; refeição vai para create_meal; gasto/receita vai para create_finance; meta/objetivo vai para create_goal.
- Quando o usuário disser algo como “inclua 200 arrecadados no meu objetivo de comprar notebook”, use update_goal_savings com amount=200 e o objetivo correspondente. Essa ação sempre exige confirmação explícita no aplicativo. Se houver mais de um objetivo possível, peça esclarecimento em vez de escolher arbitrariamente.
- Se useWeb estiver ativado, use a Pesquisa Google para informações atuais quando ela puder melhorar a resposta e considere as fontes retornadas.
- Se faltar um dado essencial, actions deve ser [] e message deve fazer uma única pergunta objetiva.
- Não alegue envio de WhatsApp, SMS ou e-mail. “Enviar notificação para família” significa uma notificação LiDire entre contas, quando o destinatário tiver uma conta identificada.
- Para atualizar calorias, preserve o alimento existente quando houver correspondência por nome; não crie duplicata desnecessária.
- Responda por meio do JSON solicitado, sem Markdown.

Contexto do usuário:
${context}`;
  const contents = [];
  for (const item of history) {
    contents.push({ role: item.role, parts: [{ text: item.text }] });
  }
  contents.push({ role: "user", parts: [{ text: question }] });

  const actionSchema = {
    type: "OBJECT",
    properties: {
      message: { type: "STRING", description: "Resposta curta em português do Brasil para mostrar ao usuário." },
      actions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", description: "Tipo da ação LiDire" },
            name: { type: "STRING" },
            title: { type: "STRING" },
            date: { type: "STRING" },
            time: { type: "STRING" },
            priority: { type: "STRING" },
            message: { type: "STRING" },
            repeat: { type: "STRING" },
            period: { type: "STRING" },
            topic: { type: "STRING" },
            duration: { type: "NUMBER" },
            notes: { type: "STRING" },
            link: { type: "STRING" },
            location: { type: "STRING" },
            items: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, quantity: { type: "STRING" }, unit: { type: "STRING" }, calories: { type: "NUMBER" } } } },
            foods: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, quantity: { type: "STRING" }, unit: { type: "STRING" }, calories: { type: "NUMBER" } } } },
            amount: { type: "NUMBER" },
            value: { type: "NUMBER" },
            category: { type: "STRING" },
            currency: { type: "STRING" },
            deadline: { type: "STRING" },
            progress: { type: "NUMBER" },
            moneyGoal: { type: "NUMBER" },
            moneyCurrency: { type: "STRING" },
            financeCategory: { type: "STRING" },
            goalTitle: { type: "STRING" },
            workoutType: { type: "STRING" },
            financeType: { type: "STRING" },
            caloriesPer100: { type: "NUMBER" },
            totalCalories: { type: "NUMBER" },
            forQuantity: { type: "NUMBER" },
            quantityUnit: { type: "STRING" },
            ingredients: { type: "ARRAY", items: { type: "STRING" } },
            instructions: { type: "STRING" },
            servings: { type: "NUMBER" },
            calories: { type: "NUMBER" },
            relation: { type: "STRING" },
            email: { type: "STRING" },
            memberId: { type: "STRING" },
            recipientEmail: { type: "STRING" },
            permissions: { type: "ARRAY", items: { type: "STRING" } },
            mood: { type: "STRING" },
            pain: { type: "STRING" },
            cramps: { type: "STRING" },
            acne: { type: "STRING" },
            physicalEnergy: { type: "STRING" },
            mentalEnergy: { type: "STRING" },
            flow: { type: "STRING" },
            origin: { type: "STRING" },
            destination: { type: "STRING" },
            travelMode: { type: "STRING" },
            arrivalTime: { type: "STRING" },
            targetId: { type: "STRING" },
            aliases: { type: "ARRAY", items: { type: "STRING" } },
            address: { type: "STRING" }
          },
          required: ["type"]
        }
      }
    },
    required: ["message", "actions"]
  };

  let response = null;
  let data = {};
  let usedModel = model;

  for (const candidate of modelCandidates) {
    usedModel = candidate;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      if (isGemini) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents,
            ...(useWeb ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: { temperature: 0.2, maxOutputTokens: 1100, responseMimeType: "application/json", responseSchema: actionSchema },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
          }),
          signal: controller.signal
        });
      } else {
        // API compatível com OpenAI: OpenAI, Groq e outros endpoints compatíveis.
        const baseUrl = String(env.AI_BASE_URL || (provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1")).replace(/\/+$/, "");
        const chatMessages = [{ role: "system", content: systemText }];
        for (const item of history) chatMessages.push({ role: item.role === "model" ? "assistant" : "user", content: item.text });
        chatMessages.push({ role: "user", content: question });
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: candidate,
            messages: chatMessages,
            temperature: 0.2,
            max_tokens: 1400,
            response_format: { type: "json_object" }
          }),
          signal: controller.signal
        });
      }
    } catch (error) {
      console.error("Gemini request failed:", error);
      response = new Response(JSON.stringify({ error: { message: error?.name === "AbortError" ? "timeout" : "network error" } }), { status: 504, headers: { "Content-Type": "application/json" } });
    } finally {
      clearTimeout(timeout);
    }

    data = await response.json().catch(() => ({}));
    const providerMessage = String(data?.error?.message || data?.message || "");
    const isQuota = response.status === 429 || /quota|rate.?limit|resource.?exhausted|too many requests|insufficient_quota/i.test(providerMessage);
    if (response.ok || !isQuota) break;

    console.warn("Gemini quota reached; trying fallback model:", candidate);
  }

  if (!response?.ok) {
    console.error("Gemini API error:", response?.status, data);
    const providerMessage = String(data?.error?.message || "");
    const status = Number(response?.status || 502);
    let message = "A LiDire IA não conseguiu responder agora. Tente novamente em instantes.";
    let code = "ai_provider_error";

    if (status === 429 || /quota|rate.?limit|resource.?exhausted|too many requests/i.test(providerMessage)) {
      code = "ai_quota_exceeded";
      message = `A LiDire IA atingiu um limite de uso do provedor ${provider}. Aguarde, verifique a cota ou configure um plano adequado no painel do provedor.`;
    } else if (status === 503 || /high demand|overloaded|unavailable/i.test(providerMessage)) {
      code = "ai_temporarily_unavailable";
      message = "A LiDire IA está temporariamente indisponível por alta demanda. Tente novamente em alguns minutos.";
    } else if (status === 401 || status === 403) {
      code = "ai_configuration_error";
      message = "A conexão da LiDire IA precisa ser verificada no servidor.";
    }

    return Response.json({ error: code, message }, { status: status === 429 ? 429 : 502 });
  }

  const rawText = (isGemini
    ? data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n")
    : data?.choices?.[0]?.message?.content)?.trim();
  if (!rawText) {
    return Response.json({ error: "empty_ai_response", message: "A IA não retornou uma resposta." }, { status: 502 });
  }

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (_) {
    console.error("Gemini returned invalid structured output:", rawText);
    return Response.json({ error: "invalid_ai_response", message: "A IA retornou uma resposta que não pôde ser processada. Tente novamente." }, { status: 502 });
  }

  const cleanText = cleanAIText(result?.message || "");
  const actions = Array.isArray(result?.actions) ? result.actions.slice(0, 8).map(action => sanitizeAIValue(action)).filter(Boolean) : [];
  const grounding = isGemini ? (data?.candidates?.[0]?.groundingMetadata || {}) : {};
  const sources = Array.isArray(grounding?.groundingChunks)
    ? grounding.groundingChunks
        .map(chunk => chunk?.web ? { title: String(chunk.web.title || "Fonte"), url: String(chunk.web.uri || "") } : null)
        .filter(x => x?.url)
        .slice(0, 8)
    : [];
  const searchQueries = Array.isArray(grounding?.webSearchQueries) ? grounding.webSearchQueries.map(String).slice(0, 8) : [];
  const webAvailable = isGemini;
  const webActuallyUsed = isGemini && useWeb && (sources.length > 0 || searchQueries.length > 0);
  return Response.json({ ok: true, text: cleanText, actions, provider, model: usedModel, web: webActuallyUsed, webAvailable, webNotice: useWeb && !webAvailable ? "A pesquisa na Internet ainda está disponível apenas no provedor Gemini nesta versão. Desative a opção ou configure uma ferramenta de pesquisa compatível." : "", sources, searchQueries });
}

function cleanAIText(value) {
  let text = String(value ?? "").replace(/\r\n?/g, "\n");
  text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\s*/g, "").replace(/```/g, "");
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "");
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, "$1");
  text = text.replace(/(?<!\w)_(.*?)_(?!\w)/g, "$1");
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function sanitizeAIContext(raw, language) {
  const source = raw && typeof raw === "object" ? raw : {};
  const clean = {
    language,
    user: { name: String(source.user?.name || "").slice(0, 80), age: Number(source.user?.age || 0) || "", sex: String(source.user?.sex || "").slice(0, 30), weight: Number(source.user?.weight || 0) || "" },
    homeAddress: String(source.homeAddress || "").trim().slice(0, 500),
    hydrationProfile: source.hydrationProfile && typeof source.hydrationProfile === "object" ? sanitizeAIValue(source.hydrationProfile) : {},
    today: String(source.today || "").slice(0, 20),
    agenda: sanitizeAIAgenda(source.agenda),
    tarefas: limitAIItems(source.tarefas, 60),
    compras: limitAIItems(source.compras, 30),
    estudos: limitAIItems(source.estudos, 40),
    treinos: limitAIItems(source.treinos, 40),
    hidratacao: limitAIItems(source.hidratacao, 30),
    alimentacao: limitAIItems(source.alimentacao, 30),
    financas: limitAIItems(source.financas, 40),
    objetivos: limitAIItems(source.objetivos, 30),
    familia: limitAIItems(source.familia, 20),
    lembretes: limitAIItems(source.lembretes, 30),
    alimentos: limitAIItems(source.alimentos, 80),
    dietas: limitAIItems(source.dietas, 30),
    receitas: limitAIItems(source.receitas, 30)
  };
  // The menstrual-cycle data is deliberately excluded unless the user explicitly
  // enabled its AI context in the LiDire settings.
  if (source.cycleAiContext === true) clean.ciclo = limitAIItems(source.ciclo, 30);
  return JSON.stringify(clean);
}

function limitAIItems(value, max) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map(item => sanitizeAIValue(item)).filter(Boolean);
}

function sanitizeAIAgenda(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).map(item => {
    if (!item || typeof item !== "object") return null;
    return {
      id: String(item.id || "").slice(0, 100),
      title: String(item.title || item.name || "Compromisso").slice(0, 200),
      date: String(item.date || "").slice(0, 20),
      time: String(item.time || "").slice(0, 20),
      location: String(item.location || "").slice(0, 200),
      address: String(item.address || "").slice(0, 500),
      notes: String(item.notes || "").slice(0, 300),
      status: String(item.status || "").slice(0, 50)
    };
  }).filter(Boolean);
}

function sanitizeAIValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return String(value).slice(0, 300);
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (["password", "passwordHash", "token", "session", "photo", "profile_photo", "address", "phone"].includes(key)) continue;
    if (typeof val === "string") out[key] = val.slice(0, 300);
    else if (typeof val === "number" || typeof val === "boolean") out[key] = val;
    else if (Array.isArray(val)) out[key] = val.slice(0, 20).map(sanitizeAIValue);
    else if (val && typeof val === "object") out[key] = sanitizeAIValue(val);
  }
  return out;
}

async function ensureAuthTables(db) {
  // Migration defensiva: versões anteriores do MVP tinham uma tabela users
  // sem password_hash/updated_at e algumas instalações ainda não tinham profiles.
  // Sem esta migração, /api/login pode falhar no D1 e a tela fica presa em “Aguarde…”.
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      age INTEGER,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const columns = await db.prepare(`PRAGMA table_info(users)`).all();
  const names = new Set((columns.results || []).map(c => c.name));
  if (!names.has("password_hash")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN password_hash TEXT`).run();
  }
  if (!names.has("updated_at")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN updated_at TEXT`).run();
  }
  // Contas antigas permanecem válidas; a exigência é ativada apenas para novos cadastros.
  if (!names.has("email_verified_at")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN email_verified_at TEXT`).run();
  }
  if (!names.has("email_verification_required")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN email_verification_required INTEGER NOT NULL DEFAULT 0`).run();
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      age INTEGER,
      phone TEXT,
      address TEXT,
      profile_photo TEXT,
      currency TEXT DEFAULT 'BRL',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  const profileColumns = await db.prepare("PRAGMA table_info(profiles)").all();
  if (!(profileColumns.results || []).some(column => column.name === "birth_date")) {
    await db.prepare("ALTER TABLE profiles ADD COLUMN birth_date TEXT").run();
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user
    ON user_sessions(user_id)
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS auth_provider_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_subject TEXT NOT NULL,
      email TEXT,
      name TEXT,
      picture_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_subject),
      UNIQUE(user_id, provider),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_auth_provider_user ON auth_provider_accounts(user_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_auth_provider_lookup ON auth_provider_accounts(provider, provider_subject)`).run();

  // Contador de tentativas de autenticação por IP, com janela curta.
  await db.prepare(`CREATE TABLE IF NOT EXISTS auth_rate_limits (
    rate_key TEXT PRIMARY KEY,
    window_started INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  )`).run();
}

async function listConnections(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Faça login para consultar suas conexões." }, { status: 401 });
  await ensureAuthTables(env.DB);
  const rows = await env.DB.prepare(`SELECT provider FROM auth_provider_accounts WHERE user_id = ?`).bind(user.id).all();
  const connected = new Set((rows.results || []).map(row => String(row.provider)));
  return Response.json({
    google: { configured: !!env.GOOGLE_CLIENT_ID, clientId: env.GOOGLE_CLIENT_ID || "", connected: connected.has("google") },
    gmail: { configured: false, connected: false },
    apple: { configured: !!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY), clientId: env.APPLE_CLIENT_ID || "", connected: connected.has("apple") }
  }, { headers: { "Cache-Control": "no-store, private" } });
}

async function ensureGmailTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gmail_connections (
    user_id TEXT PRIMARY KEY, email TEXT NOT NULL, encrypted_tokens TEXT NOT NULL,
    token_expiry INTEGER, scope TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS gmail_oauth_states (
    state TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();
}
async function ensureGmailFollowupTables(db) {
  await ensureGmailTables(db);
  await db.prepare(`CREATE TABLE IF NOT EXISTS gmail_important_senders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Pessoal', notify_new INTEGER NOT NULL DEFAULT 1, reminder_hours INTEGER NOT NULL DEFAULT 6, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,email), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS gmail_followups (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, message_id TEXT NOT NULL, thread_id TEXT, sender_email TEXT, subject TEXT, message_date INTEGER NOT NULL, reminder_hours INTEGER NOT NULL, due_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', last_checked_at INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,message_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_gmail_followups_due ON gmail_followups(status,due_at)`).run();
}
async function listGmailImportantSenders(request, env) {
  const user = await getSessionUser(request, env); if (!user) return Response.json({error:'unauthorized'},{status:401});
  await ensureGmailFollowupTables(env.DB);
  const rows = await env.DB.prepare(`SELECT id,email,category,notify_new,reminder_hours,created_at FROM gmail_important_senders WHERE user_id=? ORDER BY created_at DESC`).bind(user.id).all();
  return Response.json({senders:rows.results||[]},{headers:{'Cache-Control':'no-store, private'}});
}
async function saveGmailImportantSender(request, env) {
  const user = await getSessionUser(request, env); if (!user) return Response.json({error:'unauthorized'},{status:401});
  await ensureGmailFollowupTables(env.DB);
  const body = await request.json(); const email=String(body.email||'').trim().toLowerCase(); const category=String(body.category||'Pessoal'); const hours=Number(body.reminderHours||6); const notify=body.notifyNew===false?0:1;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:'invalid_email',message:'Informe um endereço de e-mail válido.'},{status:400});
  if (![3,6,12,24].includes(hours)) return Response.json({error:'invalid_hours',message:'Escolha 3, 6, 12 ou 24 horas.'},{status:400});
  if (!['Trabalho','Estudos','Pessoal','Financeiro'].includes(category)) return Response.json({error:'invalid_category'},{status:400});
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO gmail_important_senders (id,user_id,email,category,notify_new,reminder_hours) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,email) DO UPDATE SET category=excluded.category,notify_new=excluded.notify_new,reminder_hours=excluded.reminder_hours`).bind(id,user.id,email,category,notify,hours).run();
  return Response.json({ok:true,message:'Remetente importante salvo.'});
}
async function deleteGmailImportantSender(request, env, url) {
  const user=await getSessionUser(request,env); if(!user) return Response.json({error:'unauthorized'},{status:401});
  await ensureGmailFollowupTables(env.DB); const id=decodeURIComponent(url.pathname.split('/').pop()||'');
  await env.DB.prepare(`DELETE FROM gmail_important_senders WHERE id=? AND user_id=?`).bind(id,user.id).run();
  return Response.json({ok:true});
}
async function listGmailFollowups(request, env) {
  const user=await getSessionUser(request,env); if(!user) return Response.json({error:'unauthorized'},{status:401});
  await ensureGmailFollowupTables(env.DB);
  const rows=await env.DB.prepare(`SELECT id,sender_email,subject,message_date,reminder_hours,due_at,status FROM gmail_followups WHERE user_id=? AND status='pending' AND due_at<=? ORDER BY due_at ASC LIMIT 20`).bind(user.id,Date.now()).all();
  return Response.json({followups:rows.results||[]},{headers:{'Cache-Control':'no-store, private'}});
}
async function runGmailFollowupSweep(env) {
  if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_TOKEN_ENCRYPTION_KEY) return;
  await ensureGmailFollowupTables(env.DB);
  const senders=(await env.DB.prepare(`SELECT user_id,email,category,notify_new,reminder_hours FROM gmail_important_senders`).all()).results||[];
  const byUser=new Map(); for (const sender of senders) { if(!byUser.has(sender.user_id)) byUser.set(sender.user_id,[]); byUser.get(sender.user_id).push(sender); }
  for (const [userId, rules] of byUser) {
    try {
      const token=await getGmailAccessToken(env.DB,env,userId); if(!token) continue;
      const response=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=${encodeURIComponent('in:inbox newer_than:3d')}`,{headers:{Authorization:`Bearer ${token}`}});
      if(!response.ok) { console.error('Gmail sweep list failed',response.status); continue; }
      const listed=await response.json();
      for(const msg of (listed.messages||[])) {
        const exists=await env.DB.prepare(`SELECT id FROM gmail_followups WHERE user_id=? AND message_id=?`).bind(userId,msg.id).first(); if(exists) continue;
        const mr=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(msg.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,{headers:{Authorization:`Bearer ${token}`}}); if(!mr.ok) continue;
        const d=await mr.json(); const headers=d.payload?.headers||[]; const get=n=>(headers.find(h=>String(h.name).toLowerCase()===n.toLowerCase())||{}).value||'';
        const from=get('From'); const sender=(from.match(/<([^>]+)>/)||[,from])[1].trim().toLowerCase(); const rule=rules.find(r=>r.email===sender); if(!rule || (d.labelIds||[]).includes('SENT')) continue;
        const date=Date.parse(get('Date'))||Date.now();
        // Only track messages still lacking a later sent message in the same thread.
        const tr=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(d.threadId)}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,{headers:{Authorization:`Bearer ${token}`}}); if(!tr.ok) continue;
        const thread=await tr.json(); const messages=thread.messages||[]; const hasLaterReply=messages.some(x=>(x.labelIds||[]).includes('SENT') && Number(x.internalDate||0)>Number(d.internalDate||0)); if(hasLaterReply) continue;
        await env.DB.prepare(`INSERT OR IGNORE INTO gmail_followups (id,user_id,message_id,thread_id,sender_email,subject,message_date,reminder_hours,due_at,status) VALUES (?,?,?,?,?,?,?,?,?,'pending')`).bind(crypto.randomUUID(),userId,msg.id,d.threadId,sender,String(get('Subject')||'(sem assunto)').slice(0,250),date,Number(rule.reminder_hours),date+Number(rule.reminder_hours)*3600000).run();
      }
      // Resolve pending follow-ups when the thread now contains a sent message later than the tracked message.
      const pending=(await env.DB.prepare(`SELECT id,thread_id,message_date FROM gmail_followups WHERE user_id=? AND status='pending'`).bind(userId).all()).results||[];
      for(const f of pending) { if(!f.thread_id) continue; const tr=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(f.thread_id)}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,{headers:{Authorization:`Bearer ${token}`}}); if(!tr.ok) continue; const t=await tr.json(); if((t.messages||[]).some(x=>(x.labelIds||[]).includes('SENT') && Number(x.internalDate||0)>Number(f.message_date||0))) await env.DB.prepare(`UPDATE gmail_followups SET status='answered',last_checked_at=? WHERE id=?`).bind(Date.now(),f.id).run(); else await env.DB.prepare(`UPDATE gmail_followups SET last_checked_at=? WHERE id=?`).bind(Date.now(),f.id).run(); }
    } catch(e) { console.error('Gmail follow-up sweep failed for user',String(e?.message||e)); }
  }
}

async function gmailIsConnected(db, userId) {
  await ensureGmailTables(db);
  const row = await db.prepare(`SELECT user_id FROM gmail_connections WHERE user_id = ?`).bind(userId).first();
  return !!row;
}
function bytesToBase64(bytes) { let binary = ""; for (const b of bytes) binary += String.fromCharCode(b); return btoa(binary); }
function base64ToBytes(value) { const binary = atob(value); return Uint8Array.from(binary, c => c.charCodeAt(0)); }
async function gmailCryptoKey(env) {
  if (!env.GOOGLE_TOKEN_ENCRYPTION_KEY) throw new Error("gmail_encryption_key_missing");
  const raw = new TextEncoder().encode(String(env.GOOGLE_TOKEN_ENCRYPTION_KEY));
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, {name:"AES-GCM"}, false, ["encrypt","decrypt"]);
}
async function encryptGmailTokens(tokens, env) {
  const key = await gmailCryptoKey(env); const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(tokens));
  const encrypted = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, data);
  return bytesToBase64(iv) + "." + bytesToBase64(new Uint8Array(encrypted));
}
async function decryptGmailTokens(value, env) {
  const [ivPart, dataPart] = String(value || "").split("."); if (!ivPart || !dataPart) throw new Error("gmail_token_invalid");
  const key = await gmailCryptoKey(env); const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:base64ToBytes(ivPart)}, key, base64ToBytes(dataPart));
  return JSON.parse(new TextDecoder().decode(plain));
}
function gmailResultHtml(ok, message) {
  const payload = JSON.stringify({type:"lidire-gmail-connect", ok:!!ok, message:String(message||"")});
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LiDire — Gmail</title><body style="font-family:Arial,sans-serif;background:#080d24;color:white;display:grid;place-items:center;min-height:100vh;text-align:center"><main><h2>${ok?"Gmail conectado":"Não foi possível conectar o Gmail"}</h2><p>${escapeHtml(message)}</p><button onclick="window.close()">Voltar à LiDire</button></main><script>try{window.opener&&window.opener.postMessage(${payload},location.origin)}catch(e){}setTimeout(()=>window.close(),900)</script></body></html>`;
}
async function startGmailConnection(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return new Response("Faça login na LiDire antes de conectar o Gmail.", {status:401});
  if (!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_TOKEN_ENCRYPTION_KEY)) return new Response("Configuração Gmail incompleta no servidor.", {status:503});
  await ensureGmailTables(env.DB);
  const bytes = crypto.getRandomValues(new Uint8Array(32)); const state = bytesToBase64Url(bytes);
  await env.DB.prepare(`INSERT INTO gmail_oauth_states (state,user_id,expires_at) VALUES (?,?,?)`).bind(state,user.id,Date.now()+10*60*1000).run();
  const redirectUri = `${url.origin}/api/connections/gmail/callback`;
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email https://www.googleapis.com/auth/gmail.readonly");
  authorize.searchParams.set("access_type", "offline"); authorize.searchParams.set("prompt", "consent");
  authorize.searchParams.set("include_granted_scopes", "true"); authorize.searchParams.set("state", state);
  return Response.redirect(authorize.toString(), 302);
}
async function gmailConnectionCallback(request, env, url) {
  const origin = url.origin;
  try {
    await ensureGmailTables(env.DB);
    const state = url.searchParams.get("state") || ""; const code = url.searchParams.get("code") || "";
    if (!state || !code || url.searchParams.get("error")) throw new Error("O Google cancelou ou não concluiu a autorização.");
    const pending = await env.DB.prepare(`SELECT user_id,expires_at FROM gmail_oauth_states WHERE state = ?`).bind(state).first();
    await env.DB.prepare(`DELETE FROM gmail_oauth_states WHERE state = ?`).bind(state).run();
    if (!pending || Number(pending.expires_at) < Date.now()) throw new Error("A autorização expirou. Tente novamente.");
    const redirectUri = `${origin}/api/connections/gmail/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:"authorization_code"})});
    const tokens = await tokenResponse.json(); if (!tokenResponse.ok || !tokens.access_token) throw new Error("O Google não forneceu os tokens de acesso.");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {headers:{Authorization:`Bearer ${tokens.access_token}`}});
    const profile = await profileResponse.json(); if (!profileResponse.ok || !profile.email) throw new Error("Não foi possível confirmar o e-mail Google.");
    const existing = await env.DB.prepare(`SELECT encrypted_tokens FROM gmail_connections WHERE user_id = ?`).bind(pending.user_id).first();
    if (!tokens.refresh_token && existing) { const old = await decryptGmailTokens(existing.encrypted_tokens,env); tokens.refresh_token = old.refresh_token; }
    if (!tokens.refresh_token) throw new Error("O Google não retornou permissão de acesso duradouro. Revogue a conexão anterior na Conta Google e tente novamente.");
    const encrypted = await encryptGmailTokens(tokens,env);
    await env.DB.prepare(`INSERT INTO gmail_connections (user_id,email,encrypted_tokens,token_expiry,scope,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,encrypted_tokens=excluded.encrypted_tokens,token_expiry=excluded.token_expiry,scope=excluded.scope,updated_at=CURRENT_TIMESTAMP`).bind(pending.user_id,String(profile.email).slice(0,254),encrypted,Date.now()+Number(tokens.expires_in||3600)*1000,String(tokens.scope||"").slice(0,1000)).run();
    return new Response(gmailResultHtml(true,`Conta ${profile.email} conectada. Você já pode revisar e-mails na LiDire.`),{headers:{"Content-Type":"text/html;charset=UTF-8","Cache-Control":"no-store"}});
  } catch (error) {
    console.error("Gmail OAuth callback error:",error);
    return new Response(gmailResultHtml(false,String(error?.message||"Não foi possível conectar o Gmail.")),{status:400,headers:{"Content-Type":"text/html;charset=UTF-8","Cache-Control":"no-store"}});
  }
}
async function getGmailAccessToken(db, env, userId) {
  await ensureGmailTables(db); const row = await db.prepare(`SELECT encrypted_tokens FROM gmail_connections WHERE user_id = ?`).bind(userId).first();
  if (!row) return null; const tokens = await decryptGmailTokens(row.encrypted_tokens,env);
  if (tokens.access_token && Number(tokens.expiry_date||0)>Date.now()+60000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("gmail_reauthorization_required");
  const response = await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:tokens.refresh_token,grant_type:"refresh_token"})});
  const renewed = await response.json(); if (!response.ok || !renewed.access_token) throw new Error("gmail_token_refresh_failed");
  const updated={...tokens,...renewed,refresh_token:tokens.refresh_token,expiry_date:Date.now()+Number(renewed.expires_in||3600)*1000};
  await db.prepare(`UPDATE gmail_connections SET encrypted_tokens=?,token_expiry=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(await encryptGmailTokens(updated,env),updated.expiry_date,userId).run();
  return updated.access_token;
}
async function listGmailMessages(request, env, url) {
  const user=await getSessionUser(request,env); if(!user) return Response.json({error:"unauthorized",message:"Faça login na LiDire."},{status:401});
  try {
    const token=await getGmailAccessToken(env.DB,env,user.id); if(!token) return Response.json({error:"gmail_not_connected",message:"Conecte sua conta Gmail primeiro."},{status:404});
    const max=Math.min(25,Math.max(1,Number(url.searchParams.get("max")||15)));
    const listResponse=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=${encodeURIComponent("in:inbox newer_than:30d")}`,{headers:{Authorization:`Bearer ${token}`}});
    const listed=await listResponse.json(); if(!listResponse.ok) throw new Error("gmail_messages_unavailable");
    const messages=await Promise.all((listed.messages||[]).slice(0,max).map(async m=>{
      const r=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(m.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=Reply-To`,{headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok) return null; const d=await r.json(); const headers=d.payload?.headers||[]; const get=n=>(headers.find(h=>String(h.name).toLowerCase()===n.toLowerCase())||{}).value||"";
      const from=get("From"); const subject=get("Subject")||"(sem assunto)"; const snippet=String(d.snippet||"").slice(0,500); const labels=d.labelIds||[];
      const ownEmail=String(user.email||"").toLowerCase(); const senderEmail=(from.match(/<([^>]+)>/)||[,from])[1].toLowerCase();
      const replyNeeded=!labels.includes("SENT") && !labels.includes("SPAM") && !labels.includes("TRASH") && senderEmail!==ownEmail && !/no.?reply|noreply|do.?not.?reply/i.test(from) && !labels.includes("IMPORTANT") ? true : (!labels.includes("SENT") && senderEmail!==ownEmail && !/no.?reply|noreply|do.?not.?reply/i.test(from));
      return {id:d.id,threadId:d.threadId,from:from.slice(0,300),subject:subject.slice(0,300),date:get("Date").slice(0,100),snippet,unread:labels.includes("UNREAD"),replySuggested:replyNeeded};
    }));
    const row=await env.DB.prepare(`SELECT email FROM gmail_connections WHERE user_id=?`).bind(user.id).first();
    return Response.json({connected:true,email:row?.email||"",messages:messages.filter(Boolean)},{headers:{"Cache-Control":"no-store, private"}});
  } catch(error) { console.error("Gmail list error:",error); return Response.json({error:"gmail_read_failed",message:"Não foi possível consultar os e-mails. Tente reconectar a conta Google."},{status:502}); }
}
async function disconnectGmail(request,env) {
  const user=await getSessionUser(request,env); if(!user) return Response.json({error:"unauthorized"},{status:401});
  await ensureGmailTables(env.DB); await env.DB.prepare(`DELETE FROM gmail_connections WHERE user_id=?`).bind(user.id).run();
  return Response.json({ok:true,message:"Gmail desconectado da LiDire."});
}

function parseJwtPart(token, index) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    const bytes = base64UrlToBytes(parts[index]);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) { return null; }
}

async function fetchJwks(url) {
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`jwks_http_${response.status}`);
  return response.json();
}

async function verifyGoogleIdToken(idToken, env) {
  if (!env.GOOGLE_CLIENT_ID) throw new Error("google_not_configured");
  const header = parseJwtPart(idToken, 0);
  const payload = parseJwtPart(idToken, 1);
  const parts = String(idToken || "").split(".");
  if (!header || !payload || parts.length !== 3 || !header.kid || header.alg !== "RS256") throw new Error("invalid_google_token");
  const now = Math.floor(Date.now() / 1000);
  const issuerOk = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  const audienceOk = payload.aud === env.GOOGLE_CLIENT_ID;
  if (!issuerOk || !audienceOk || !payload.sub || Number(payload.exp || 0) <= now || payload.email_verified !== true) throw new Error("invalid_google_claims");
  const keys = await fetchJwks("https://www.googleapis.com/oauth2/v3/certs");
  const jwk = (keys.keys || []).find(key => key.kid === header.kid);
  if (!jwk) throw new Error("google_key_not_found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToBytes(parts[2]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signingInput);
  if (!valid) throw new Error("invalid_google_signature");
  return { subject: String(payload.sub), email: normalizeEmail(payload.email), name: String(payload.name || payload.given_name || ""), picture: String(payload.picture || "") };
}

async function linkProviderAccount(db, user, provider, identity) {
  await ensureAuthTables(db);
  const existingProvider = await db.prepare(`SELECT id, user_id FROM auth_provider_accounts WHERE provider = ? AND provider_subject = ? LIMIT 1`).bind(provider, identity.subject).first();
  if (existingProvider && String(existingProvider.user_id) !== String(user.id)) {
    return { ok: false, status: 409, error: "provider_already_linked", message: `Esta conta ${provider === "google" ? "do Google" : "da Apple"} já está vinculada a outra conta LiDire.` };
  }
  const existingForUser = await db.prepare(`SELECT id, provider_subject FROM auth_provider_accounts WHERE user_id = ? AND provider = ? LIMIT 1`).bind(user.id, provider).first();
  const now = new Date().toISOString();
  if (existingForUser) {
    await db.prepare(`UPDATE auth_provider_accounts SET provider_subject = ?, email = ?, name = ?, picture_url = ?, updated_at = ? WHERE id = ?`)
      .bind(identity.subject, identity.email || null, identity.name || null, identity.picture || null, now, existingForUser.id).run();
  } else {
    await db.prepare(`INSERT INTO auth_provider_accounts (id, user_id, provider, provider_subject, email, name, picture_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), user.id, provider, identity.subject, identity.email || null, identity.name || null, identity.picture || null, now, now).run();
  }
  return { ok: true };
}

async function connectGoogle(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Faça login na LiDire antes de conectar o Google." }, { status: 401 });
  try {
    const body = await readJson(request);
    const identity = await verifyGoogleIdToken(String(body.credential || ""), env);
    const result = await linkProviderAccount(env.DB, user, "google", identity);
    if (!result.ok) return Response.json({ error: result.error, message: result.message }, { status: result.status });
    return Response.json({ ok: true, provider: "google", message: "Google Account conectado à LiDire." });
  } catch (error) {
    console.error("LiDire Google connection error:", error);
    const message = String(error?.message || "").includes("not_configured") ? "A integração com o Google ainda não foi configurada no servidor." : "Não foi possível validar a Conta do Google.";
    return Response.json({ error: "google_connection_failed", message }, { status: 400 });
  }
}

function appleCallbackHtml(origin, ok, message) {
  const safeOrigin = JSON.stringify(origin);
  const payload = JSON.stringify({ type: "lidire-apple-connect", ok: !!ok, message: String(message || "") });
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LiDire — Apple ID</title></head><body style="font-family:Arial,sans-serif;background:#070c22;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>${ok ? "Apple ID conectado" : "Não foi possível conectar"}</h2><p>${escapeHtml(message || "")}</p></div><script>try{window.opener&&window.opener.postMessage(${payload},${safeOrigin});}catch(e){}setTimeout(()=>window.close(),300);</script></body></html>`;
}

async function startAppleConnection(request, env, url) {
  const user = await getSessionUser(request, env);
  if (!user) return new Response("Faça login na LiDire antes de conectar o Apple ID.", { status: 401, headers: { "Content-Type": "text/plain;charset=UTF-8" } });
  if (!(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY)) {
    return new Response("Integração com Apple ID não configurada.", { status: 503, headers: { "Content-Type": "text/plain;charset=UTF-8" } });
  }
  const stateBytes = new Uint8Array(32);
  crypto.getRandomValues(stateBytes);
  const state = bytesToBase64Url(stateBytes);
  const redirectUri = `${url.origin}/api/connections/apple/callback`;
  const authorize = new URL("https://appleid.apple.com/auth/authorize");
  authorize.searchParams.set("client_id", env.APPLE_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code id_token");
  authorize.searchParams.set("response_mode", "form_post");
  authorize.searchParams.set("scope", "name email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", state);
  return new Response(null, { status: 302, headers: { "Location": authorize.toString(), "Set-Cookie": `lidire_apple_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600` } });
}

function pemToArrayBuffer(pem) {
  const base64 = String(pem || "").replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, "").replace(/\\n/g, "").replace(/\s+/g, "");
  return base64UrlToBytes(base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""));
}

async function createAppleClientSecret(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: "ES256", kid: env.APPLE_KEY_ID, typ: "JWT" })));
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ iss: env.APPLE_TEAM_ID, iat: now, exp: now + 86400 * 180, aud: "https://appleid.apple.com", sub: env.APPLE_CLIENT_ID })));
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(env.APPLE_PRIVATE_KEY), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(`${header}.${payload}`));
  return `${header}.${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyAppleIdToken(idToken, env) {
  const header = parseJwtPart(idToken, 0);
  const payload = parseJwtPart(idToken, 1);
  const parts = String(idToken || "").split(".");
  if (!header || !payload || parts.length !== 3 || !header.kid || header.alg !== "ES256") throw new Error("invalid_apple_token");
  const now = Math.floor(Date.now() / 1000);
  const issuerOk = payload.iss === "https://appleid.apple.com";
  const audienceOk = payload.aud === env.APPLE_CLIENT_ID;
  if (!issuerOk || !audienceOk || !payload.sub || Number(payload.exp || 0) <= now) throw new Error("invalid_apple_claims");
  const keys = await fetchJwks("https://appleid.apple.com/auth/keys");
  const jwk = (keys.keys || []).find(key => key.kid === header.kid);
  if (!jwk) throw new Error("apple_key_not_found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, base64UrlToBytes(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new Error("invalid_apple_signature");
  return { subject: String(payload.sub), email: normalizeEmail(payload.email || ""), name: String(payload.name || "") };
}

async function appleConnectionCallback(request, env, url) {
  const origin = url.origin;
  try {
    const form = await request.formData();
    const state = String(form.get("state") || "");
    const expectedState = getCookie(request, "lidire_apple_state");
    if (!state || !expectedState || state !== expectedState) return new Response(appleCallbackHtml(origin, false, "A validação de segurança do Apple ID expirou. Tente novamente."), { status: 400, headers: { "Content-Type": "text/html;charset=UTF-8", "Set-Cookie": "lidire_apple_state=; Max-Age=0; Path=/; Secure; SameSite=Lax" } });
    const user = await getSessionUser(request, env);
    if (!user) return new Response(appleCallbackHtml(origin, false, "Sua sessão LiDire expirou. Entre novamente e tente conectar o Apple ID."), { status: 401, headers: { "Content-Type": "text/html;charset=UTF-8" } });
    const code = String(form.get("code") || "");
    if (!code) throw new Error("apple_authorization_code_missing");
    const redirectUri = `${origin}/api/connections/apple/callback`;
    const clientSecret = await createAppleClientSecret(env);
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.APPLE_CLIENT_ID, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri }) });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) throw new Error("apple_token_exchange_failed");
    const identity = await verifyAppleIdToken(tokenData.id_token, env);
    let firstTimeUser = {};
    try { firstTimeUser = JSON.parse(String(form.get("user") || "{}")); } catch (_) {}
    const appleUser = { ...identity, name: identity.name || [firstTimeUser?.name?.firstName, firstTimeUser?.name?.lastName].filter(Boolean).join(" ") };
    const result = await linkProviderAccount(env.DB, user, "apple", appleUser);
    if (!result.ok) return new Response(appleCallbackHtml(origin, false, result.message), { status: result.status, headers: { "Content-Type": "text/html;charset=UTF-8" } });
    return new Response(appleCallbackHtml(origin, true, "Apple ID conectado à LiDire."), { status: 200, headers: { "Content-Type": "text/html;charset=UTF-8", "Set-Cookie": "lidire_apple_state=; Max-Age=0; Path=/; Secure; SameSite=Lax" } });
  } catch (error) {
    console.error("LiDire Apple connection error:", error);
    return new Response(appleCallbackHtml(origin, false, "Não foi possível conectar o Apple ID. Verifique a configuração da integração e tente novamente."), { status: 400, headers: { "Content-Type": "text/html;charset=UTF-8", "Set-Cookie": "lidire_apple_state=; Max-Age=0; Path=/; Secure; SameSite=Lax" } });
  }
}

async function register(request, env, requestUrl) {
  await ensureAuthTables(env.DB);
  const limit = await checkAuthRateLimit(env.DB, request, "register", 5, 3600);
  if (!limit.allowed) return tooManyAuthAttempts(limit);
  const body = await readJson(request);
  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (name.length < 2) {
    return Response.json(
      { error: "invalid_name", message: "Informe seu nome." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { error: "invalid_email", message: "Informe um e-mail válido." },
      { status: 400 }
    );
  }

  const strongPassword = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!strongPassword) {
    return Response.json(
      { error: "weak_password", message: "A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial." },
      { status: 400 }
    );
  }

  if (!body.legalAccepted) {
    return Response.json(
      { error: "legal_required", message: "O aceite dos documentos legais é necessário para criar a conta." },
      { status: 400 }
    );
  }

  await ensureAuthTables(env.DB);

  const existing = await env.DB
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first();

  if (existing) {
    return Response.json(
      { error: "email_exists", message: "Já existe uma conta com este e-mail." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    // O D1 atual usa users + profiles com o perfil separado do usuário.
    // Mantemos o cadastro mínimo e seguro aqui; configurações adicionais
    // serão inicializadas quando seus módulos forem conectados.
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at, email_verified_at, email_verification_required)
        VALUES (?, ?, ?, ?, ?, ?, NULL, 1)
      `).bind(userId, email, passwordHash, name, now, now),

      env.DB.prepare(`
        INSERT INTO profiles (
          user_id, name, email, age, phone, address, profile_photo, currency, created_at, updated_at
        )
        VALUES (?, ?, ?, NULL, NULL, NULL, NULL, 'BRL', ?, ?)
      `).bind(userId, name, email, now, now)
    ]);

    // Se a tabela de aceite jurídico existir, registra o aceite.
    // O cadastro não é bloqueado por tabelas opcionais de módulos ainda não conectados.
    try {
      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO legal_acceptances (id, user_id, document_type, document_version, accepted_at)
          VALUES (?, ?, 'terms_of_use', '1.0', ?)
        `).bind(crypto.randomUUID(), userId, now),
        env.DB.prepare(`
          INSERT INTO legal_acceptances (id, user_id, document_type, document_version, accepted_at)
          VALUES (?, ?, 'privacy_policy', '1.0', ?)
        `).bind(crypto.randomUUID(), userId, now)
      ]);
    } catch (legalError) {
      console.warn("Registro de aceite jurídico não disponível nesta versão:", legalError);
    }
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("unique")) {
      return Response.json(
        { error: "email_exists", message: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }
    throw error;
  }

  let emailSent = false;
  try {
    await sendEmailVerification(env, {
      db: env.DB,
      userId,
      to: email,
      name,
      origin: requestUrl.origin
    });
    emailSent = true;
  } catch (error) {
    // A conta permanece pendente; o usuário pode solicitar novo envio na tela.
    console.error("LiDire email verification send failed:", String(error?.message || error));
  }

  return Response.json({
    ok: true,
    requiresEmailVerification: true,
    emailSent,
    email,
    message: emailSent
      ? "Enviamos um link de confirmação para seu e-mail. Confirme o endereço antes de entrar na LiDire."
      : "Sua conta foi criada, mas não conseguimos enviar o e-mail agora. Use a opção de reenviar a confirmação."
  }, { status: 202, headers: { "Cache-Control": "no-store, private" } });
}

async function ensureLoginSessionTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Bancos de versões antigas podem ter criado a tabela com menos colunas.
  // Adicionamos somente as colunas necessárias, sem apagar sessões existentes.
  const columns = await db.prepare(`PRAGMA table_info(user_sessions)`).all();
  const names = new Set((columns.results || []).map(c => c.name));
  if (!names.has("token_hash")) await db.prepare(`ALTER TABLE user_sessions ADD COLUMN token_hash TEXT`).run();
  if (!names.has("expires_at")) await db.prepare(`ALTER TABLE user_sessions ADD COLUMN expires_at TEXT`).run();
  if (!names.has("created_at")) await db.prepare(`ALTER TABLE user_sessions ADD COLUMN created_at TEXT`).run();
  if (!names.has("last_seen_at")) await db.prepare(`ALTER TABLE user_sessions ADD COLUMN last_seen_at TEXT`).run();
}

function decodeLoginChallenge(value) {
  try {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (_) {
    return null;
  }
}

function encodeLoginChallenge(payload) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
}

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(signature);
}

function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function checkAuthRateLimit(db, request, action, limit = 10, windowSeconds = 900) {
  const ip = String(request.headers.get("CF-Connecting-IP") || "unknown").slice(0, 80);
  const rateKey = await sha256(`${action}:${ip}`);
  const now = Math.floor(Date.now() / 1000);
  const existing = await db.prepare(
    "SELECT window_started, attempts FROM auth_rate_limits WHERE rate_key = ? LIMIT 1"
  ).bind(rateKey).first();

  if (!existing || now - Number(existing.window_started) >= windowSeconds) {
    await db.prepare(`
      INSERT INTO auth_rate_limits (rate_key, window_started, attempts)
      VALUES (?, ?, 1)
      ON CONFLICT(rate_key) DO UPDATE SET window_started = excluded.window_started, attempts = 1
    `).bind(rateKey, now).run();
    return { allowed: true };
  }

  if (Number(existing.attempts) >= limit) {
    const retryAfter = Math.max(1, windowSeconds - (now - Number(existing.window_started)));
    return { allowed: false, retryAfter };
  }

  await db.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE rate_key = ?").bind(rateKey).run();
  return { allowed: true };
}

function tooManyAuthAttempts(result) {
  return Response.json(
    { error: "too_many_attempts", message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter || 900), "Cache-Control": "no-store" } }
  );
}

async function loginChallenge(request, env) {
  return Response.json(
    { error: "login_challenge_disabled", message: "Atualize a LiDire para usar o fluxo de autenticação protegido." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}


async function login(request, env) {
  try {
    await ensureAuthTables(env.DB);
    const limit = await checkAuthRateLimit(env.DB, request, "login", 10, 900);
    if (!limit.allowed) return tooManyAuthAttempts(limit);

    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!isValidEmail(email) || password.length < 8 || password.length > 1024) {
      return Response.json({ error: "invalid_credentials", message: "E-mail ou senha inválidos." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const user = await env.DB
      .prepare("SELECT id, email, password_hash, name, email_verification_required, email_verified_at FROM users WHERE lower(email) = lower(?) LIMIT 1")
      .bind(email)
      .first();

    // Mensagem genérica evita revelar se uma conta existe.
    if (!user?.password_hash) {
      return Response.json({ error: "invalid_credentials", message: "E-mail ou senha inválidos." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    if (Number(user.email_verification_required || 0) === 1 && !user.email_verified_at) {
      return Response.json({ error: "email_not_verified", message: "Confirme seu e-mail pelo link que enviamos antes de entrar." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return Response.json({ error: "invalid_credentials", message: "E-mail ou senha inválidos." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const session = await createSession(env.DB, user.id);
    return Response.json(
      { ok: true, user: { id: user.id, name: user.name || "", email: user.email || "" } },
      { headers: { "Set-Cookie": session.cookie, "Cache-Control": "no-store, private" } }
    );
  } catch (error) {
    console.error("LiDire login error:", error);
    return Response.json({ error: "login_unavailable", message: "Não foi possível entrar agora. Tente novamente." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);

  if (token) {
    await ensureAuthTables(env.DB);
    const tokenHash = await sha256(token);
    await env.DB
      .prepare("DELETE FROM user_sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
      }
    }
  );
}


async function ensureEmailVerificationTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at)`).run();
}

async function sendEmailVerification(env, { db, userId, to, name, origin }) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) throw new Error("email_provider_not_configured");
  const recipient = normalizeEmail(to);
  if (!isValidEmail(recipient) || /[^\x00-\x7F]/.test(recipient)) {
    throw new Error("email_recipient_invalid");
  }
  const from = String(env.RESEND_FROM_EMAIL || "LiDire <recuperacao@lidire.com>").trim();
  if (/[^\x00-\x7F]/.test(from)) throw new Error("email_sender_non_ascii");
  await ensureAuthTables(db);
  await ensureEmailVerificationTable(db);

  // Um reenvio invalida links antigos que ainda não foram usados.
  await db.prepare(`DELETE FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL`).bind(userId).run();
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = bytesToBase64Url(bytes);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt).run();

  const verifyUrl = `${origin}/api/email/verify?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name || "");
  const safeUrl = escapeHtml(verifyUrl);
  const greeting = safeName ? `Olá, ${safeName}!` : "Olá!";
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f4f5fb;padding:28px 14px;color:#202641">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:30px">
        <div style="text-align:center;margin-bottom:24px"><img src="${escapeHtml(`${origin}/logo-lidire-oficial.png`)}" alt="LiDire" width="150" style="display:block;width:150px;max-width:70%;height:auto;margin:0 auto 10px;border:0;outline:none;text-decoration:none"><div style="color:#68708a;font-size:16px">Seu Copiloto para a Vida</div></div>
        <p style="font-size:16px;line-height:1.6">${greeting}</p>
        <p style="font-size:16px;line-height:1.6">Confirme seu endereço de e-mail para ativar seu cadastro na LiDire.</p>
        <p style="text-align:center;margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#6d4aff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Confirmar meu e-mail</a></p>
        <p style="font-size:13px;line-height:1.6;color:#697188">Este link expira em 24 horas e pode ser usado uma única vez.</p>
        <p style="font-size:13px;line-height:1.6;color:#697188">Se você não criou uma conta na LiDire, ignore esta mensagem.</p>
        <div style="margin-top:20px;padding:14px;background:#f5f6fb;border-radius:10px"><p style="font-size:12px;color:#697188">Se o botão não funcionar, copie este endereço para o navegador:</p><p style="font-size:12px;word-break:break-all">${safeUrl}</p></div>
      </div>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient], subject: "Confirme seu e-mail — LiDire", html })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("LiDire verification email failed:", response.status, data?.message || data?.name || "unknown_error");
    throw new Error("email_send_failed");
  }
  return data;
}

async function resendEmailVerification(request, env, requestUrl) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return Response.json({ error: "invalid_email", message: "Informe um e-mail válido." }, { status: 400 });
  await ensureAuthTables(env.DB);
  await ensureEmailVerificationTable(env.DB);
  const user = await env.DB.prepare(`SELECT id, name, email, email_verified_at, email_verification_required FROM users WHERE lower(email) = lower(?) LIMIT 1`).bind(email).first();
  // Resposta genérica para não revelar se o e-mail está cadastrado.
  if (user && Number(user.email_verification_required || 0) === 1 && !user.email_verified_at) {
    try {
      await sendEmailVerification(env, { db: env.DB, userId: user.id, to: user.email, name: user.name, origin: requestUrl.origin });
    } catch (error) {
      console.error("LiDire resend verification failed:", String(error?.message || error));
      return Response.json({ error: "email_send_failed", message: "Não foi possível enviar o e-mail agora. Tente novamente mais tarde." }, { status: 503 });
    }
  }
  return Response.json({ ok: true, message: "Se houver um cadastro pendente para esse endereço, enviaremos um novo link de confirmação." }, { headers: { "Cache-Control": "no-store" } });
}

async function verifyEmail(request, env, url) {
  await ensureAuthTables(env.DB);
  await ensureEmailVerificationTable(env.DB);
  const token = String(url.searchParams.get("token") || "");
  const origin = url.origin;
  const page = (title, message, success = false) => new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — LiDire</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#080d25;font-family:Arial,sans-serif;color:#202641;padding:20px;box-sizing:border-box"><main style="max-width:480px;width:100%;box-sizing:border-box;background:white;border-radius:20px;padding:30px;text-align:center"><div style="font-size:30px;font-weight:800;color:#6d4aff">LiDire</div><h1 style="font-size:24px">${escapeHtml(title)}</h1><p style="line-height:1.6">${escapeHtml(message)}</p><a href="${origin}/" style="display:inline-block;margin-top:12px;padding:13px 20px;border-radius:12px;background:#6d4aff;color:white;text-decoration:none;font-weight:bold">Ir para a LiDire</a></main></body></html>`, { status: success ? 200 : 400, headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
  if (!token || token.length > 500) return page("Link inválido", "Solicite um novo e-mail de confirmação.");
  const tokenHash = await sha256(token);
  const record = await env.DB.prepare(`SELECT id, user_id, expires_at, used_at FROM email_verification_tokens WHERE token_hash = ? LIMIT 1`).bind(tokenHash).first();
  if (!record || record.used_at || !record.expires_at || new Date(record.expires_at).getTime() <= Date.now()) {
    return page("Link expirado ou inválido", "Volte à LiDire e solicite um novo link de confirmação.");
  }
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET email_verified_at = ?, email_verification_required = 0, updated_at = ? WHERE id = ?`).bind(now, now, record.user_id),
    env.DB.prepare(`UPDATE email_verification_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL`).bind(now, record.id)
  ]);
  return page("E-mail confirmado!", "Seu endereço foi confirmado. Agora você já pode entrar na sua conta LiDire.", true);
}

async function ensurePasswordResetTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at)`).run();
}


async function sendPasswordResetEmail(env, { to, name, resetUrl }) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) throw new Error("email_provider_not_configured");

  const from = String(env.RESEND_FROM_EMAIL || "LiDire <onboarding@resend.dev>").trim();
  const safeName = escapeHtml(name || "");
  const safeUrl = escapeHtml(resetUrl);
  const publicBase = new URL(resetUrl).origin;
  const greeting = safeName ? `Olá, ${safeName}!` : "Olá!";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#070C22;color:#172033;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${escapeHtml(publicBase)}" style="display:inline-block;text-decoration:none;">
            <img src="${escapeHtml(publicBase)}/logo-lidire-oficial.png" alt="LiDire" width="72" height="72" style="display:block;width:72px;height:72px;margin:0 auto 10px;border:0;outline:none;text-decoration:none;">
          </a>
          <div style="font-size:28px;line-height:1;font-weight:800;color:#171d3d;">LiDire</div>
        </div>
        <p style="font-size:16px;line-height:1.6;">${greeting}</p>
        <p style="font-size:16px;line-height:1.6;">Recebemos uma solicitação para redefinir a senha da sua conta LiDire.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${safeUrl}" style="display:inline-block;background:#6d4aff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">Criar nova senha</a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#5d6678;">Este link é válido por 30 minutos e pode ser usado uma única vez.</p>
        <p style="font-size:13px;line-height:1.6;color:#5d6678;">Se você não solicitou a alteração, ignore este e-mail.</p>
        <div style="margin-top:24px;padding:16px;background:#f5f6fb;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#7a8497;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#536078;word-break:break-all;">${safeUrl}</p>
        </div>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Redefinição de senha — LiDire",
      html
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("LiDire password reset email failed:", response.status, data?.message || data?.name || "unknown_error");
    throw new Error("email_send_failed");
  }
  return data;
}

async function passwordChangeChallenge(request, env) {
  return Response.json(
    { error: "password_change_challenge_disabled", message: "Atualize a LiDire para usar a alteração de senha protegida." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}

async function passwordChange(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({error:"unauthorized",message:"Sua sessão expirou. Entre novamente."},{status:401});

  const body = await readJson(request);
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (currentPassword.length < 8 || currentPassword.length > 1024) {
    return Response.json({error:"invalid_credentials",message:"A senha atual está incorreta."},{status:401});
  }

  const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1").bind(user.id).first();
  if (!row?.password_hash || !(await verifyPassword(currentPassword, row.password_hash))) {
    return Response.json({error:"invalid_credentials",message:"A senha atual está incorreta."},{status:401});
  }

  const strongPassword = newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);
  if (!strongPassword) {
    return Response.json({error:"weak_password",message:"A nova senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial."},{status:400});
  }
  if (currentPassword === newPassword) {
    return Response.json({error:"same_password",message:"A nova senha deve ser diferente da senha atual."},{status:400});
  }

  const newPasswordHash = await hashPassword(newPassword);
  await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(newPasswordHash,new Date().toISOString(),user.id).run();

  // Mantém a sessão atual e invalida as demais sessões da conta.
  const currentToken = getCookie(request, SESSION_COOKIE);
  const currentTokenHash = currentToken ? await sha256(currentToken) : "";
  await env.DB.prepare("DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?")
    .bind(user.id, currentTokenHash).run();
  return Response.json({ok:true,message:"Senha alterada com sucesso. As outras sessões foram encerradas."},{headers:{"Cache-Control":"no-store"}});
}

async function requestPasswordReset(request, env) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const genericMessage = "Se houver uma conta com esse e-mail, as instruções de recuperação serão enviadas.";
  if (!isValidEmail(email)) return Response.json({ ok: true, message: genericMessage });

  await ensurePasswordResetTable(env.DB);
  const user = await env.DB.prepare("SELECT id, email, name FROM users WHERE email = ? LIMIT 1").bind(email).first();
  if (!user) return Response.json({ ok: true, message: genericMessage });

  // Evita disparos repetidos muito rápidos para a mesma conta.
  const recent = await env.DB.prepare(`
    SELECT id, created_at
    FROM password_reset_tokens
    WHERE user_id = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC LIMIT 1
  `).bind(user.id).first();
  if (recent?.created_at) {
    const createdMs = new Date(String(recent.created_at).replace(" ", "T") + (String(recent.created_at).endsWith("Z") ? "" : "Z")).getTime();
    if (Number.isFinite(createdMs) && Date.now() - createdMs < 60 * 1000) {
      return Response.json({ ok: true, message: genericMessage });
    }
  }

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bytesToBase64Url(tokenBytes);
  const tokenHash = await sha256(token);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const publicBase = String(env.LIDIRE_PUBLIC_URL || new URL(request.url).origin).replace(/\/$/, "");
  const resetUrl = `${publicBase}/?redefinir=${encodeURIComponent(token)}`;

  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP").bind(user.id).run();
  await env.DB.prepare(`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(id, user.id, tokenHash, expiresAt).run();

  try {
    await sendPasswordResetEmail(env, { to: user.email, name: user.name, resetUrl });
  } catch (error) {
    // O token permanece inutilizável sem o e-mail; remova-o para permitir nova tentativa.
    await env.DB.prepare("DELETE FROM password_reset_tokens WHERE id = ?").bind(id).run();
    if (error?.message === "email_provider_not_configured") {
      return Response.json({ error: "email_provider_not_configured", message: "A recuperação por e-mail ainda não foi configurada no servidor." }, { status: 503 });
    }
    return Response.json({ error: "email_send_failed", message: "Não foi possível enviar o e-mail de recuperação agora. Tente novamente em instantes." }, { status: 503 });
  }

  return Response.json({ ok: true, message: genericMessage });
}

async function completePasswordReset(request, env) {
  const body = await readJson(request);
  const token = String(body.token || "");
  const password = String(body.password || "");
  if (!token || password.length < 8) {
    return Response.json({ error: "invalid_reset", message: "Token ou senha inválidos." }, { status: 400 });
  }

  await ensurePasswordResetTable(env.DB);
  const tokenHash = await sha256(token);
  const reset = await env.DB.prepare(`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ? LIMIT 1
  `).bind(tokenHash).first();

  if (!reset || reset.used_at || new Date(reset.expires_at).getTime() <= Date.now()) {
    return Response.json({ error: "invalid_reset", message: "O link de recuperação é inválido ou expirou." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(passwordHash, now, reset.user_id),
    env.DB.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?").bind(now, reset.id),
    env.DB.prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(reset.user_id)
  ]);

  return Response.json({ ok: true, message: "Senha redefinida com sucesso. Entre novamente na sua conta." });
}

async function ensureAppLockTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS app_lock_settings (
      user_id TEXT PRIMARY KEY,
      secret_hash TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
}

async function getAppLockSettings(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureAppLockTable(env.DB);
  const row = await env.DB.prepare(`SELECT enabled FROM app_lock_settings WHERE user_id = ? LIMIT 1`).bind(user.id).first();
  return Response.json({
    ok: true,
    configured: !!row,
    enabled: !!Number(row?.enabled || 0)
  }, { headers: { "Cache-Control": "no-store, private" } });
}

async function updateAppLockSettings(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureAppLockTable(env.DB);

  const body = await readJson(request);
  const enabled = body.enabled !== false;
  const newSecret = String(body.secret || "").trim();
  const currentSecret = String(body.currentSecret || "").trim();
  const existing = await env.DB.prepare(`SELECT secret_hash, enabled FROM app_lock_settings WHERE user_id = ? LIMIT 1`).bind(user.id).first();

  if (existing && currentSecret) {
    const valid = await verifyPassword(currentSecret, existing.secret_hash);
    if (!valid) return Response.json({ error: "invalid_pin", message: "PIN ou senha atual incorreto." }, { status: 401 });
  }

  if (!enabled) {
    if (existing && !currentSecret) {
      return Response.json({ error: "current_pin_required", message: "Informe o PIN ou senha atual para desativar o bloqueio." }, { status: 400 });
    }
    if (existing) {
      await env.DB.prepare(`UPDATE app_lock_settings SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).bind(user.id).run();
    }
    return Response.json({ ok: true, configured: !!existing, enabled: false });
  }

  if (!existing && !newSecret) {
    return Response.json({ error: "secret_required", message: "Informe um PIN ou senha para ativar o bloqueio." }, { status: 400 });
  }
  if (newSecret && (newSecret.length < 4 || newSecret.length > 64)) {
    return Response.json({ error: "invalid_pin", message: "Use um PIN ou senha com 4 a 64 caracteres." }, { status: 400 });
  }

  if (existing && !currentSecret && newSecret) {
    return Response.json({ error: "current_pin_required", message: "Informe o PIN ou senha atual para alterar o bloqueio." }, { status: 400 });
  }

  const secretHash = newSecret ? await hashPassword(newSecret) : existing.secret_hash;
  if (existing) {
    await env.DB.prepare(`UPDATE app_lock_settings SET secret_hash = ?, enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).bind(secretHash, user.id).run();
  } else {
    await env.DB.prepare(`INSERT INTO app_lock_settings (user_id, secret_hash, enabled) VALUES (?, ?, 1)`).bind(user.id, secretHash).run();
  }

  return Response.json({ ok: true, configured: true, enabled: true });
}

async function verifyAppLock(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return Response.json({ error: "unauthorized", message: "Entre na sua conta." }, { status: 401 });
  await ensureAppLockTable(env.DB);
  const body = await readJson(request);
  const secret = String(body.secret || "").trim();
  const row = await env.DB.prepare(`SELECT secret_hash, enabled FROM app_lock_settings WHERE user_id = ? LIMIT 1`).bind(user.id).first();
  if (!row || !Number(row.enabled)) return Response.json({ ok: true, unlocked: true });
  if (!secret) return Response.json({ error: "invalid_pin", message: "Informe seu PIN ou senha." }, { status: 400 });
  const valid = await verifyPassword(secret, row.secret_hash);
  if (!valid) return Response.json({ error: "invalid_pin", message: "PIN ou senha incorreto." }, { status: 401 });
  return Response.json({ ok: true, unlocked: true });
}

async function updateProfile(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) {
    return Response.json(
      { error: "unauthorized", message: "Sua sessão expirou. Entre novamente." },
      { status: 401 }
    );
  }

  const body = await readJson(request);
  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email || user.email);
  const age = body.age == null || body.age === "" ? null : Number(body.age);
  const birthDate = body.birth_date == null || body.birth_date === "" ? null : String(body.birth_date).trim();
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(birthDate)) || birthDate > new Date().toISOString().slice(0,10))) {
    return Response.json({ error: "invalid_birth_date", message: "Informe uma data de nascimento válida." }, { status: 400 });
  }
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const profilePhoto = body.profile_photo == null ? null : String(body.profile_photo || "");

  if (name.length < 2) {
    return Response.json(
      { error: "invalid_name", message: "Informe seu nome." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { error: "invalid_email", message: "Informe um e-mail válido." },
      { status: 400 }
    );
  }

  if (email !== normalizeEmail(user.email)) {
    return Response.json(
      { error: "email_change_requires_verification", message: "Por segurança, a alteração de e-mail está temporariamente indisponível até a confirmação do novo endereço." },
      { status: 403 }
    );
  }

  if (age !== null && (!Number.isFinite(age) || age < 0 || age > 150)) {
    return Response.json(
      { error: "invalid_age", message: "Informe uma idade válida." },
      { status: 400 }
    );
  }

  const existing = await env.DB
    .prepare("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1")
    .bind(email, user.id)
    .first();

  if (existing) {
    return Response.json(
      { error: "email_exists", message: "Já existe uma conta com este e-mail." },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?")
      .bind(name, email, now, user.id),
    env.DB.prepare(`
      UPDATE profiles
      SET name = ?, email = ?, age = ?, birth_date = COALESCE(?, birth_date), phone = ?, address = ?, profile_photo = COALESCE(?, profile_photo), updated_at = ?
      WHERE user_id = ?
    `).bind(name, email, age, birthDate, phone, address, profilePhoto, now, user.id)
  ]);

  return Response.json({ ok: true, user: await getUserById(env.DB, user.id), database: true });
}



async function exportPersonalData(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) {
    return Response.json({ error: "unauthorized", message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const userId = String(user.id);
  let clientPayload = {};
  if (request.method === "POST") {
    try { clientPayload = await request.json(); } catch (_) { clientPayload = {}; }
  }

  // Lista explícita para evitar introspecção de sqlite_master/PRAGMA, que pode
  // ser recusada pelo D1 em algumas configurações. Cada tabela é consultada
  // somente por user_id e falhas em tabelas opcionais não interrompem a exportação.
  const personalTables = [
    "profiles", "appointments", "tasks", "shopping_lists", "foods", "diets",
    "meals", "nutrition_settings", "hydration_settings", "hydration_records",
    "financial_transactions", "spending_limits", "financial_months", "studies",
    "study_plans", "study_performance", "workouts", "workout_performance",
    "goals",
    "appointment_travel", "travel_suggestions", "ai_actions", "ai_context",
    "ai_confirmations", "ai_conversations", "ai_settings", "app_settings",
    "recipes", "notes", "note_tags", "note_exports", "ai_imports",
    "data_exports", "shopping_items", "commitments", "hydration",
    "study_activities", "fixed_expenses", "objectives", "transactions"
  ];

  const excludedColumns = /password|pass_hash|secret|token|session|credential|api_key|private_key|authorization|cookie/i;
  const exportData = {
    format: "LiDire-personal-data-export",
    version: 1,
    exported_at: new Date().toISOString(),
    account: { email: user.email || null },
    notice: "Inclui apenas registros associados diretamente à conta autenticada. Dados compartilhados ou pertencentes a outros membros da família, credenciais, tokens e sessões são excluídos.",
    data: {},
    skipped_tables: []
  };

  const ownershipColumns = ["user_id", "owner_user_id", "created_by_user_id", "account_id", "profile_id"];
  const tablesWithRows = new Set();
  for (const table of personalTables) {
    // Tentar as colunas de titularidade conhecidas, pois versões antigas e novas
    // do banco não usam necessariamente o mesmo nome. Nunca exportar uma tabela
    // pessoal sem conseguir filtrar pelo titular autenticado.
    let foundOwnershipColumn = false;
    for (const ownerColumn of ownershipColumns) {
      try {
        const result = await env.DB.prepare(
          `SELECT * FROM "${table}" WHERE "${ownerColumn}" = ?`
        ).bind(userId).all();
        foundOwnershipColumn = true;
        const rows = (result.results || []).map(item => {
          const safe = {};
          for (const [key, value] of Object.entries(item)) {
            if (excludedColumns.test(key) || /photo|foto|avatar|image|imagem|base64/i.test(key)) continue;
            safe[key] = value;
          }
          return safe;
        });
        if (rows.length) {
          exportData.data[table] = rows;
          tablesWithRows.add(table);
        }
        break;
      } catch (error) {
        // Erro de coluna inexistente: tenta o próximo nome de titularidade.
        // Se a tabela não existir, todas as tentativas falharão e ela será marcada.
      }
    }
    if (!foundOwnershipColumn) {
      exportData.skipped_tables.push(table);
      console.warn("Exportação: tabela indisponível ou sem coluna de titularidade", table);
    }
  }

  // Perfil pode usar id como chave em instalações antigas em vez de user_id.
  if (!exportData.data.profiles) {
    try {
      const result = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(userId).all();
      const rows = (result.results || []).map(item => {
        const safe = {};
        for (const [key, value] of Object.entries(item)) {
          if (!excludedColumns.test(key) && !/photo|foto|avatar|image|imagem|base64/i.test(key)) safe[key] = value;
        }
        return safe;
      });
      if (rows.length) exportData.data.profiles = rows;
    } catch (error) {
      console.warn("Exportação: perfil alternativo indisponível", error?.message || error);
    }
  }

  // A maior parte dos módulos do MVP mantém os registros no estado local do navegador,
  // não em tabelas D1. Recebemos esses registros da sessão autenticada para que a cópia
  // inclua os dados que a interface realmente usa. Dados de família e notificações
  // familiares ficam deliberadamente fora da exportação.
  const localData = clientPayload && clientPayload.data && typeof clientPayload.data === "object" ? clientPayload.data : {};
  const localCategories = [
    ["compromissos", "appointments"], ["tarefas", "tasks"], ["compras", "shopping_items"],
    ["estudos", "study_activities"], ["studyPlans", "study_plans"], ["treinos", "workouts"],
    ["hidratacao", "hydration"], ["alimentacao", "meals"], ["alimentos", "foods"],
    ["objetivos", "objectives"], ["dietas", "diets"], ["receitas", "recipes"],
    ["lembretes", "reminders"], ["financas", "transactions"], ["anotacoes", "notes"]
  ];
  for (const [localKey, exportKey] of localCategories) {
    const records = localData[localKey];
    if (!Array.isArray(records) || !records.length) continue;
    const normalized = records.filter(item => item && typeof item === "object").map(item => {
      const safe = {};
      for (const [key, value] of Object.entries(item)) {
        if (excludedColumns.test(key) || /photo|foto|avatar|image|imagem|base64/i.test(key)) continue;
        if (["family", "familia", "familyMembers", "sharedWith", "permissions", "gestacao", "gravidez", "cicloMenstrual", "menstrualCycle"].includes(key)) continue;
        safe[key] = value;
      }
      return safe;
    });
    if (!normalized.length) continue;
    // Os dados locais são a fonte principal desses módulos; evita duplicar a mesma
    // categoria somando registros locais com tabelas legadas do servidor.
    exportData.data[exportKey] = normalized;
    exportData.skipped_tables = exportData.skipped_tables.filter(table => table !== exportKey);
  }
  // Ciclo menstrual, gestação e família são deliberadamente excluídos desta exportação do MVP-1.0.
  const localProfile = clientPayload && clientPayload.profile && typeof clientPayload.profile === "object" ? clientPayload.profile : {};
  const authenticatedEmail = String(user.email || "").trim().toLowerCase();
  const submittedEmail = String(localProfile.email || "").trim().toLowerCase();
  if (submittedEmail && authenticatedEmail && submittedEmail === authenticatedEmail) {
    const existing = (exportData.data.profiles || [])[0] || {};
    const profile = { ...localProfile, ...existing };
    for (const key of Object.keys(profile)) if (excludedColumns.test(key) || /photo|foto|avatar|image|imagem|base64/i.test(key)) delete profile[key];
    exportData.data.profiles = [profile];
  }

  const escHtml = value => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const tableLabels = {
    profiles:"Perfil pessoal", appointments:"Compromissos", tasks:"Tarefas",
    shopping_lists:"Listas de compras", shopping_items:"Itens de compras", reminders:"Lembretes",
    foods:"Alimentos", diets:"Planos alimentares", meals:"Alimentação", study_plans:"Planos de estudo",
    nutrition_settings:"Preferências de alimentação", hydration_settings:"Preferências de hidratação",
    hydration_records:"Registros de hidratação", hydration:"Registros de hidratação",
    financial_transactions:"Movimentações financeiras", transactions:"Movimentações financeiras",
    spending_limits:"Limites de gastos", financial_months:"Resumo financeiro",
    fixed_expenses:"Despesas fixas", studies:"Estudos", study_plans:"Planos de estudo",
    study_performance:"Desempenho nos estudos", study_activities:"Atividades de estudo",
    workouts:"Treinos", workout_performance:"Desempenho nos treinos", goals:"Objetivos",
    objectives:"Objetivos",
    appointment_travel:"Informações de deslocamento", travel_suggestions:"Sugestões de deslocamento",
    ai_actions:"Ações da assistente", ai_context:"Contexto pessoal da assistente",
    ai_confirmations:"Confirmações da assistente", ai_conversations:"Conversas com a assistente",
    ai_settings:"Configurações da assistente", app_settings:"Preferências do aplicativo",
    recipes:"Receitas", notes:"Notas pessoais", note_tags:"Etiquetas das notas",
    note_exports:"Exportações de notas", ai_imports:"Importações da assistente",
    data_exports:"Histórico de exportações", commitments:"Compromissos"
  };
  const fieldLabels = {
    user_id:"Usuário", id:"Código interno", name:"Nome", email:"E-mail", age:"Idade", birth_date:"Data de nascimento",
    phone:"Telefone", address:"Endereço", profile_photo:"Foto de perfil", currency:"Moeda",
    created_at:"Criado em", updated_at:"Atualizado em", start_date:"Data de início", createdAt:"Criado em", updatedAt:"Atualizado em", dueDate:"Prazo", startDate:"Data de início", endDate:"Data de término",
    end_date:"Data de término", date:"Data", time:"Horário", title:"Título", description:"Descrição",
    notes:"Observações", status:"Situação", done:"Concluído", completed:"Concluído",
    amount:"Valor", type:"Tipo", category:"Categoria", quantity:"Quantidade", unit:"Unidade",
    item:"Item", average_cycle_days:"Duração média do ciclo", average_menstruation_days:"Duração média da menstruação",
    flow:"Fluxo", duration:"Duração", duration_minutes:"Duração (minutos)", calories:"Calorias", water_ml:"Quantidade de água (ml)", distance:"Distância", average_pace:"Ritmo médio", pace:"Ritmo", heart_rate:"Frequência cardíaca", notes_text:"Observações", birth_date:"Data de nascimento",
    goal:"Meta", target:"Objetivo", subject:"Matéria", topic:"Assunto", duration_minutes:"Duração (minutos)",
    due_date:"Prazo", location:"Local", travel_mode:"Meio de transporte", start_time:"Horário de início",
    end_time:"Horário de término", frequency:"Frequência", value:"Valor", month:"Mês",
    year:"Ano", description_text:"Descrição"
  };
  const humanize = key => fieldLabels[key] || key.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase());
  const prettyValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "Não consta";
    if (typeof value === "boolean" || key === "done" || key === "completed") {
      return value === true || value === 1 || value === "1" ? "Sim" : "Não";
    }
    if (typeof value === "object") return escHtml(JSON.stringify(value));
    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && /date|data|birth|nascimento|start|end|due|prazo|created|updated/i.test(key)) {
      const [yy,mm,dd] = raw.split("-"); return `${dd}/${mm}/${yy}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2} \d{2}:/.test(raw)) {
      const d = new Date(raw.replace(" ", "T"));
      if (!Number.isNaN(d.getTime())) return escHtml(d.toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo" }));
    }
    const translations = {Moderado:"Moderado",Moderate:"Moderado",Light:"Leve",Heavy:"Intenso",Completed:"Concluído",Pending:"Pendente",Active:"Ativo",Inactive:"Inativo",Running:"Corrida",Walking:"Caminhada",Cycling:"Ciclismo"};
    return escHtml(translations[raw] || raw);
  };
  const sections = Object.entries(exportData.data).map(([table, rows]) => {
    const label = tableLabels[table] || humanize(table);
    const cards = rows.map((row, index) => {
      const fields = Object.entries(row).filter(([key]) =>
        !excludedColumns.test(key) && !["id","user_id","owner_user_id","group_id","family_group_id","code","client_id"].includes(key)
      );
      return `<article class="record"><h3>${escHtml(label)}${rows.length > 1 ? ` · ${index+1}` : ""}</h3><dl>${fields.map(([key,value])=>`<div class="field"><dt>${escHtml(humanize(key))}</dt><dd>${prettyValue(key,value)}</dd></div>`).join("") || `<p>Não há detalhes adicionais para exibir.</p>`}</dl></article>`;
    }).join("");
    return `<section><h2>${escHtml(label)} <span>${rows.length} ${rows.length===1?"registro":"registros"}</span></h2>${cards}</section>`;
  }).join("");
  const exportedAt = new Date(exportData.exported_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const email = escHtml(user.email || exportData.data.profiles?.[0]?.email || "Não informado");
  const partialNotice = exportData.skipped_tables.length
    ? `<aside class="notice warning"><strong>Atenção:</strong> algumas categorias não puderam ser incluídas nesta exportação. Revise a configuração do aplicativo antes de considerar esta cópia completa.</aside>`
    : "";
  const htmlReport = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meus dados pessoais — LiDire</title><style>
  :root{color-scheme:light;--ink:#202236;--muted:#666b80;--line:#e7e8ef;--accent:#6652c7;--soft:#f6f5fc}
  *{box-sizing:border-box}body{margin:0;background:#f5f6fa;color:var(--ink);font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}
  main{max-width:900px;margin:0 auto;padding:28px 18px 50px}.hero{background:linear-gradient(135deg,#29264a,#6652c7);color:white;padding:28px;border-radius:22px;margin-bottom:20px}
  .brand{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.95}.brand img{width:54px;height:54px;object-fit:contain;background:#fff;border-radius:12px;padding:5px}.hero h1{font-size:clamp(26px,5vw,38px);line-height:1.15;margin:10px 0}.hero p{margin:6px 0;color:#f0edff}
  .summary,.record,section{background:white;border:1px solid var(--line);border-radius:16px}.summary{padding:18px 20px;margin-bottom:22px;display:grid;gap:7px}.summary span{color:var(--muted)}
  section{padding:18px;margin:18px 0}section h2{font-size:20px;margin:0 0 14px;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}section h2 span{font-size:12px;font-weight:600;color:var(--accent);background:var(--soft);padding:5px 9px;border-radius:999px}
  .record{padding:15px;margin:10px 0}.record h3{font-size:15px;margin:0 0 12px;color:var(--accent)}dl{margin:0}.field{display:grid;grid-template-columns:minmax(120px, .8fr) minmax(0,1.5fr);gap:12px;padding:8px 0;border-top:1px solid #f0f0f5;overflow-wrap:anywhere}.field dt{color:var(--muted)}.field dd{margin:0;font-weight:500}
  .notice{padding:14px 16px;border-radius:12px;margin:14px 0}.warning{background:#fff7e8;border:1px solid #f4d9a3;color:#674a16}footer{text-align:center;color:var(--muted);font-size:12px;padding:20px}
  @media(max-width:560px){main{padding:14px 10px 30px}.hero{padding:22px}.field{grid-template-columns:1fr;gap:2px}.record{padding:12px}}
  .toolbar{display:flex;justify-content:flex-end;margin:0 0 14px}.print-button{border:0;border-radius:10px;background:var(--accent);color:white;font-weight:700;padding:12px 16px;cursor:pointer;font-size:14px}
  @page{size:A4;margin:14mm}
  @media print{body{background:white}main{padding:0;max-width:none}.hero{background:#eee;color:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}.hero p{color:#333}.toolbar{display:none}section,.summary,.record{break-inside:avoid;box-shadow:none}section{break-inside:auto}}
  </style></head><body><main><div class="toolbar"><button class="print-button" onclick="window.print()">Salvar / Exportar como PDF</button></div><header class="hero"><div class="brand"><img src="data:image/png;base64,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" alt="Logo oficial LiDire"><span>LiDire · Seu Copiloto para a Vida</span></div><h1>Meus dados pessoais</h1><p>Uma cópia organizada das informações pessoais encontradas na sua conta.</p></header>
  <div class="summary"><strong>Conta: ${email}</strong><span>Arquivo gerado em ${escHtml(exportedAt)}</span><span>Esta cópia exclui identificadores técnicos internos, credenciais, tokens e sessões.</span></div>
  ${partialNotice}${sections || "<section><h2>Nenhum registro pessoal encontrado</h2><p>Não foram encontrados registros disponíveis para exportação.</p></section>"}
  <footer>Documento pessoal gerado pela LiDire. Guarde-o em local seguro.</footer></main></body></html>`;
  const filename = `lidire-meus-dados-${new Date().toISOString().slice(0, 10)}.html`;
  return new Response(htmlReport, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function deleteAccount(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) {
    return Response.json({ error: "unauthorized", message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const userId = user.id;
  const tables = await env.DB.prepare(`
    SELECT name, sql FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      AND (sql LIKE '%user_id%' OR sql LIKE '%owner_user_id%')
  `).all();

  const statements = [];

  // B5: titulares que compartilhavam com esta conta ficam sem destinatário; o vínculo é removido
  // e as cópias deles são limpas depois do lote.
  let affectedOwners = [];
  try {
    const linked = await env.DB.prepare(`SELECT DISTINCT g.owner_user_id AS owner_user_id FROM family_members m JOIN family_groups g ON g.id = m.group_id WHERE m.user_id = ? AND g.owner_user_id <> ?`).bind(userId, userId).all();
    affectedOwners = (linked.results || []).map(row => String(row.owner_user_id || "")).filter(Boolean);
    if (affectedOwners.length) statements.push(env.DB.prepare(`DELETE FROM family_members WHERE user_id = ? AND group_id IN (SELECT id FROM family_groups WHERE owner_user_id <> ?)`).bind(userId, userId));
  } catch (_) {}

  // Child records that reference family_groups through group_id.
  try {
    const family = await env.DB.prepare(`SELECT id FROM family_groups WHERE owner_user_id = ?`).bind(userId).all();
    for (const row of (family.results || [])) {
      statements.push(env.DB.prepare(`DELETE FROM family_members WHERE group_id = ?`).bind(row.id));
    }
    if ((family.results || []).length) {
      statements.push(env.DB.prepare(`DELETE FROM family_groups WHERE owner_user_id = ?`).bind(userId));
    }
  } catch (_) {}

  for (const table of (tables.results || [])) {
    const name = String(table.name || "");
    if (!name || ["users", "user_sessions"].includes(name) || name === "family_groups" || name === "family_members") continue;
    const sql = String(table.sql || "");
    if (/\buser_id\b/i.test(sql)) {
      statements.push(env.DB.prepare(`DELETE FROM "${name.replaceAll('"','""')}" WHERE user_id = ?`).bind(userId));
    } else if (/\bowner_user_id\b/i.test(sql)) {
      statements.push(env.DB.prepare(`DELETE FROM "${name.replaceAll('"','""')}" WHERE owner_user_id = ?`).bind(userId));
    }
  }

  statements.push(env.DB.prepare("DELETE FROM profiles WHERE user_id = ?").bind(userId));
  statements.push(env.DB.prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(userId));
  statements.push(env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId));

  await env.DB.batch(statements);
  for (const ownerId of affectedOwners) await purgeUnauthorizedSharedCopiesSafe(env.DB, ownerId);

  return new Response(JSON.stringify({ ok: true, message: "Conta e dados excluídos." }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    }
  });
}

async function getSessionUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  await ensureAuthTables(env.DB);

  const tokenHash = await sha256(token);
  const session = await env.DB
    .prepare(`
      SELECT
        s.user_id,
        s.expires_at,
        u.id,
        u.name,
        u.email
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
      LIMIT 1
    `)
    .bind(tokenHash)
    .first();

  if (!session) return null;

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await env.DB
      .prepare("DELETE FROM user_sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
    return null;
  }

  await env.DB
    .prepare("UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?")
    .bind(tokenHash)
    .run();

  return getUserById(env.DB, session.user_id);
}

async function getUserById(db, userId) {
  return db.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      p.age,
      p.birth_date,
      p.phone,
      p.address,
      p.profile_photo AS profile_photo
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
    LIMIT 1
  `).bind(userId).first();
}

async function createSession(db, userId) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bytesToBase64Url(tokenBytes);
  const tokenHash = await sha256(token);

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await db.prepare(`
    INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, userId, tokenHash, expiresAt).run();

  return {
    token,
    cookie: `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`
  };
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );

  return [
    "pbkdf2",
    PASSWORD_ITERATIONS,
    bytesToBase64Url(salt),
    bytesToBase64Url(new Uint8Array(bits))
  ].join("$");
}

async function verifyPassword(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  const salt = base64UrlToBytes(parts[2]);
  const expected = base64UrlToBytes(parts[3]);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    key,
    expected.length * 8
  );

  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual[i] ^ expected[i];
  }
  return diff === 0;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(value)
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return {};
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) {
      return parts.join("=");
    }
  }

  return null;
}
