const STORAGE_KEY = "lidire-mvp-data";
const LIDIRE_VERSION = "120";

const defaultState = {
  user: {
    name: "",
    email: "conta@lidire.com",
    age: "",
    birth_date: "",
    phone: "",
    address: "",
    photo: "",
    sex: "",
    weight: "",
    hydrationActivity: "moderate",
    hydrationGoalType: "health"
  },

  data: {
    compromissos: [],
    tarefas: [],
    compras: [],
    estudos: [],
    studyPlans: [],
    treinos: [],
    hidratacao: [],
    alimentacao: [],
    financas: [],
    alimentos: [],
    objetivos: [],
    familia: [],
    dietas: [],
    receitas: [],
    lembretes: [],
    audios: [],
    cicloMenstrual: {
      periodos: [],
      sintomas: []
    },
    notificacoesFamilia: [],
    notificacoesFamiliaLixeira: [],
    anotacoes: [],
    grupos: [],
    gestacao: { startDate: "", records: [], exams: [] }
  },

  settings: {
    hydrationGoal: 2000,
    hydrationStart: "08:00",
    hydrationEnd: "21:00",
    hydrationIntervalMinutes: 120,
    calorieGoal: 2000,
    financeLimits: {},
    financeMonthResets: {},
    cycleLength: 28,
    periodLength: 5,
    cycleAiContext: false,
    language: "pt-BR",
    theme: "dark",
    subscriptionPlan: "free",
    weather: { tempC: null, fetchedAt: 0, available: false, location: "", forecast: [] },
    route: { last: null },
    pomodoroMinutes: 25,
    hydrationProfile: { sex: "", age: "", weight: "", activity: "moderate", goal: "health" },
    notifications: {
      enabled: true,
      mode: "audio_text",
      title: "LiDire — Lembrete",
      message: "Hora do seu lembrete.",
      voiceDataUrl: "",
      sound: true
    }
  }
};

let state = loadState();
state.data.notificacoesFamilia = [];
state.data.notificacoesFamiliaLixeira = [];
let currentPage = "inicio";
let currentShoppingList = null;
let expandedShoppingListId = null;
let modal = null;
let authUser = null;
let providerConnections = { google: false, apple: false, gmail: false };
let gmailMessages = [];
let providerConfig = { googleClientId: "", appleClientId: "", googleConfigured: false, appleConfigured: false, gmailConfigured: false };
let googleIdentityScriptPromise = null;
let appleConnectWindow = null;
let authMode = "login";
let authBusy = false;
let pendingVerificationEmail = "";
let authChecked = false;
let sharedTasksCache = [];
let sharedTasksLoading = null;
let sharedTasksSessionVersion = 0;
// Evita que a verificação de sessão iniciada na abertura sobrescreva um login recente.
let authStateVersion = 0;
let appLock = { configured: false, enabled: false, unlocked: true, loading: false };
let notesLoadedForUserId = "";
let notesLoading = false;
let cycleLoadedForUserId = "";
let cycleLoading = false;
function normalizeV43State(){ state.data.dietas=Array.isArray(state.data.dietas)?state.data.dietas:[]; state.data.grupos=Array.isArray(state.data.grupos)?state.data.grupos:[]; state.data.gestacao={startDate:"",records:[],exams:[],...(state.data.gestacao||{})}; state.data.gestacao.records=Array.isArray(state.data.gestacao.records)?state.data.gestacao.records:[]; state.data.gestacao.exams=Array.isArray(state.data.gestacao.exams)?state.data.gestacao.exams:[]; state.data.lembretes=Array.isArray(state.data.lembretes)?state.data.lembretes:[]; state.data.audios=Array.isArray(state.data.audios)?state.data.audios:[]; state.settings.language="pt-BR"; state.settings.theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark"; (state.data.familia||[]).forEach(x=>{x.permissions={agenda:false,tarefas:false,shareTasksData:false,compras:false,estudos:false,treinos:false,hidratacao:false,alimentacao:false,financas:false,objetivos:false,cicloMenstrual:false,lembretes:false,...(x.permissions||{})};}); (state.data.treinos||[]).forEach(t=>{if(typeof t.completed!=="boolean")t.completed=false;if(!t.date)t.date=todayISO();if(!t.time)t.time="";}); }
normalizeV43State();

function normalizeV45State(){
  state.settings.language="pt-BR";
  state.settings.theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark";
  if(!Array.isArray(state.data.familia)) state.data.familia=[];
  state.data.familia.forEach(person=>{
    person.permissions={agenda:false,tarefas:false,shareTasksData:false,compras:false,estudos:false,treinos:false,
      hidratacao:false,alimentacao:false,financas:false,objetivos:false,cicloMenstrual:false,
      lembretes:false,...(person.permissions||{})};
  });
  state.settings.familySharing={
    syncCalendars:false, sharedFinances:false, liveLocation:false, totalVisibility:false,
    groupNotifications:false, focusMode:false, connected_calendar:false, connected_outlook:false,
    connected_notion:false, connected_googleWorkspace:false, connected_slack:false,
    ...(state.settings.familySharing||{})
  };
}
normalizeV45State();
// Remove only known demonstration content from previous MVP builds; user-created data is preserved.
state.data.lugares = Array.isArray(state.data.lugares) ? state.data.lugares : [];
state.data.compromissos = (state.data.compromissos||[]).filter(x=>!/^Jantar (de Domingo|em família|de Aniversário)/i.test(String(x.title||"")));
state.settings.subscriptionPlan = "free";
state.settings.weather = { tempC:null, fetchedAt:0, available:false, ...(state.settings.weather||{}) };
state.settings.pomodoroMinutes = Number(state.settings.pomodoroMinutes) || 25;
state.settings.hydrationProfile = { sex:"", age:"", weight:"", activity:"moderate", goal:"health", ...(state.settings.hydrationProfile||{}) };
if (state.user.sex && !state.settings.hydrationProfile.sex) state.settings.hydrationProfile.sex = state.user.sex;
if (state.user.weight && !state.settings.hydrationProfile.weight) state.settings.hydrationProfile.weight = state.user.weight;
if (state.user.age && !state.settings.hydrationProfile.age) state.settings.hydrationProfile.age = state.user.age;
state.settings.notifications = {
  enabled: true,
  mode: "audio_text",
  title: "LiDire — Lembrete",
  message: "Hora do seu lembrete.",
  voiceDataUrl: "",
  audioId: "builtin-alarm-30s",
  sound: true,
  ...(state.settings.notifications || {})
};
state.settings.notifications.mode = "audio_text";
state.settings.appVersion = LIDIRE_VERSION;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved) {
      return clone(defaultState);
    }

    return {
      ...clone(defaultState),
      ...saved,

      user: {
        ...defaultState.user,
        ...(saved.user || {})
      },

      data: {
        ...defaultState.data,
        ...(saved.data || {})
      },

      settings: {
        ...defaultState.settings,
        ...(saved.settings || {})
      }
    };
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return clone(defaultState);
  }
}

// O compartilhamento entre contas é somente leitura e separado por permissão de módulo.
// A cópia compartilhada é persistida no D1; os dados originais permanecem na conta do titular.
let familySyncQueue = Promise.resolve();
const FAMILY_SYNC_MODULES = {
  tarefas: { label: "Tarefas", permission: "shareTasksData", endpoint: "tasks" },
  compromissos: { label: "Agenda", permission: "agenda", endpoint: "agenda" },
  compras: { label: "Compras", permission: "compras", endpoint: "compras" },
  estudos: { label: "Estudos", permission: "estudos", endpoint: "estudos" },
  treinos: { label: "Treinos", permission: "treinos", endpoint: "treinos" },
  hidratacao: { label: "Hidratação", permission: "hidratacao", endpoint: "hidratacao" },
  alimentacao: { label: "Alimentação", permission: "alimentacao", endpoint: "alimentacao" },
  financas: { label: "Finanças", permission: "financas", endpoint: "financas" },
  objetivos: { label: "Objetivos", permission: "objetivos", endpoint: "objetivos" },
  lembretes: { label: "Lembretes", permission: "lembretes", endpoint: "lembretes" }
};
const SHARED_MODULE_CACHE = Object.fromEntries(Object.keys(FAMILY_SYNC_MODULES).map(key => [key, []]));
function clearSharedCachesForAccountChange() {
  // Invalida respostas em voo (sessão+1), zera os caches em memória de tarefas e de todos os módulos
  // e remove as marcas de "dono do cache" gravadas no localStorage.
  sharedTasksSessionVersion += 1;
  sharedTasksCache = [];
  sharedTasksLoading = null;
  for (const key of Object.keys(SHARED_MODULE_CACHE)) SHARED_MODULE_CACHE[key] = [];
  try {
    for (const key of Object.keys(FAMILY_SYNC_MODULES)) localStorage.removeItem(`lidire_shared_cache_owner_${key}`);
  } catch (_) {}
}
const SHARED_MODULE_PAGE = {
  compromissos: "agenda", compras: "compras", estudos: "estudos", treinos: "treinos",
  hidratacao: "hidratacao", alimentacao: "alimentacao", financas: "financas",
  objetivos: "objetivos", lembretes: "lembretes", tarefas: "tarefas"
};
const FAMILY_SHARE_PERMISSION_KEYS = ["shareTasksData","tarefas","agenda","compras","estudos","treinos","hidratacao","alimentacao","financas","objetivos","lembretes","cicloMenstrual"];
function familySyncFingerprint(value) {
  try { return JSON.stringify(value ?? []); } catch (_) { return "[]"; }
}
function familyTaskSharingFingerprint(members) {
  const rows = (Array.isArray(members) ? members : []).map(member => ({
    id: String(member?.serverId || member?.id || ""),
    userId: String(member?.userId || member?.user_id || ""),
    status: String(member?.inviteStatus || member?.status || "").toLowerCase(),
    enabled: member?.permissions?.shareTasksData === true,
    consent: member?.permissions?.shareConsentVersion === 1
  })).sort((a, b) => a.id.localeCompare(b.id));
  return familySyncFingerprint(rows);
}
function familyModulePermissionFingerprint(members, permissionKey) {
  const rows = (Array.isArray(members) ? members : []).map(member => ({
    id: String(member?.serverId || member?.id || ""),
    status: String(member?.inviteStatus || member?.status || "").toLowerCase(),
    enabled: member?.permissions?.[permissionKey] === true,
    consent: member?.permissions?.shareConsentVersion === 1
  })).sort((a, b) => a.id.localeCompare(b.id));
  return familySyncFingerprint(rows);
}
// O servidor é a autoridade sobre quem recebe (família, consentimento e permissão no D1).
// No cliente basta saber se algum contato aceito/ativo tem a permissão marcada; exigir userId
// aqui impedia o envio para contatos recém-cadastrados ou sincronizados sem esse campo.
function familyActiveRecipients(members, permissionKey) {
  return (Array.isArray(members) ? members : []).filter(member =>
    member && ["active", "accepted"].includes(String(member.inviteStatus || member.status || "").toLowerCase()) &&
    member.permissions?.[permissionKey] === true
  );
}
// ---- Fila de sincronização familiar com reenvio (B4) ----
// Exclusões pendentes (ids) e "reenvio total pendente" ficam no localStorage por conta e por módulo.
// Só saem da fila depois que o servidor confirma o lote; falhas de rede são retomadas por
// retryPendingFamilySync (ao reabrir o app, voltar a ficar online, voltar à aba e a cada 60 s).
function familyPendingDeletesKey(userId, moduleKey) { return `lidire_family_pending_deletes:${String(userId||"")}:${moduleKey}`; }
function familyPendingResyncKey(userId, moduleKey) { return `lidire_family_pending_resync:${String(userId||"")}:${moduleKey}`; }
function readFamilyPendingDeletes(userId, moduleKey) {
  try { const value=JSON.parse(localStorage.getItem(familyPendingDeletesKey(userId,moduleKey))||"[]"); return Array.isArray(value)?value.map(String):[]; } catch (_) { return []; }
}
function writeFamilyPendingDeletes(userId, moduleKey, ids) {
  try {
    const unique=[...new Set((ids||[]).map(String).filter(Boolean))];
    if(unique.length) localStorage.setItem(familyPendingDeletesKey(userId,moduleKey),JSON.stringify(unique));
    else localStorage.removeItem(familyPendingDeletesKey(userId,moduleKey));
  } catch (_) {}
}
function readFamilyPendingResync(userId, moduleKey) {
  try { return localStorage.getItem(familyPendingResyncKey(userId,moduleKey))==="1"; } catch (_) { return false; }
}
function writeFamilyPendingResync(userId, moduleKey, on) {
  try { if(on) localStorage.setItem(familyPendingResyncKey(userId,moduleKey),"1"); else localStorage.removeItem(familyPendingResyncKey(userId,moduleKey)); } catch (_) {}
}
function familyHasPendingSync(userId) {
  return Object.keys(FAMILY_SYNC_MODULES).some(moduleKey => readFamilyPendingDeletes(userId,moduleKey).length || readFamilyPendingResync(userId,moduleKey));
}
function clearFamilyPendingSyncForUser(userId) {
  for (const moduleKey of Object.keys(FAMILY_SYNC_MODULES)) {
    writeFamilyPendingDeletes(userId, moduleKey, []);
    writeFamilyPendingResync(userId, moduleKey, false);
  }
}
async function familyNotifySafe(options) {
  try { await apiRequest("/api/family/notifications", options); }
  catch (error) { console.warn("Notificação familiar não entregue:", error?.message || error); }
}
let familySyncInFlight = 0;
async function runFamilyModuleSync(syncOwnerId, job) {
  const { moduleKey, meta, currentRows, beforeRows, familia, moduleChanged, permissionChanged, forceFull } = job;
  const currentIds = new Set(currentRows.map(row => String(row?.id || "")).filter(Boolean));
  // Item que voltou a existir não pode ser apagado por uma exclusão antiga que ficou na fila.
  const pending = readFamilyPendingDeletes(syncOwnerId, moduleKey);
  const stillDeleted = pending.filter(id => !currentIds.has(id));
  if (stillDeleted.length !== pending.length) writeFamilyPendingDeletes(syncOwnerId, moduleKey, stillDeleted);
  const deletedIds = stillDeleted;
  const active = familyActiveRecipients(familia, meta.permission);
  const beforeById = new Map(beforeRows.map(row => [String(row?.id || ""), row]));
  const sendAll = permissionChanged || forceFull;
  const upserts = active.length
    ? (sendAll ? currentRows : currentRows.filter(row => familySyncFingerprint(beforeById.get(String(row?.id || ""))) !== familySyncFingerprint(row)))
    : [];
  const batches = [];
  for (let i=0;i<upserts.length;i+=50) batches.push({upserts:upserts.slice(i,i+50),deletedIds:[]});
  for (let i=0;i<deletedIds.length;i+=50) batches.push({upserts:[],deletedIds:deletedIds.slice(i,i+50)});
  // Lote vazio mantém o contrato: sem destinatários autorizados, o servidor apaga a cópia (revogação).
  if (!batches.length) batches.push({upserts:[],deletedIds:[]});
  let shared = false;
  for (const batch of batches) {
    if (!authUser || String(authUser.id || "") !== syncOwnerId) throw new Error("Conta alterada durante a sincronização.");
    const result = await apiRequest(`/api/family/shared/${meta.endpoint}/sync`, {
      method:"POST", timeoutMs:12000, body:JSON.stringify(batch)
    });
    shared = shared || result?.shared === true;
    if (batch.deletedIds.length) {
      const remaining = readFamilyPendingDeletes(syncOwnerId, moduleKey).filter(id => !batch.deletedIds.includes(id));
      writeFamilyPendingDeletes(syncOwnerId, moduleKey, remaining);
    }
  }
  writeFamilyPendingResync(syncOwnerId, moduleKey, false);
  if (moduleChanged && shared && (upserts.length || deletedIds.length)) {
    const isTasks = moduleKey === "tarefas";
    const who = authUser.name || authUser.email || "Um familiar";
    // Enviadas em paralelo e sem bloquear a fila: a sincronização do próximo módulo não espera os avisos.
    void Promise.all(active.map(member => {
      if (!authUser || String(authUser.id || "") !== syncOwnerId) return null;
      return familyNotifySafe({
        method:"POST", timeoutMs:8000,
        body:JSON.stringify({
          memberId:member.serverId || member.id,
          title:isTasks ? "Tarefas compartilhadas atualizadas" : `${meta.label} compartilhados atualizados`,
          message:isTasks
            ? `${who} atualizou tarefas compartilhadas com você. Consulte o módulo Tarefas.`
            : `${who} atualizou dados de ${meta.label.toLowerCase()} compartilhados com você.`,
          resourceType:"shared_resource_update",resourceId:null
        })
      });
    }));
  }
}
function queueFamilyResourceUpdates(previous, current) {
  if (!authUser || !previous || !current || !Array.isArray(current.familia)) return;
  const syncOwnerId = String(authUser.id || "");
  const jobs = [];
  for (const [moduleKey, meta] of Object.entries(FAMILY_SYNC_MODULES)) {
    const beforeRows = Array.isArray(previous[moduleKey]) ? previous[moduleKey] : [];
    const currentRows = Array.isArray(current[moduleKey]) ? current[moduleKey] : [];
    const moduleChanged = familySyncFingerprint(beforeRows) !== familySyncFingerprint(currentRows);
    const permissionChanged = familyModulePermissionFingerprint(previous.familia, meta.permission) !== familyModulePermissionFingerprint(current.familia, meta.permission);
    // Persistido já no salvamento (antes de qualquer rede): fechar o app agora não perde a exclusão.
    const currentIds = new Set(currentRows.map(row => String(row?.id || "")).filter(Boolean));
    const newlyDeleted = moduleChanged ? beforeRows.map(row => String(row?.id || "")).filter(id => id && !currentIds.has(id)) : [];
    if (newlyDeleted.length) writeFamilyPendingDeletes(syncOwnerId, moduleKey, [...readFamilyPendingDeletes(syncOwnerId, moduleKey), ...newlyDeleted]);
    // Falha anterior ainda não resolvida => o diff desta rodada não basta; reenvia o conjunto autorizado completo.
    const hadPendingResync = readFamilyPendingResync(syncOwnerId, moduleKey);
    const hasPendingDeletes = readFamilyPendingDeletes(syncOwnerId, moduleKey).length > 0;
    if (!moduleChanged && !permissionChanged && !hasPendingDeletes && !hadPendingResync) continue;
    if (moduleChanged || permissionChanged) writeFamilyPendingResync(syncOwnerId, moduleKey, true);
    jobs.push({ moduleKey, meta, beforeRows, currentRows, familia: current.familia, moduleChanged, permissionChanged, forceFull: hadPendingResync || (hasPendingDeletes && !moduleChanged && !permissionChanged) });
  }
  if (!jobs.length) return;
  familySyncInFlight += 1;
  familySyncQueue = familySyncQueue.then(async () => {
    for (const job of jobs) {
      if (!authUser || String(authUser.id || "") !== syncOwnerId) return;
      // Falha em um módulo não derruba os demais; o que ficou pendente é retomado depois.
      try { await runFamilyModuleSync(syncOwnerId, job); }
      catch (error) { console.warn(`Sincronização familiar (${job.meta.label}) pendente:`, error?.message || error); }
    }
  }).catch(error => console.warn("Fila de sincronização familiar:", error))
    .finally(() => { familySyncInFlight = Math.max(0, familySyncInFlight - 1); });
}
function retryPendingFamilySync() {
  if (!authUser || familySyncInFlight > 0 || !state?.data || !Array.isArray(state.data.familia)) return;
  if (!familyHasPendingSync(String(authUser.id || ""))) return;
  queueFamilyResourceUpdates(state.data, state.data);
}
if (typeof window !== "undefined") {
  window.addEventListener("online", retryPendingFamilySync);
  setInterval(retryPendingFamilySync, 60000);
}
function saveState() {
  let previous = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) previous = JSON.parse(raw)?.data || null;
  } catch (_) {}
  // Notificações familiares pertencem ao servidor: guardá-las aqui fazia itens já excluídos reaparecerem ao reabrir o app.
  const persistable = { ...state, data: { ...state.data, notificacoesFamilia: [], notificacoesFamiliaLixeira: [] } };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  if (previous) queueFamilyResourceUpdates(previous, state.data);
}


function authLoadingScreen() {
  return `
    <div class="auth-loading">
      <div class="auth-loading-inner">
        <div class="auth-spinner"></div>
        <strong>Carregando a LiDire…</strong>
      </div>
    </div>
  `;
}

function authScreen() {
  const login = authMode === "login";
  return `
    <div class="auth-screen">
      <div class="auth-glow"></div>
      <section class="auth-card" aria-label="${login ? "Entrar" : "Criar conta"}">
        <div class="auth-brand">
          <img src="/logo-lidire-oficial.png" alt="LiDire">
          <strong>LiDire</strong>
        </div>

        <div class="eyebrow">${login ? "SEJA BEM-VINDO(A)" : "COMECE SUA JORNADA"}</div>
        <h1 class="auth-title">${login ? "Entre na sua conta." : "Crie sua conta."}</h1>
        <p class="auth-subtitle">
          ${login
            ? "Acesse sua rotina, seus planos e tudo o que você organiza com a LiDire."
            : "Tenha sua rotina organizada em um só lugar, com seus dados associados à sua própria conta."}
        </p>

        <div id="auth-message"></div>

        <form id="auth-form" class="auth-form" novalidate>
          ${!login ? `
            <label class="auth-field">
              <span>Nome</span>
              <input name="name" type="text" autocomplete="name" placeholder="Como você quer ser chamado(a)?" required minlength="2">
            </label>
          ` : ""}

          <label class="auth-field">
            <span>E-mail</span>
            <input name="email" type="email" autocomplete="email" placeholder="seu@email.com" required>
          </label>

          <label class="auth-field">
            <span>Senha</span>
            <div class="auth-password">
              <input id="auth-password" name="password" type="password" autocomplete="${login ? "current-password" : "new-password"}" placeholder="Ex.: MinhaSenha8!" required minlength="8" ${login ? "" : 'pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}"'}>
              <button type="button" class="auth-toggle-password" id="auth-toggle-password" data-action="auth-toggle-password" aria-label="Mostrar senha">◉</button>
            </div>
            ${!login ? `<small class="auth-password-hint">Use pelo menos 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.</small>` : ""}
          </label>

          ${!login ? `
            <label class="auth-field">
              <span>Confirmar senha</span>
              <div class="auth-password">
                <input id="auth-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente" required minlength="8">
                <button type="button" class="auth-toggle-password" id="auth-toggle-password-confirm" data-action="auth-toggle-password-confirm" aria-label="Mostrar confirmação de senha">◉</button>
              </div>
            </label>

            <label class="auth-check">
              <input name="legalAccepted" type="checkbox" required>
              <span>Li e aceito os <a href="#" class="auth-legal" data-action="auth-legal" data-legal="termos">Termos de Uso</a> e a <a href="#" class="auth-legal" data-action="auth-legal" data-legal="privacidade">Política de Privacidade</a>. O aceite é obrigatório para criar a conta.</span>
            </label>
          ` : ""}

          <button class="primary-button auth-submit" type="submit" data-testid="login-submit" ${authBusy ? "disabled" : ""}>
            ${authBusy ? "Aguarde…" : (login ? "Entrar na LiDire" : "Criar minha conta")}
          </button>
        </form>

        ${login ? `<button type="button" class="auth-forgot" data-action="forgot-password">Esqueci minha senha</button>` : ""}

        <p class="auth-switch">
          ${login ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
          <button type="button" data-action="auth-switch">${login ? "Criar conta" : "Entrar"}</button>
        </p>
      </section>
    </div>
  `;
}


function passwordResetScreen(token) {
  return `
    <div class="auth-screen">
      <div class="auth-glow"></div>
      <section class="auth-card" aria-label="Redefinir senha">
        <div class="auth-brand">
          <img src="/logo-lidire-oficial.png" alt="LiDire">
          <strong>LiDire</strong>
        </div>
        <div class="eyebrow">RECUPERAÇÃO DE ACESSO</div>
        <h1 class="auth-title">Crie uma nova senha.</h1>
        <p class="auth-subtitle">Escolha uma nova senha para voltar a acessar sua conta LiDire.</p>
        <div id="password-reset-message"></div>
        <form id="password-reset-form" class="auth-form" novalidate>
          <label class="auth-field">
            <span>Nova senha</span>
            <div class="auth-password">
              <input id="reset-password" name="password" type="password" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" required minlength="8">
              <button type="button" class="auth-toggle-password" data-action="reset-toggle-password" data-target="reset-password" aria-label="Mostrar nova senha">◉</button>
            </div>
            <small class="auth-password-hint">A senha deve ter no mínimo 8 caracteres.</small>
          </label>
          <label class="auth-field">
            <span>Confirmar nova senha</span>
            <div class="auth-password">
              <input id="reset-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente" required minlength="8">
              <button type="button" class="auth-toggle-password" data-action="reset-toggle-password" data-target="reset-password-confirm" aria-label="Mostrar confirmação de senha">◉</button>
            </div>
          </label>
          <button class="primary-button auth-submit" type="submit" data-testid="password-reset-submit">Redefinir minha senha</button>
        </form>
        <button type="button" class="auth-forgot" data-action="reset-back-login">Voltar para o login</button>
      </section>
    </div>
  `;
}

function setPasswordResetMessage(message, type = "error") {
  const box = document.getElementById("password-reset-message");
  if (!box) return;
  box.className = type === "success" ? "auth-success" : "auth-error";
  box.textContent = message;
}

function renderPasswordReset(token) {
  const root = document.getElementById("app");
  if (!root) return;
  root.innerHTML = passwordResetScreen(token);
  applyTheme();
  applyLanguage();
  document.getElementById("reset-password")?.focus();
}

async function submitPasswordReset(form, token) {
  const formData = new FormData(form);
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("passwordConfirm") || "");
  if (!token) {
    setPasswordResetMessage("O link de recuperação está incompleto.");
    return;
  }
  if (password.length < 8) {
    setPasswordResetMessage("A senha precisa ter pelo menos 8 caracteres.");
    return;
  }
  if (password !== confirmation) {
    setPasswordResetMessage("As senhas não coincidem.");
    return;
  }

  const button = form.querySelector('[data-testid="password-reset-submit"]');
  if (button) { button.disabled = true; button.textContent = "Redefinindo…"; }
  setPasswordResetMessage("Atualizando sua senha…", "success");
  try {
    await apiRequest("/api/password-reset/complete", {
      method: "POST",
      body: JSON.stringify({ token, password }),
      timeoutMs: 20000
    });
    history.replaceState({ lidire: true }, "", "/");
    authMode = "login";
    authUser = null;
    clearSharedCachesForAccountChange();
    authChecked = true;
    renderAuth();
    setAuthMessage("Senha redefinida com sucesso. Agora entre com sua nova senha.", "success");
  } catch (error) {
    setPasswordResetMessage(error.message || "O link de recuperação é inválido ou expirou.");
    if (button) { button.disabled = false; button.textContent = "Redefinir minha senha"; }
  }
}

function setAuthMessage(message, type = "error") {
  const box = document.getElementById("auth-message");
  if (!box) return;
  box.className = type === "success" ? "auth-success" : "auth-error";
  box.textContent = message;
}

async function createLoginProof(password, challenge) {
  const saltBytes = base64UrlToBytesClient(challenge.salt);
  const iterations = Number(challenge.iterations || 100000);
  if (!Number.isFinite(iterations) || iterations < 1) {
    throw new Error("Não foi possível iniciar o login com segurança. Atualize a página e tente novamente.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    key,
    256
  );
  const derived = new Uint8Array(bits);
  const hmacKey = await crypto.subtle.importKey(
    "raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC", hmacKey, new TextEncoder().encode(challenge.challenge)
  );
  return bytesToBase64UrlClient(new Uint8Array(signature));
}

async function createPasswordHashClient(password){
  const iterations = 100000;
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt, iterations, hash:"SHA-256"}, key, 256);
  return `pbkdf2$${iterations}$${bytesToBase64UrlClient(salt)}$${bytesToBase64UrlClient(new Uint8Array(bits))}`;
}

function bytesToBase64UrlClient(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytesClient(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 15000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchOptions = { ...options };
  delete fetchOptions.timeoutMs;
  if (!fetchOptions.signal) fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(path, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(fetchOptions.headers || {})
      },
      ...fetchOptions
    });

    let data = {};
    try { data = await response.json(); } catch (_) {}

    if (!response.ok) {
      const error = new Error(data.message || data.error || "Não foi possível concluir a solicitação.");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("O servidor demorou para responder. Verifique a conexão e tente novamente.");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }
    if (error instanceof TypeError) {
      const networkError = new Error("Não foi possível conectar à LiDire. Verifique sua internet e tente novamente.");
      networkError.code = "NETWORK";
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function syncUserToState(user) {
  if (!user) return;
  state.user = {
    ...state.user,
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    age: user.age ?? "",
    birth_date: user.birth_date || "",
    phone: user.phone || "",
    address: user.address || "",
    photo: user.profile_photo || state.user.photo || ""
  };
  saveState();
}

async function loadProviderConnections() {
  if (!authUser) return;
  try {
    const data = await apiRequest("/api/connections", { method: "GET" });
    providerConnections = { google: !!data.google?.connected, apple: !!data.apple?.connected, gmail: !!data.gmail?.connected };
    providerConfig = {
      googleClientId: String(data.google?.clientId || ""),
      appleClientId: String(data.apple?.clientId || ""),
      googleConfigured: !!data.google?.configured,
      appleConfigured: !!data.apple?.configured,
      gmailConfigured: !!data.gmail?.configured
    };
  } catch (error) {
    console.warn("Conexões externas não carregadas:", error);
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;
  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-lidire-google-gsi]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.lidireGoogleGsi = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Google Identity Services."));
    document.head.appendChild(script);
  });
  return googleIdentityScriptPromise;
}

async function openGoogleConnection() {
  if (providerConnections.google) { toast("A Conta do Google já está conectada."); return; }
  if (!providerConfig.googleConfigured || !providerConfig.googleClientId) {
    toast("A integração com o Google ainda não foi configurada no servidor.", "error");
    return;
  }
  openModal("Conectar Google Account", `
    <p class="muted">Escolha a Conta do Google que deseja vincular à sua conta LiDire.</p>
    <div id="lidire-google-connect-button" style="display:flex;justify-content:center;min-height:44px;margin:18px 0;"></div>
    <p class="muted" style="font-size:12px">A LiDire receberá apenas os dados básicos de identidade necessários para vincular a conta.</p>
  `, { submit: "Cancelar" });
  const cancel = modal.querySelector(".modal-footer .primary-button");
  if (cancel) cancel.onclick = e => { e.preventDefault(); closeModal(); };
  try {
    await loadGoogleIdentityScript();
    if (!window.google?.accounts?.id) throw new Error("Google Identity Services indisponível.");
    window.google.accounts.id.initialize({
      client_id: providerConfig.googleClientId,
      callback: handleGoogleConnectionCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "use"
    });
    const target = document.getElementById("lidire-google-connect-button");
    if (target) {
      window.google.accounts.id.renderButton(target, { theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: 280 });
    }
  } catch (error) {
    console.error(error);
    toast("Não foi possível abrir a conexão com o Google.", "error");
  }
}

async function handleGoogleConnectionCredential(response) {
  const credential = String(response?.credential || "");
  if (!credential) { toast("O Google não retornou uma credencial válida.", "error"); return; }
  try {
    const data = await apiRequest("/api/connections/google", { method: "POST", body: JSON.stringify({ credential }), timeoutMs: 20000 });
    providerConnections.google = true;
    closeModal();
    render();
    toast(data.message || "Google Account conectado à LiDire.");
  } catch (error) {
    toast(error.message || "Não foi possível conectar a Conta do Google.", "error");
  }
}

function connectGmail() {
  if (!providerConfig.gmailConfigured) { toast("A integração Gmail ainda não está totalmente configurada no servidor.", "error"); return; }
  const w = window.open("/api/connections/gmail/start", "lidireGmailConnect", "popup=yes,width=560,height=720");
  if (!w) toast("O navegador bloqueou a janela. Permita pop-ups para a LiDire.", "error");
}
async function openGmailInbox() {
  if (!providerConnections.gmail) { toast("Conecte o Gmail primeiro.", "error"); return; }
  openModal("Revisar e-mails do Gmail", `<p class="muted">Carregando mensagens recentes…</p>`, {submit:"Fechar"});
  const form = modal?.querySelector("#lidire-form"); if (form) form.onsubmit=e=>{e.preventDefault();closeModal();};
  try {
    const data=await apiRequest("/api/gmail/messages?max=20",{method:"GET",timeoutMs:30000}); gmailMessages=data.messages||[];
    if (!modal) return;
    const html = `<p class="muted">Conta conectada: <strong>${esc(data.email||"")}</strong>. Revise as sugestões antes de criar um lembrete. A classificação é automática e pode errar.</p>${gmailMessages.length?`<div style="display:grid;gap:10px;max-height:55vh;overflow:auto">${gmailMessages.map((m,i)=>`<article class="content-card" style="margin:0;padding:12px"><strong>${esc(m.subject)}</strong><p style="margin:5px 0;font-size:13px">De: ${esc(m.from)}</p><p class="muted" style="font-size:12px;margin:5px 0">${esc(m.date)}${m.unread?" · Não lido":""}</p><p style="font-size:13px">${esc(m.snippet)}</p>${m.replySuggested?`<small style="color:var(--accent,#8e7bff)">Pode precisar de resposta</small>`:`<small class="muted">Sem indicação clara de resposta</small>`}<div style="margin-top:8px"><button class="secondary-button compact" data-action="gmail-create-reminder" data-index="${i}">Criar lembrete</button></div></article>`).join("")}</div>`:`<p>Nenhum e-mail recente foi encontrado na caixa de entrada.</p>`}`;
    const formEl=modal.querySelector("#lidire-form");
    if(formEl){ const footer=formEl.querySelector(".modal-footer"); formEl.innerHTML=html; if(footer) formEl.appendChild(footer); formEl.onsubmit=e=>{e.preventDefault();closeModal();}; }
  } catch(error) { closeModal(); toast(error.message||"Não foi possível consultar o Gmail.","error"); }
}
window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.data?.type !== "lidire-gmail-connect") return;
  if (event.data.ok) { toast(event.data.message||"Gmail conectado à LiDire."); loadProviderConnections().then(()=>render()); }
  else toast(event.data.message||"Não foi possível conectar o Gmail.","error");
});

async function loadGmailDailySummary(){
  try {
    const data=await apiRequest("/api/gmail/followups",{method:"GET",timeoutMs:15000});
    const section=document.getElementById("gmail-daily-summary"); const target=document.getElementById("gmail-daily-summary-items");
    if(!section||!target)return; const items=data.followups||[]; if(!items.length){section.style.display="none";return;}
    section.style.display="block"; target.innerHTML=items.map(x=>`<div style="padding:10px 0;border-top:1px solid var(--border,rgba(128,140,180,.2))"><strong>${esc(x.subject||"E-mail importante")}</strong><p class="muted" style="margin:4px 0">${esc(x.sender_email||"")} · aguardando resposta há ${Math.max(0,Math.floor((Date.now()-Number(x.message_date||Date.now()))/3600000))}h</p><button class="ghost-button compact" data-action="gmail-inbox">Revisar no Gmail</button></div>`).join("");
  } catch(e) { /* resumo opcional; não interrompe a página inicial */ }
}
async function openGmailImportantSenders(){
  if(!providerConnections.gmail){toast("Conecte o Gmail primeiro.","error");return;}
  openModal("E-mails importantes",`<p class="muted">Cadastre remetentes que deseja acompanhar. A rotina agendada verifica mensagens e respostas periodicamente.</p><label>Endereço de e-mail</label><input id="gmail-rule-email" type="email" placeholder="pessoa@empresa.com" required><label>Categoria</label><select id="gmail-rule-category"><option>Trabalho</option><option>Estudos</option><option>Pessoal</option><option>Financeiro</option></select><label>Alertar se não houver resposta</label><select id="gmail-rule-hours"><option value="3">Após 3 horas</option><option value="6">Após 6 horas</option><option value="12">Após 12 horas</option><option value="24">Após 24 horas</option></select><label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input id="gmail-rule-notify" type="checkbox" checked> Avisar ao receber e-mail novo</label><button type="button" class="primary-button compact" id="gmail-rule-save">Salvar remetente</button><hr><div id="gmail-rules-list">Carregando remetentes…</div>`,{submit:"Fechar"});
  const form=modal?.querySelector("#lidire-form"); if(form) form.onsubmit=e=>{e.preventDefault();closeModal();};
  const load=async()=>{const data=await apiRequest("/api/gmail/important-senders",{method:"GET"});const el=modal?.querySelector("#gmail-rules-list");if(!el)return;el.innerHTML=(data.senders||[]).map(x=>`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--border)"><span><strong>${esc(x.email)}</strong><small style="display:block">${esc(x.category)} · ${x.reminder_hours}h</small></span><button type="button" class="ghost-button compact" data-action="gmail-rule-delete" data-id="${esc(x.id)}">Remover</button></div>`).join("")||'<p class="muted">Nenhum remetente cadastrado.</p>';};
  await load();
  modal?.querySelector("#gmail-rule-save")?.addEventListener("click",async()=>{try{await apiRequest("/api/gmail/important-senders",{method:"POST",body:JSON.stringify({email:modal.querySelector("#gmail-rule-email").value,category:modal.querySelector("#gmail-rule-category").value,reminderHours:Number(modal.querySelector("#gmail-rule-hours").value),notifyNew:modal.querySelector("#gmail-rule-notify").checked})});modal.querySelector("#gmail-rule-email").value="";await load();toast("Remetente salvo.");}catch(e){toast(e.message||"Não foi possível salvar.","error");}});
}

function openAppleConnection() {
  if (providerConnections.apple) { toast("O Apple ID já está conectado."); return; }
  if (!providerConfig.appleConfigured) {
    toast("A integração com o Apple ID ainda não foi configurada no servidor.", "error");
    return;
  }
  const width = 520, height = 720;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  appleConnectWindow = window.open("/api/connections/apple/start", "lidireAppleConnect", `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
  if (!appleConnectWindow) toast("O navegador bloqueou a janela de conexão. Permita pop-ups para a LiDire.", "error");
}

window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.data?.type !== "lidire-apple-connect") return;
  try { appleConnectWindow?.close(); } catch (_) {}
  appleConnectWindow = null;
  if (event.data.ok) {
    providerConnections.apple = true;
    render();
    toast(event.data.message || "Apple ID conectado à LiDire.");
  } else {
    toast(event.data.message || "Não foi possível conectar o Apple ID.", "error");
  }
});

async function loadCurrentUser() {
  // Se houver uma autenticação mais recente durante a consulta, a resposta antiga
  // de /api/me não pode substituir o estado atualizado pelo login.
  const versionAtStart = authStateVersion;
  try {
    const data = await apiRequest("/api/me", { method: "GET" });
    if (versionAtStart !== authStateVersion) return Boolean(authUser);
    if (data.user) {
      if (String(authUser?.id || "") !== String(data.user.id || "")) clearSharedCachesForAccountChange();
      authUser = data.user;
      syncUserToState(data.user);
      return true;
    }
  } catch (error) {
    console.warn("Sessão não carregada:", error);
    if (versionAtStart !== authStateVersion) return Boolean(authUser);
  }
  if (versionAtStart === authStateVersion) authUser = null;
  if (versionAtStart === authStateVersion) {
    clearSharedCachesForAccountChange();
  }
  return false;
}

function openSignupLegalDocument(kind) {
  const isPrivacy = kind === "privacidade";
  const title = isPrivacy ? "Política de Privacidade" : "Termos de Uso";
  const content = isPrivacy ? `
    <p><strong>Como a LiDire trata seus dados</strong></p>
    <p>A LiDire utiliza os dados fornecidos para criar e manter sua conta e oferecer as funcionalidades disponíveis que você escolher, como agenda, tarefas, estudos, treinos, alimentação, hidratação, finanças e objetivos. O compartilhamento familiar, o Ciclo Menstrual e a Gestação estão em desenvolvimento e não estão disponíveis nesta versão.</p>
    <h3>Dados tratados</h3>
    <p>Podem ser tratados dados de cadastro, informações que você registra nos módulos disponíveis, configurações e registros técnicos necessários ao funcionamento, à segurança e à manutenção da conta.</p>
    <h3>Uso e compartilhamento</h3>
    <p>Os dados são usados para fornecer, proteger e aprimorar os recursos da LiDire. O compartilhamento familiar está desativado nesta versão. Não é possível enviar convites nem compartilhar módulos por meio do aplicativo. Não registre informações pessoais de terceiros sem base legal e autorização adequadas.</p>
    <h3>Armazenamento e segurança</h3>
    <p>As informações podem ser armazenadas no dispositivo e nos serviços de infraestrutura usados pela LiDire. São adotadas medidas de segurança compatíveis com o serviço, mas nenhum sistema pode garantir segurança absoluta.</p>
    <h3>Seus controles</h3>
    <p>Você deve proteger suas credenciais e pode utilizar as opções disponíveis no aplicativo para gerenciar dados, permissões e, quando disponível, solicitar exclusão da conta. Mudanças relevantes nesta política poderão ser comunicadas ou publicadas no aplicativo.</p>
    <p class="muted">Última atualização: outubro de 2026.</p>
  ` : `
    <p><strong>Termos de Uso da LiDire</strong></p>
    <h3>1. Serviço</h3>
    <p>A LiDire é uma plataforma de organização pessoal para ajudar a gerenciar rotina, compromissos, tarefas, estudos, treinos, alimentação, hidratação, finanças, objetivos, lembretes e conteúdos escolhidos pelo usuário.</p>
    <h3>2. Conta e segurança</h3>
    <p>Forneça informações corretas, mantenha suas credenciais protegidas e não permita o uso não autorizado da sua conta. Você é responsável pelas atividades realizadas com suas credenciais.</p>
    <h3>3. Uso responsável</h3>
    <p>Use o aplicativo de acordo com a lei e respeite os direitos e a privacidade de outras pessoas. Os recursos de compartilhamento familiar, Ciclo Menstrual e Gestação estão em desenvolvimento e não estão disponíveis nesta versão.</p>
    <h3>4. Recursos e informações</h3>
    <p>As ferramentas de organização e os recursos de inteligência artificial servem como apoio e podem exigir conferência pelo usuário. A LiDire não substitui aconselhamento profissional médico, jurídico, financeiro ou de outra natureza especializada.</p>
    <h3>5. Disponibilidade</h3>
    <p>Funcionalidades podem ser alteradas, atualizadas ou ficar temporariamente indisponíveis por manutenção, segurança ou evolução do serviço.</p>
    <h3>6. Privacidade</h3>
    <p>O tratamento de dados é descrito na Política de Privacidade, que deve ser lida em conjunto com estes termos.</p>
    <h3>7. Encerramento</h3>
    <p>Você pode deixar de utilizar o serviço e usar os mecanismos disponibilizados no aplicativo para solicitar a exclusão da conta. A exclusão pode afetar o acesso aos dados associados.</p>
    <h3>8. Aceite</h3>
    <p>Ao marcar a caixa de aceite e criar uma conta, você confirma que leu e concorda com estes Termos de Uso e com a Política de Privacidade.</p>
    <p class="muted">Última atualização: outubro de 2026.</p>
  `;
  openModal(title, `<div class="legal-signup-document" style="max-height:60vh;overflow:auto;line-height:1.65;padding:2px 4px">${content}</div>`, { submit: "Fechar" });
  const form = modal?.querySelector("#lidire-form");
  if (form) form.onsubmit = event => { event.preventDefault(); closeModal(); };
  const footerButton = modal?.querySelector(".modal-footer .primary-button");
  if (footerButton) footerButton.textContent = "Fechar";
}

function renderAuth() {
  const root = document.getElementById("app");
  if (root) { root.innerHTML = authScreen(); applyTheme(); applyLanguage(); }
}

function handleAuthSwitch() {
  authMode = authMode === "login" ? "register" : "login";
  renderAuth();
}

function togglePasswordInput(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

function openPasswordRecovery() {
  openModal("Recuperar senha", `
    <p class="muted">Informe o e-mail da sua conta. Se houver uma conta com esse endereço, enviaremos um link seguro para criar uma nova senha.</p>
    ${field("E-mail", "email", "email", "", "required")}
  `, { submit: "Enviar link de recuperação" });
  modal.querySelector("#lidire-form").onsubmit = async e => {
    e.preventDefault();
    const email = String(new FormData(e.target).get("email") || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast("Informe um e-mail válido.", "error");
      return;
    }
    const button = modal.querySelector(".modal-footer .primary-button");
    if (button) { button.disabled = true; button.textContent = "Enviando…"; }
    try {
      await apiRequest("/api/password-reset/request", { method: "POST", body: JSON.stringify({ email }), timeoutMs: 20000 });
      closeModal();
      setAuthMessage("Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação para sua caixa de entrada.", "success");
    } catch (error) {
      if (button) { button.disabled = false; button.textContent = "Enviar link de recuperação"; }
      toast(error.message || "Não foi possível iniciar a recuperação.", "error");
    }
  };
}

function isStrongRegistrationPassword(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

async function submitAuth(form) {
  if (authBusy) return;
  const formData = new FormData(form);
  const login = authMode === "login";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("passwordConfirm") || "");

  if (!email || !email.includes("@")) {
    setAuthMessage("Informe um e-mail válido.");
    return;
  }
  if (login && password.length < 8) {
    setAuthMessage("Informe sua senha.");
    return;
  }
  if (!login && !isStrongRegistrationPassword(password)) {
    setAuthMessage("A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial.");
    return;
  }
  if (!login) {
    if (name.length < 2) {
      setAuthMessage("Informe seu nome.");
      return;
    }
    if (password !== confirmation) {
      setAuthMessage("As senhas não coincidem.");
      return;
    }
    if (!formData.get("legalAccepted")) {
      setAuthMessage("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
  }

  authBusy = true;
  // Invalida respostas de inicialização de sessão iniciadas antes deste login.
  authStateVersion += 1;

  // Não recriamos a tela inteira aqui. Nas versões anteriores, renderAuth()
  // limpava os campos e podia deixar a interface visualmente presa em
  // “Aguarde…”, mesmo quando a requisição ainda estava em andamento.
  const submitButton = form.querySelector('[data-testid="login-submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = login ? "Entrando…" : "Criando conta…";
    submitButton.setAttribute("aria-busy", "true");
  }
  setAuthMessage(login ? "Conectando à LiDire…" : "Criando sua conta…", "success");

  // Proteção adicional: se o Worker/rede não responder, a própria tela é
  // liberada sem apagar e-mail ou senha.
  const authFailsafe = setTimeout(() => {
    if (authBusy) {
      authBusy = false;
      const btn = document.querySelector('[data-testid="login-submit"]');
      if (btn) {
        btn.disabled = false;
        btn.textContent = login ? "Entrar na LiDire" : "Criar minha conta";
        btn.removeAttribute("aria-busy");
      }
      setAuthMessage("A LiDire não respondeu dentro do tempo esperado. Verifique a conexão e tente novamente.");
    }
  }, login ? 9000 : 20000);

  try {
    let data;
    if (login) {
      // A verificação PBKDF2 de 100.000 iterações pode exceder o limite
      // de CPU de alguns planos do Workers. Fazemos a derivação no aparelho
      // e enviamos somente uma prova HMAC vinculada ao desafio do servidor.
      // Envio da senha apenas ao endpoint próprio por HTTPS. O Worker verifica
      // o hash PBKDF2 e nunca devolve o verificador ao cliente.
      data = await apiRequest("/api/login", {
        timeoutMs: 15000,
        method: "POST",
        body: JSON.stringify({ email, password })
      });
    } else {
      data = await apiRequest("/api/register", {
        timeoutMs: 8000,
        method: "POST",
        body: JSON.stringify({ name, email, password, legalAccepted: true })
      });
    }

    if (!login && data?.requiresEmailVerification) {
      pendingVerificationEmail = email;
      setAuthMessage(data.message || "Enviamos um link de confirmação para seu e-mail. Confirme o endereço antes de entrar.", "success");
      const box = document.getElementById("auth-message");
      if (box) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "auth-forgot";
        button.dataset.action = "resend-email-verification";
        button.textContent = "Reenviar e-mail de confirmação";
        button.style.display = "block";
        button.style.marginTop = "10px";
        box.appendChild(button);
      }
      const emailInput = document.querySelector('#auth-form input[name="email"]');
      if (emailInput) emailInput.value = email;
      return;
    }

    if (String(authUser?.id || "") !== String(data.user.id || "")) clearSharedCachesForAccountChange();
    authUser = data.user;
    syncUserToState(data.user);
    authChecked = true;
    authStateVersion += 1;
    currentPage = "inicio";
    currentShoppingList = null;

    // Transição imediata para a aplicação após autenticação confirmada.
    // O carregamento de dados familiares não pode manter o usuário preso no login.
    render();
    startFamilyNotificationPolling();
    toast(login ? "Login realizado com sucesso." : "Conta criada com sucesso.");

    // Carrega dados complementares depois de mostrar a tela inicial.
    // Se houver falha, preserva a sessão e permite continuar usando a LiDire.
    loadFamilyFromD1()
      .then(async () => {
        retryPendingFamilySync();
        await loadSharedFamilyTasks(false);
        const activeSharedModule = Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
        if (activeSharedModule) await loadSharedFamilyResources(activeSharedModule, false);
        if (authUser && String(authUser.id) === String(data.user.id)) render(true);
      })
      .catch(error => console.warn("Não foi possível atualizar os dados familiares após o login:", error));
    checkPendingFamilyInvitations();
  } catch (error) {
    authBusy = false;
    const btn = document.querySelector('[data-testid="login-submit"]');
    if (btn) {
      btn.disabled = false;
      btn.textContent = login ? "Entrar na LiDire" : "Criar minha conta";
      btn.removeAttribute("aria-busy");
    }
    const message = error?.status === 403 && error?.data?.error === "email_not_verified"
      ? "Seu e-mail ainda não foi confirmado. Use o botão abaixo para reenviar o link de confirmação."
      : error?.status === 401
      ? "E-mail ou senha inválidos. Confira os dados e tente novamente."
      : error?.status === 409 && error?.data?.error === "password_not_configured"
        ? "Esta conta ainda não possui uma senha de acesso. Use a recuperação de senha ou crie uma nova conta."
        : error?.code === "TIMEOUT"
          ? "O login demorou mais que o esperado. Verifique sua conexão e tente novamente."
          : error?.code === "NETWORK"
            ? "Não foi possível conectar à LiDire. Verifique sua internet e tente novamente."
            : (error?.message || "Não foi possível concluir o acesso. Tente novamente.");
    setAuthMessage(message);
    if (error?.status === 403 && error?.data?.error === "email_not_verified") {
      pendingVerificationEmail = email;
      const box = document.getElementById("auth-message");
      if (box) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "auth-forgot";
        button.dataset.action = "resend-email-verification";
        button.textContent = "Reenviar e-mail de confirmação";
        button.style.display = "block";
        button.style.marginTop = "10px";
        box.appendChild(button);
      }
    }
  } finally {
    clearTimeout(authFailsafe);
    authBusy = false;
    const btn = document.querySelector('[data-testid="login-submit"]');
    if (btn && document.body.contains(btn)) {
      btn.disabled = false;
      btn.textContent = login ? "Entrar na LiDire" : "Criar minha conta";
      btn.removeAttribute("aria-busy");
    }
  }
}

async function resendEmailVerification() {
  const emailInput = document.querySelector('#auth-form input[name="email"]');
  const email = String(emailInput?.value || pendingVerificationEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    setAuthMessage("Informe seu e-mail no campo acima para reenviar a confirmação.");
    return;
  }
  const button = document.querySelector('[data-action="resend-email-verification"]');
  if (button) { button.disabled = true; button.textContent = "Enviando…"; }
  try {
    const result = await apiRequest("/api/email/verification/resend", { method: "POST", body: JSON.stringify({ email }), timeoutMs: 20000 });
    setAuthMessage(result.message || "Se houver um cadastro pendente, enviaremos um novo link.", "success");
  } catch (error) {
    setAuthMessage(error.message || "Não foi possível reenviar o e-mail agora.");
  } finally {
    const current = document.querySelector('[data-action="resend-email-verification"]');
    if (current) { current.disabled = false; current.textContent = "Reenviar e-mail de confirmação"; }
  }
}

async function logoutLiDire() {
  if (familyNotificationPoller) { clearInterval(familyNotificationPoller); familyNotificationPoller = null; }
  if (familyInvitationPoller) { clearInterval(familyInvitationPoller); familyInvitationPoller = null; }
  try {
    await apiRequest("/api/logout", { method: "POST", body: "{}" });
  } catch (_) {}
  authUser = null;
  clearSharedCachesForAccountChange();
  authChecked = true;
  localStorage.removeItem(STORAGE_KEY);
  state = clone(defaultState);
  currentPage = "inicio";
  renderAuth();
  toast("Você saiu da LiDire.");
}

function syncFamilyMemberFromServer(member) {
  if (!member || !member.id) return false;
  if (tombstoneHas(familyMemberTombstones, member.id)) return false;
  if (!Array.isArray(state.data.familia)) state.data.familia = [];
  const email = String(member.email || "").trim().toLowerCase();
  const index = state.data.familia.findIndex(x =>
    String(x.serverId || x.id || "") === String(member.id) ||
    (email && String(x.email || "").trim().toLowerCase() === email)
  );
  const permissions = member.permissions && typeof member.permissions === "object"
    ? member.permissions
    : (() => { try { return JSON.parse(String(member.permissions_json || "{}")); } catch { return {}; } })();
  const person = {
    ...(index >= 0 ? state.data.familia[index] : {}),
    id: index >= 0 ? state.data.familia[index].id : String(member.id),
    serverId: String(member.id),
    userId: member.user_id || member.userId || (index >= 0 ? state.data.familia[index].userId : null) || null,
    name: String(member.name || (index >= 0 ? state.data.familia[index].name : "Familiar")),
    relation: String(member.relation || (index >= 0 ? state.data.familia[index].relation : "Membro")),
    email: String(member.email || (index >= 0 ? state.data.familia[index].email : "")),
    address: String(member.address || (index >= 0 ? state.data.familia[index].address : "")),
    photo: String(member.photo || member.profile_photo || (index >= 0 ? state.data.familia[index].photo : "")),
    inviteStatus: String(member.status || (index >= 0 ? state.data.familia[index].inviteStatus : "active")),
    permissions: { shareTasksData:false, ...(index >= 0 ? (state.data.familia[index].permissions || {}) : {}), ...permissions }
  };
  if (permissions.shareConsentVersion !== 1) {
    for (const key of FAMILY_SHARE_PERMISSION_KEYS) person.permissions[key] = false;
    delete person.permissions.shareConsentVersion;
    person.permissions.consentRequired = true;
  }
  if (index >= 0) state.data.familia[index] = person;
  else state.data.familia.unshift(person);
  saveState();
  return true;
}

async function loadGroupInvitationsFromD1() {
  if (!authUser) return false;
  try {
    const response = await apiRequest("/api/groups/invitations", {method:"GET", timeoutMs:12000});
    const legacyAck = legacyAcknowledgedGroupInvites();
    const allRows = Array.isArray(response.invitations) ? response.invitations : [];
    // Migração: ciências antigas (só no aparelho) passam a ser gravadas no servidor, uma única vez.
    for (const row of allRows) {
      if (legacyAck.includes(String(row.id)) && String(row.status || "").toLowerCase() !== "pending" && !tombstoneHas(groupInviteTombstones, row.id)) {
        tombstoneSet(groupInviteTombstones, row.id);
        apiRequest(`/api/groups/invitations/${encodeURIComponent(row.id)}`, { method: "DELETE", timeoutMs: 15000 }).catch(() => groupInviteTombstones.delete(String(row.id)));
      }
    }
    const listedIds = new Set(allRows.map(row => String(row.id)));
    for (const id of [...groupInviteTombstones.keys()]) if (!listedIds.has(id)) groupInviteTombstones.delete(id);
    const rows = allRows.filter(row => !tombstoneHas(groupInviteTombstones, row.id) && !legacyAck.includes(String(row.id)));
    state.data.groupInvitations = rows;
    // Merge server invitations into each locally listed group so counters and summaries update.
    const groups = Array.isArray(state.data.grupos) ? state.data.grupos : [];
    for (const inv of rows) {
      if (inv.direction !== "received") continue;
      let group = groups.find(g => String(g.id) === String(inv.group_id));
      if (!group) {
        group = {id:String(inv.group_id), name:String(inv.group_name||"Grupo"), resources:inv.resources||[], members:[], invitations:[], fromServerInvite:true};
        groups.push(group);
      }
      group.invitations = Array.isArray(group.invitations) ? group.invitations : [];
      const existing = group.invitations.find(i => String(i.serverInvitationId||i.id)===String(inv.id));
      const normalized = {id:String(inv.id),serverInvitationId:String(inv.id),email:String(inv.recipient_email||""),status:inv.status==="pending"?"new":String(inv.status),title:`Convite para ${inv.group_name||"Grupo"}`,message:`${inv.sender_name||inv.sender_email||"Uma pessoa"} convidou você para o grupo ${inv.group_name||"Grupo"}.`,direction:inv.direction,resources:inv.resources||[],senderName:inv.sender_name||""};
      if (existing) Object.assign(existing,normalized); else group.invitations.push(normalized);
    }
    // Convite que o servidor já não lista (excluído/ciência aqui ou em outro aparelho) sai também da cópia local,
    // e o grupo criado só a partir dele desaparece junto.
    const liveIds = new Set(rows.map(r => String(r.id)));
    for (const g of groups) {
      if (Array.isArray(g.invitations)) g.invitations = g.invitations.filter(i => !i.serverInvitationId || liveIds.has(String(i.serverInvitationId)));
    }
    state.data.grupos = groups.filter(g => !(g.fromServerInvite && !(g.invitations || []).length && !(g.members || []).length));
    saveState();
    return true;
  } catch (error) { console.warn("Não foi possível carregar convites de grupos do D1:",error); return false; }
}

// Exclusões feitas neste aparelho valem na hora; respostas atrasadas do servidor não as desfazem.
const familyMemberTombstones = new Map();   // id do membro -> instante da exclusão
const groupInviteTombstones = new Map();    // id do convite de grupo -> instante da ciência/exclusão
const LOCAL_TOMBSTONE_TTL_MS = 5 * 60 * 1000;
function tombstoneSet(map, id) { if (id !== undefined && id !== null && String(id)) map.set(String(id), Date.now()); }
function tombstoneHas(map, id) {
  const key = String(id ?? "");
  const at = map.get(key);
  if (at === undefined) return false;
  if (Date.now() - at > LOCAL_TOMBSTONE_TTL_MS) { map.delete(key); return false; }
  return true;
}
function legacyAcknowledgedGroupInvites() {
  try { return JSON.parse(localStorage.getItem("lidire_ack_group_invites") || "[]").map(String); } catch (_) { return []; }
}

async function loadFamilyFromD1() {
  if (!authUser) return false;
  try {
    const response = await apiRequest("/api/family", { method: "GET", timeoutMs: 15000 });
    const serverMembers = (Array.isArray(response.members) ? response.members : []).filter(member => !tombstoneHas(familyMemberTombstones, member?.id));
    // O servidor já não lista este id: a exclusão foi confirmada, o marcador não é mais necessário.
    {
      const listed = new Set((Array.isArray(response.members) ? response.members : []).map(member => String(member?.id || "")));
      for (const id of [...familyMemberTombstones.keys()]) if (!listed.has(id)) familyMemberTombstones.delete(id);
    }
    const localMembers = Array.isArray(state.data.familia) ? state.data.familia : [];
    const normalizedServer = serverMembers.map(member => {
      let permissions = member.permissions;
      if (!permissions || typeof permissions !== "object") {
        try { permissions = JSON.parse(String(member.permissions_json || "{}")); }
        catch (_) { permissions = {}; }
      }
      return {
        id: String(member.id),
        serverId: String(member.id),
        userId: member.user_id || null,
        name: String(member.name || "Familiar"),
        relation: String(member.relation || "Membro"),
        email: String(member.email || ""),
        address: String(member.address || ""),
        inviteStatus: String(member.status || "pending"),
        permissions: { agenda:false, tarefas:false, shareTasksData:false, compras:false, estudos:false, treinos:false,
          hidratacao:false, alimentacao:false, financas:false, objetivos:false,
          cicloMenstrual:false, lembretes:false, ...(permissions || {}) }
      };
    });
    // B2: permissão sem selo de consentimento (legada) é exibida como desligada até o titular revisar e salvar.
    normalizedServer.forEach(person => {
      if (person.permissions.shareConsentVersion !== 1) {
        for (const key of FAMILY_SHARE_PERMISSION_KEYS) person.permissions[key] = false;
        delete person.permissions.shareConsentVersion;
        person.permissions.consentRequired = true;
      }
    });
    // Server records take precedence; retain local-only drafts that have not reached D1.
    const serverEmails = new Set(normalizedServer.map(x => String(x.email || "").trim().toLowerCase()).filter(Boolean));
    const serverIds = new Set(normalizedServer.map(x => String(x.serverId || x.id || "")));
    // Só sobrevive o rascunho que nunca foi ao servidor (sem serverId). Quem já tem serverId e não vem mais
    // na lista foi excluído (aqui ou em outro aparelho) e não pode ser ressuscitado por cópia local.
    const localOnly = localMembers.filter(x => {
      if (x.serverId) return false;
      const email = String(x.email || "").trim().toLowerCase();
      const id = String(x.id || "");
      return !(email && serverEmails.has(email)) && !(id && serverIds.has(id));
    });
    state.data.familia = [...normalizedServer, ...localOnly];
    saveState();
    return true;
  } catch (error) {
    console.warn("Não foi possível carregar os familiares do D1:", error);
    return false;
  }
}

async function loadSharedFamilyResources(moduleKey, renderIfChanged = true) {
  const meta = FAMILY_SYNC_MODULES[moduleKey];
  if (!authUser || !meta) return false;
  const requestedUserId = String(authUser.id || "");
  const requestedSession = sharedTasksSessionVersion;
  try {
    const response = await apiRequest(`/api/family/shared/${meta.endpoint}`, { method:"GET", timeoutMs:15000 });
    if (!authUser || String(authUser.id || "") !== requestedUserId || sharedTasksSessionVersion !== requestedSession) return false;
    const next = Array.isArray(response.resources) ? response.resources : [];
    const cacheOwnerKey = `lidire_shared_cache_owner_${moduleKey}`;
    const previousOwner = localStorage.getItem(cacheOwnerKey) || "";
    const changed = previousOwner !== requestedUserId || familySyncFingerprint(next) !== familySyncFingerprint(SHARED_MODULE_CACHE[moduleKey]);
    SHARED_MODULE_CACHE[moduleKey] = next;
    localStorage.setItem(cacheOwnerKey, requestedUserId);
    if (changed && renderIfChanged && currentPage === SHARED_MODULE_PAGE[moduleKey]) render(true);
    return true;
  } catch (error) {
    console.warn(`Não foi possível carregar ${meta.label} compartilhados:`, error);
    return false;
  }
}
function renderSharedResourcesSection(moduleKey) {
  const meta = FAMILY_SYNC_MODULES[moduleKey];
  if (!meta || moduleKey === "tarefas") return "";
  const rows = SHARED_MODULE_CACHE[moduleKey] || [];
  const items = rows.map(row => {
    const title = row.title || row.name || row.subject || row.description || row.activity || row.type || meta.label;
    const fieldCandidates = {
      compromissos: [row.date, row.time, row.location, row.address, row.status],
      compras: [row.quantity, row.unit, row.category, row.price, row.value, row.status],
      estudos: [row.subject, row.date, row.duration, row.minutes, row.status],
      treinos: [row.date, row.exercise, row.sets, row.reps, row.weight, row.completed === true ? "Concluído" : row.completed === false ? "Pendente" : ""],
      hidratacao: [row.date, row.time, row.amount, row.quantity, row.unit],
      alimentacao: [row.date, row.meal, row.quantity, row.calories, row.kcal],
      financas: [row.date, row.type, row.category, row.amount, row.value, row.status],
      objetivos: [row.deadline, row.date, row.progress, row.status],
      lembretes: [row.date, row.time, row.priority, row.status]
    };
    const details = (fieldCandidates[moduleKey] || [row.date, row.status, row.category])
      .filter(v => v !== undefined && v !== null && String(v).trim() !== "")
      .map(v => String(v)).slice(0,4).join(" · ");
    return `<div class="list-item"><div class="item-main"><strong>${esc(title)}</strong>${details?`<span>${esc(details)}</span>`:""}<small>Compartilhado por ${esc(row.sharedBy || "Familiar")}</small></div><span class="family-share-notification-status">Somente leitura</span></div>`;
  }).join("");
  return `<div class="content-card"><div class="card-toolbar"><div class="toolbar-title">${esc(meta.label)} compartilhados comigo</div><span class="family-share-notification-status">Somente leitura</span></div>${items?`<div class="item-list">${items}</div>`:`<p class="muted">Os registros de ${esc(meta.label.toLowerCase())} que seus familiares autorizarem aparecerão aqui. Você poderá consultá-los, mas não editá-los.</p>`}</div>`;
}

async function loadSharedFamilyTasks(renderIfChanged = true) {
  if (!authUser) return false;
  const requestedUserId = String(authUser.id || "");
  const requestedSession = sharedTasksSessionVersion;
  const requestKey = `${requestedSession}:${requestedUserId}`;
  if (sharedTasksLoading === requestKey) return false;
  sharedTasksLoading = requestKey;
  try {
    const response = await apiRequest("/api/family/shared/tasks", { method: "GET", timeoutMs: 15000 });
    if (!authUser || String(authUser.id || "") !== requestedUserId || sharedTasksSessionVersion !== requestedSession) return false;
    const next = Array.isArray(response.tasks) ? response.tasks : [];
    const previousOwner = localStorage.getItem("lidire_shared_cache_owner_tarefas") || "";
    const changed = previousOwner !== requestedUserId || familySyncFingerprint(next) !== familySyncFingerprint(sharedTasksCache);
    sharedTasksCache = next;
    localStorage.setItem("lidire_shared_cache_owner_tarefas", requestedUserId);
    if (changed && renderIfChanged && currentPage === "tarefas") render(true);
    return true;
  } catch (error) {
    console.warn("Não foi possível carregar tarefas compartilhadas:", error);
    return false;
  } finally {
    if (sharedTasksLoading === requestKey) sharedTasksLoading = null;
  }
}

let familyInvitePromptRunning = false;
async function checkPendingFamilyInvitations() {
  // MVP-1.0C: módulo Família congelado. Não consultar nem responder convites automaticamente.
  return;
  if (!authUser || familyInvitePromptRunning) return;
  familyInvitePromptRunning = true;
  try {
    const data = await apiRequest("/api/family/invitations", { method: "GET", timeoutMs: 12000 });
    const invitations = Array.isArray(data.invitations) ? data.invitations : [];
    for (const invite of invitations) {
      if (!authUser) break;
      const inviter = invite.inviter_name || invite.inviter_email || "uma pessoa";
      const memberName = invite.member_name || "seu familiar";
      const accepted = confirm(`${inviter} convidou você para compartilhar a família na LiDire.\n\nE-mail associado: ${invite.member_email || ""}\n\nAceitar não compartilha os seus dados. Cada pessoa define o que compartilha, módulo a módulo, somente para leitura.\n\nDeseja aceitar o convite?\n\nOK = Aceitar | Cancelar = Recusar`);
      try {
        await apiRequest(`/api/family/invitations/${encodeURIComponent(invite.id)}`, {
          method: "POST",
          body: JSON.stringify({ decision: accepted ? "accept" : "reject" }),
          timeoutMs: 15000
        });
        if (accepted) {
          await loadFamilyFromD1();
          await loadSharedFamilyTasks(false);
        const activeSharedModule = Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
        if (activeSharedModule) await loadSharedFamilyResources(activeSharedModule, false);
          toast(`Convite de ${inviter} aceito. A família foi sincronizada.`);
        } else {
          toast(`Convite de ${inviter} recusado.`);
        }
      } catch (error) {
        toast(error?.message || `Não foi possível responder ao convite de ${memberName}.`, "error");
      }
    }
    if (invitations.length && currentPage === "familia") render();
  } catch (error) {
    console.warn("Convites familiares pendentes:", error);
  } finally {
    familyInvitePromptRunning = false;
  }
}

let familyNotificationPoller=null;
let familyInvitationPoller=null;
// Exclusão/ciência feita neste aparelho vale na hora e não pode ser desfeita por uma resposta atrasada do servidor.
const familyNotificationTombstones=new Map(); // id -> { type: "deleted"|"purged"|"read", at }
const FAMILY_TOMBSTONE_TTL_MS=120000;
let familyNotificationsSeq=0;
function familyTombstoneSet(id,type){ familyNotificationTombstones.set(String(id),{type,at:Date.now()}); }
function familyTombstoneClear(id){ familyNotificationTombstones.delete(String(id)); }
function applyFamilyNotificationTombstones(mainList,trashList,trashFetched){
  const now=Date.now();
  for(const [id,t] of [...familyNotificationTombstones]) if(now-t.at>FAMILY_TOMBSTONE_TTL_MS) familyNotificationTombstones.delete(id);
  const mainById=new Map(mainList.map(n=>[String(n.id),n]));
  const trashIds=new Set(trashList.map(n=>String(n.id)));
  const main=[];
  for(const n of mainList){
    const t=familyNotificationTombstones.get(String(n.id));
    if(t&&(t.type==="deleted"||t.type==="purged"||t.type==="acknowledged")) continue;
    main.push(t&&t.type==="read"&&!n.read_at?{...n,read_at:new Date(t.at).toISOString()}:n);
  }
  const trash=trashList.filter(n=>{ const t=familyNotificationTombstones.get(String(n.id)); return !(t&&t.type==="purged"); });
  // Quando o servidor já reflete a mudança, o marcador local deixa de ser necessário.
  for(const [id,t] of [...familyNotificationTombstones]){
    if((t.type==="deleted"||t.type==="acknowledged")&&!mainById.has(id)) familyNotificationTombstones.delete(id);
    else if(t.type==="read"&&(!mainById.has(id)||mainById.get(id).read_at)) familyNotificationTombstones.delete(id);
    else if(t.type==="purged"&&trashFetched&&!trashIds.has(id)) familyNotificationTombstones.delete(id);
  }
  return {main,trash};
}
async function loadFamilyNotifications(showNew=true){
  if(!authUser) return;
  const seq=++familyNotificationsSeq;
  const sessionUserId=String(authUser.id||"");
  try{
    const trashFetched=currentPage==="familia-lixeira";
    const [data, trashData]=await Promise.all([
      apiRequest("/api/notifications?limit=30",{method:"GET",timeoutMs:10000}),
      trashFetched
        ? apiRequest("/api/notifications?limit=30&trash=1",{method:"GET",timeoutMs:10000})
        : Promise.resolve({notifications:state.data.notificacoesFamiliaLixeira||[]})
    ]);
    // Resposta mais antiga que uma consulta já iniciada (ou de outra conta) é descartada.
    if(seq!==familyNotificationsSeq || !authUser || String(authUser.id||"")!==sessionUserId) return;
    const previous=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
    const prevById=new Map(previous.map(x=>[x.id,x]));
    const merged=applyFamilyNotificationTombstones(
      Array.isArray(data.notifications)?data.notifications:[],
      Array.isArray(trashData.notifications)?trashData.notifications:[],
      trashFetched);
    const next=merged.main, trashNext=merged.trash;
    const changed=next.length!==previous.length || next.some((x,i)=>x.id!==previous[i]?.id || x.read_at!==previous[i]?.read_at || x.created_at!==previous[i]?.created_at) || trashNext.length!==(state.data.notificacoesFamiliaLixeira||[]).length;
    state.data.notificacoesFamilia=next;
    state.data.notificacoesFamiliaLixeira=trashNext;
    saveState();
    if(showNew){
      const fresh=next.filter(x=>!prevById.has(x.id));
      // O módulo Família está congelado nesta versão: não sincronizar dados nem exibir notificações de convites antigos.
      const visibleFresh = fresh.filter(n => !["family_invitation","group_invitation","invitation_accepted","family_invitation_accepted","group_invitation_accepted"].includes(String(n.resource_type||"").toLowerCase()));
      visibleFresh.slice(0,3).forEach(n=>{toast(`${n.title}: ${n.message}`); if("Notification" in window && Notification.permission==="granted") new Notification(n.title,{body:n.message});});
    }
    // Só redesenha quando algo mudou (evita refazer a tela a cada consulta).
    if(changed && (currentPage==="familia" || currentPage==="familia-lixeira" || currentPage==="inicio")) render(true);
  }catch(error){console.warn("Notificações de família:",error);}
}
// Atualização imediata ao voltar para a aba/janela ou recuperar a conexão (abas em segundo plano têm o timer limitado pelo navegador).
let familyRefreshAt=0;
function refreshFamilyNow(){
  if(!authUser || (typeof document!=="undefined" && document.hidden)) return;
  const now=Date.now(); if(now-familyRefreshAt<3000) return; familyRefreshAt=now;
  loadFamilyNotifications(true);
  if(currentPage==="tarefas") loadSharedFamilyTasks(true);
  const m=Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
  if(m) loadSharedFamilyResources(m, true);
}
if(typeof window!=="undefined"){
  window.addEventListener("online",refreshFamilyNow);
  window.addEventListener("focus",refreshFamilyNow);
  document.addEventListener("visibilitychange",refreshFamilyNow);
}
function startFamilyNotificationPolling(){
  if(familyNotificationPoller) clearInterval(familyNotificationPoller);
  if(!authUser) return;
  loadFamilyNotifications(false);
  // Carrega imediatamente o compartilhamento do módulo aberto; não espera o primeiro intervalo.
  if (currentPage === "tarefas") loadSharedFamilyTasks(true);
  const initialSharedModule = Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
  if (initialSharedModule) loadSharedFamilyResources(initialSharedModule, true);
  // Verifica convites também durante a sessão, não apenas no login/restauração.
  // A chamada é independente da consulta de notificações para não bloquear a interface.
  if (typeof checkPendingFamilyInvitations === "function") {
    checkPendingFamilyInvitations().catch(error => console.warn("Verificação inicial de convites:", error));
  }
  familyNotificationPoller=setInterval(()=>{
    loadFamilyNotifications(true);
    if(currentPage==="tarefas") loadSharedFamilyTasks(true);
    const activeModule = Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
    if(activeModule) loadSharedFamilyResources(activeModule, true);
    // Convites de grupo só precisam ser atualizados enquanto a área Família está aberta.
    if(currentPage==="familia") {
      loadGroupInvitationsFromD1().then(()=>{ if(currentPage==="familia") render(true); })
        .catch(error=>console.warn("Atualização de convites de grupos:",error));
    }
  },8000);
  if (familyInvitationPoller) clearInterval(familyInvitationPoller);
  familyInvitationPoller=setInterval(()=>{
    if (authUser && currentPage==="familia" && typeof checkPendingFamilyInvitations === "function") {
      checkPendingFamilyInvitations().catch(error => console.warn("Verificação periódica de convites:", error));
    }
  },60000);
}

async function loadAppLockSettings() {
  if (!authUser) {
    appLock = { configured: false, enabled: false, unlocked: true, loading: false };
    return;
  }
  try {
    const data = await apiRequest("/api/security/app-lock", { method: "GET", timeoutMs: 10000 });
    appLock = {
      configured: !!data.configured,
      enabled: !!data.enabled,
      unlocked: !data.enabled,
      loading: false
    };
  } catch (error) {
    console.warn("Configuração de bloqueio não carregada:", error);
    appLock = { configured: false, enabled: false, unlocked: true, loading: false };
  }
}

function appLockScreen() {
  return `
    <div class="app-lock-screen">
      <div class="app-lock-card">
        <img src="/logo-lidire-oficial.png" alt="LiDire" class="app-lock-logo">
        <div class="eyebrow">SEGURANÇA</div>
        <h1>LiDire bloqueada</h1>
        <p>Digite seu PIN de 4 a 6 dígitos para continuar.</p>
        <form id="app-lock-form" class="app-lock-form">
          <label class="auth-field">
            <span>PIN</span>
            <input id="app-lock-secret" name="secret" type="password" autocomplete="current-password" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" placeholder="Digite seu PIN" required>
          </label>
          <div id="app-lock-message"></div>
          <button class="primary-button" type="submit">Desbloquear com PIN</button>
          ${biometricStoredCredential()?.credentialId ? `<button class="ghost-button" type="button" data-action="biometric-unlock" style="width:100%;margin-top:10px">🔐 Desbloquear com biometria</button>` : ""}
        </form>
        <button class="ghost-button app-lock-logout" type="button" data-action="app-lock-logout">Sair da conta</button>
      </div>
    </div>
  `;
}

function bindAppLockScreen() {
  const form = document.getElementById("app-lock-form");
  if (!form) return;
  form.onsubmit = async event => {
    event.preventDefault();
    const input = form.querySelector("[name=secret]");
    const button = form.querySelector("button[type=submit]");
    const message = document.getElementById("app-lock-message");
    const secret = String(input?.value || "").trim();
    if (!secret) return;
    button.disabled = true;
    if (message) message.innerHTML = `<div class="auth-message success">Verificando…</div>`;
    try {
      await apiRequest("/api/security/app-lock/verify", { method: "POST", body: JSON.stringify({ secret }), timeoutMs: 10000 });
      appLock.unlocked = true;
      render();
    } catch (error) {
      if (message) message.innerHTML = `<div class="auth-message error">${esc(error?.message || "PIN ou senha incorreto.")}</div>`;
      if (input) { input.value = ""; input.focus(); }
      button.disabled = false;
    }
  };
  document.getElementById("app-lock-secret")?.focus();
}

async function initAuth() {
  const root = document.getElementById("app");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const resetToken = params.get("redefinir");
  if (resetToken) {
    authChecked = true;
    authUser = null;
    clearSharedCachesForAccountChange();
    renderPasswordReset(resetToken);
    return;
  }
  const inviteToken = params.get("convite");
  if (inviteToken) {
    authChecked = true;
    renderInviteLanding(inviteToken);
    return;
  }

  root.innerHTML = authLoadingScreen();
  const initAuthVersion = authStateVersion;
  const logged = await loadCurrentUser();
  authChecked = true;
  // Um login pode ter sido concluído enquanto /api/me ainda estava respondendo.
  // Nesse caso, não renderizar a tela de login com base na resposta antiga.
  if (initAuthVersion !== authStateVersion) {
    if (authUser) {
      render();
      startFamilyNotificationPolling();
      checkPendingFamilyInvitations();
    } else {
      renderAuth();
    }
    return;
  }
  if (logged) {
    await loadProviderConnections();
    await loadAppLockSettings();
    await loadFamilyFromD1();
    retryPendingFamilySync();
    await loadGroupInvitationsFromD1();
    await loadSharedFamilyTasks(false);
        const activeSharedModule = Object.keys(SHARED_MODULE_PAGE).find(k => SHARED_MODULE_PAGE[k] === currentPage && k !== "tarefas");
        if (activeSharedModule) await loadSharedFamilyResources(activeSharedModule, false);
    render();
    startFamilyNotificationPolling();
    checkPendingFamilyInvitations();
  } else {
    renderAuth();
  }
}

function normalizeStudiesData() {
  if (!Array.isArray(state.data.estudos)) state.data.estudos = [];
  if (!Array.isArray(state.data.studyPlans)) state.data.studyPlans = [];

  state.data.estudos.forEach(item => {
    if (!Array.isArray(item.history)) item.history = [];
    if (!item.subject) item.subject = item.title || "Matéria";
    if (item.notes == null) item.notes = "";
    if (item.link == null) item.link = "";
  });
}

normalizeStudiesData();

function normalizeCycleData() {
  if (!state.data.cicloMenstrual || typeof state.data.cicloMenstrual !== "object") {
    state.data.cicloMenstrual = { periodos: [], sintomas: [] };
  }
  if (!Array.isArray(state.data.cicloMenstrual.periodos)) state.data.cicloMenstrual.periodos = [];
  if (!Array.isArray(state.data.cicloMenstrual.sintomas)) state.data.cicloMenstrual.sintomas = [];
  state.settings.cycleLength = Math.max(21, Math.min(45, Number(state.settings.cycleLength) || 28));
  state.settings.periodLength = Math.max(1, Math.min(10, Number(state.settings.periodLength) || 5));
  state.settings.cycleAiContext = !!state.settings.cycleAiContext;
  if (!state.settings.notifications || typeof state.settings.notifications !== "object") state.settings.notifications = clone(defaultState.settings.notifications);
  state.settings.notifications = { ...clone(defaultState.settings.notifications), ...state.settings.notifications };
  state.settings.notifications.enabled = !!state.settings.notifications.enabled;
  state.settings.notifications.mode = "audio_text";
  state.settings.notifications.sound = state.settings.notifications.sound !== false;
}

normalizeCycleData();

function normalizeFoodData() {
  if (!Array.isArray(state.data.alimentos)) state.data.alimentos = [];
  state.data.alimentos.forEach(food => {
    if (!food.unit) food.unit = "g";
    if (food.calories == null) food.calories = 0;
  });
  if (!state.settings.financeMonthResets || typeof state.settings.financeMonthResets !== "object") state.settings.financeMonthResets = {};
}
normalizeFoodData();
if (!Array.isArray(state.data.anotacoes)) state.data.anotacoes = [];

if (Array.isArray(state.data.financas)) state.data.financas.forEach(x => { if (!x.currency) x.currency = "BRL"; });
if (Array.isArray(state.data.objetivos)) state.data.objetivos.forEach(x => { if (!x.moneyCurrency) x.moneyCurrency = "BRL"; if (!Array.isArray(x.metas)) x.metas = []; updateGoalProgress(x); });

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value, currency = "BRL") {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "BRL"
  });
}

function dateBR(value) {
  if (!value) return "";

  const [y, m, d] = String(value).split("-");

  return y && m && d ? `${d}/${m}/${y}` : value;
}

// Datas do módulo Gestação: armazenamento ISO (AAAA-MM-DD) e exibição brasileira (DD/MM/AAAA).
function gestDateBR(value) {
  if (!value) return "Não consta";
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[1]}/${br[2]}/${br[3]}`;
  return raw;
}
function gestDateISO(value) {
  const raw = String(value || "").trim();
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return raw;
  m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo)-1, Number(d));
  if (dt.getFullYear() !== Number(y) || dt.getMonth() !== Number(mo)-1 || dt.getDate() !== Number(d)) return null;
  return `${y}-${mo}-${d}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function toast(message, type = "success") {
  document.querySelectorAll(".lidire-toast").forEach((el) => el.remove());

  const el = document.createElement("div");

  el.className = `lidire-toast ${type}`;

  el.innerHTML = `
    <span>${type === "success" ? "✓" : "!"}</span>
    ${esc(message)}
  `;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}

function icon(name) {
  const icons = {
    home: "⌂",
    calendar: "▣",
    check: "✓",
    cart: "🛒",
    book: "▤",
    dumbbell: "♢",
    drop: "◉",
    wallet: "R$",
    target: "◎",
    family: "♧",
    food: "🍽",
    spark: "✦",
    user: "◯",
    plus: "+",
    arrow: "→",
    trash: "⌫",
    edit: "✎",
    clock: "◷",
    search: "⌕",
    back: "‹",
    link: "🔗",
    note: "📝",
    fire: "🔥"
  };

  return icons[name] || "•";
}

/* =========================================================
   ESTILO EXTRA INSERIDO PELO PRÓPRIO JS
   ========================================================= */

function injectLiDireStyles() {
  if (document.getElementById("lidire-extra-styles")) return;

  const style = document.createElement("style");
  style.id = "lidire-extra-styles";

  style.textContent = `
    .app-lock-screen { min-height: 100vh; min-height: 100dvh; display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box; background:radial-gradient(circle at 50% 0%, rgba(91,75,255,.18), transparent 42%), #070c22; }
    .app-lock-card { width:min(430px,100%); box-sizing:border-box; padding:30px 22px; border:1px solid rgba(132,95,255,.25); border-radius:28px; background:rgba(14,20,49,.96); box-shadow:0 24px 80px rgba(0,0,0,.38); text-align:center; }
    .app-lock-logo { width:82px; height:auto; display:block; margin:0 auto 18px; }
    .app-lock-card h1 { margin:8px 0 10px; font-size:30px; }
    .app-lock-card > p { margin:0 0 22px; color:#aeb6d1; line-height:1.55; }
    .app-lock-form { text-align:left; }
    .app-lock-form .primary-button { width:100%; margin-top:10px; }
    .app-lock-logout { margin-top:14px; width:100%; }
    .app-lock-settings-card { max-width:720px; }
    .app-lock-status { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:16px; border-radius:18px; margin-bottom:14px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); }
    .app-lock-status strong, .app-lock-status small { display:block; }
    .app-lock-status small { margin-top:4px; color:#9ea8c5; }
    .app-lock-status.active { border-color:rgba(124,92,255,.35); }
    .app-lock-status.inactive { opacity:.9; }
    .app-lock-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
    .app-lock-actions .primary-button, .app-lock-actions .ghost-button, .app-lock-actions .danger-button { flex:1 1 180px; }
    .app-lock-actions button:disabled { opacity:.45; cursor:not-allowed; }

    .task-priority {
      width: 7px;
      min-width: 7px;
      height: 46px;
      border-radius: 8px;
      margin-right: 10px;
    }

    .priority-baixa {
      background: #22c55e;
    }

    .priority-normal {
      background: #3b82f6;
    }

    .priority-média {
      background: #facc15;
    }

    .priority-alta {
      background: #ef4444;
    }

    .task-content {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .finance-chart {
      padding: 20px;
      margin-bottom: 20px;
    }

    .chart-row {
      margin-bottom: 15px;
    }

    .chart-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .chart-bar {
      height: 12px;
      border-radius: 20px;
      background: rgba(255,255,255,.08);
      overflow: hidden;
    }

    .chart-bar span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg,#8b5cf6,#ec4899);
    }

    .limit-warning {
      font-size: 12px;
      margin-top: 5px;
    }

    .limit-ok {
      color: #22c55e;
    }

    .limit-danger {
      color: #ef4444;
    }

    .notes-box {
      min-height: 150px;
    }

    .exercise-animation {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 130px;
      font-size: 70px;
      animation: lidireExercise 1.4s ease-in-out infinite;
    }

    @keyframes lidireExercise {
      0%,100% {
        transform: translateY(0) rotate(0deg);
      }

      50% {
        transform: translateY(-12px) rotate(4deg);
      }
    }

    .exercise-card {
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      padding: 15px;
      margin-bottom: 12px;
    }

    .exercise-grid {
      display: grid;
      grid-template-columns: repeat(2,1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .diet-food-row {
      display: grid;
      grid-template-columns: 1fr 90px 40px;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .calorie-summary {
      padding: 18px;
      border-radius: 18px;
      margin-bottom: 18px;
      background: rgba(139,92,246,.12);
    }

    .calorie-summary strong {
      font-size: 30px;
    }

    .calorie-progress {
      height: 10px;
      border-radius: 20px;
      overflow: hidden;
      background: rgba(255,255,255,.1);
      margin-top: 12px;
    }

    .calorie-progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg,#22c55e,#facc15,#ef4444);
    }

    .goal-subtasks {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .goal-subtask {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 8px 0;
    }

    .period-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 10px;
      background: rgba(139,92,246,.15);
    }

    .photo-preview {
      display: flex;
      justify-content: center;
      margin-bottom: 15px;
    }

    .profile-photo-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(139,92,246,.5);
    }

    .profile-photo-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 36px;
      background: rgba(139,92,246,.18);
    }

    .link-button {
      color: #8b5cf6;
      text-decoration: none;
    }

    .shopping-diet-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 15px 0;
    }

    .muted {
      opacity: .7;
    }

    .danger-button {
      border: 0; border-radius: 12px; padding: 11px 15px; cursor: pointer;
      background: #d6455d; color: #fff; font-weight: 700;
    }
    .confirm-delete-box { text-align:center; padding: 8px 0 4px; }
    .confirm-delete-icon { font-size: 38px; margin-bottom: 8px; }
    .confirm-delete-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:16px; }
    .cycle-summary-card { display:flex; justify-content:space-between; gap:18px; align-items:center; padding:24px; border-radius:20px; background:linear-gradient(135deg,rgba(139,92,246,.18),rgba(236,72,153,.12)); border:1px solid rgba(255,255,255,.08); margin-bottom:18px; }
    .cycle-orbit { width:82px; height:82px; border-radius:50%; display:grid; place-items:center; font-size:46px; background:rgba(255,255,255,.06); }
    .cycle-cross-links { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .cycle-cross-links span { padding:9px 12px; border-radius:999px; background:rgba(255,255,255,.05); }
  
    /* AUTENTICAÇÃO — proteção visual para o primeiro carregamento */
    .auth-loading,
    .auth-screen {
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      box-sizing: border-box;
      background: #070C22;
      color: #fff;
      font-family: Inter, Arial, sans-serif;
    }

    .auth-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .auth-loading-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      color: rgba(255,255,255,.86);
    }

    .auth-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(255,255,255,.18);
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: lidire-spin .8s linear infinite;
    }

    @keyframes lidire-spin {
      to { transform: rotate(360deg); }
    }

    .auth-screen {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      overflow: auto;
    }

    .auth-glow {
      position: fixed;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: rgba(139,92,246,.16);
      filter: blur(70px);
      pointer-events: none;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: min(100%, 440px);
      box-sizing: border-box;
      padding: 28px;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 24px;
      background: rgba(15,23,52,.94);
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
    }

    .auth-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      font-size: 22px;
    }

    .auth-brand img {
      width: 42px;
      height: 42px;
      object-fit: contain;
    }

    .auth-title {
      margin: 8px 0;
      color: #fff;
    }

    .auth-subtitle {
      color: rgba(255,255,255,.68);
      line-height: 1.5;
      margin-bottom: 22px;
    }

    .auth-form {
      display: grid;
      gap: 15px;
    }

    .auth-field {
      display: grid;
      gap: 7px;
    }

    .auth-field > span {
      font-size: 13px;
      color: rgba(255,255,255,.78);
    }

    .auth-field input {
      width: 100%;
      box-sizing: border-box;
      min-height: 46px;
      padding: 12px 14px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 12px;
      background: rgba(255,255,255,.06);
      color: #fff;
      outline: none;
    }

    .auth-field input:focus {
      border-color: rgba(139,92,246,.8);
    }

    .auth-password {
      position: relative;
    }

    .auth-password input {
      padding-right: 48px;
    }

    .auth-toggle-password {
      position: absolute;
      right: 7px;
      top: 50%;
      transform: translateY(-50%);
      border: 0;
      background: transparent;
      color: rgba(255,255,255,.7);
      cursor: pointer;
      padding: 8px;
    }

    .auth-check {
      display: flex;
      gap: 9px;
      align-items: flex-start;
      color: rgba(255,255,255,.72);
      font-size: 12px;
      line-height: 1.4;
    }

    .auth-check a {
      color: #c4b5fd;
    }

    .auth-error,
    .auth-success {
      padding: 11px 12px;
      border-radius: 10px;
      margin-bottom: 14px;
      font-size: 13px;
    }

    .auth-error {
      background: rgba(239,68,68,.12);
      color: #fecaca;
    }

    .auth-success {
      background: rgba(34,197,94,.12);
      color: #bbf7d0;
    }

    .auth-submit {
      width: 100%;
      min-height: 46px;
    }

    .auth-switch {
      margin: 20px 0 0;
      text-align: center;
      color: rgba(255,255,255,.65);
      font-size: 13px;
    }

    .auth-switch button {
      border: 0;
      background: transparent;
      color: #c4b5fd;
      font-weight: 700;
      cursor: pointer;
    }
`;

  style.textContent += `
    .shopping-list-card { position:relative; display:flex; align-items:center; gap:8px; border:1px solid var(--border-color,rgba(120,120,120,.22)); border-radius:14px; padding:6px 8px; min-width:0; }
    .shopping-list-card.active { border-color:var(--primary,#7c3aed); background:rgba(124,58,237,.07); }
    .shopping-list-select { padding:10px 8px; border:0; background:transparent; text-align:left; flex:1; min-width:0; cursor:pointer; color:inherit; }
    .shopping-list-main { display:flex; flex-direction:column; gap:3px; min-width:0; }
    .shopping-list-main strong { overflow-wrap:anywhere; }
    .shopping-list-main small { opacity:.7; font-size:12px; }
    .shopping-list-actions { display:flex; gap:4px; flex-shrink:0; }
    .shopping-list-actions button { border:0; background:transparent; cursor:pointer; min-width:34px; min-height:34px; border-radius:8px; }
    .shopping-list-actions button:hover { background:rgba(120,120,120,.12); }
    .shopping-list-manage { display:flex; flex-direction:column; gap:8px; margin:12px 0; }
`;
  document.head.appendChild(style);
}

injectLiDireStyles();

/* =========================================================
   MÓDULOS
   ========================================================= */

const modules = [
  ["agenda", "Agenda", "Compromissos e horários", "calendar", "agenda"],
  ["tarefas", "Tarefas", "Tudo o que precisa ser feito", "check", "tarefas"],
  ["compras", "Compras", "Listas para não esquecer", "cart", "compras"],
  ["estudos", "Estudos", "Organize seu aprendizado", "book", "estudos"],
  ["treinos", "Treinos", "Movimente-se e acompanhe", "dumbbell", "treinos"],
  ["hidratacao", "Hidratação", "Cuide da sua rotina", "drop", "hidratacao"],
  ["alimentacao", "Alimentação", "Refeições, dieta e calorias", "food", "alimentacao"],
  ["financas", "Finanças", "Entradas, gastos e limites", "wallet", "financas"],
  ["objetivos", "Objetivos", "Transforme planos em passos", "target", "objetivos"],
  ["familia", "Família", "Compartilhe sua rotina", "family", "familia"],
  ["cicloMenstrual", "Ciclo Menstrual", "Acompanhe seu ciclo e seus sinais", "cycle", "cicloMenstrual"],
  ["climaRotas", "Clima e Rotas", "Temperatura, previsão e deslocamentos", "compass", "climaRotas"],
  ["suporte", "Suporte", "Ajuda, bugs e contato", "spark", "suporte"]
];

/* =========================================================
   SHELL
   ========================================================= */

function appShell(content) {
  const nav = [
    ["inicio", icon("home"), "Início"],
    ["agenda", icon("calendar"), "Agenda"],
    ["assistente", icon("spark"), "Assistente"],
    ["explorar", icon("search"), "Explorar"],
    ["perfil", icon("user"), "Perfil"]
  ];

  return `
    <div class="app-bg">

      <header class="topbar">

        <button class="brand" data-page="inicio">
          <img src="/logo-lidire-oficial.png" alt="LiDire">
          <span>LiDire</span>
        </button>

        <div class="topbar-actions">
          <button class="avatar" data-page="perfil">
            ${
              state.user.photo
                ? `<img src="${esc(state.user.photo)}" alt="Perfil">`
                : esc((state.user.name || "A").charAt(0).toUpperCase())
            }
          </button>
          <button class="icon-button lidire-global-search-button" data-action="open-global-search" title="Pesquisar no aplicativo" aria-label="Pesquisar no aplicativo">${icon("search")}</button>
          <button class="icon-button" data-action="go-back" title="Voltar" aria-label="Voltar">${icon("back")}</button>
        </div>

      </header>

      <main class="main-content">
        ${content}
        <!-- Painéis de recursos compartilhados por terceiros removidos das abas individuais. -->
      </main>

      <nav class="bottom-nav">
        ${nav.map(([id, ico, label]) => `
          <button
            class="nav-item ${currentPage === id ? "active" : ""}"
            data-page="${id}"
          >
            <span>${ico}</span>
            <small>${label}</small>
          </button>
        `).join("")}
      </nav>

    </div>
  `;
}

function pageHeader(eyebrow, title, subtitle = "", action = "") {
  return `
    <div class="page-header">

      <div>
        <div class="eyebrow">${esc(eyebrow)}</div>
        <h1>${esc(title)}</h1>

        ${
          subtitle
            ? `<p>${esc(subtitle)}</p>`
            : ""
        }
      </div>

      ${action}

    </div>
  `;
}

function statCard(value, label, tone = "") {
  return `
    <div class="stat-card ${tone}">
      <strong>${esc(value)}</strong>
      <span>${esc(label)}</span>
    </div>
  `;
}

function emptyState(title, text, actionLabel, action) {
  return `
    <div class="empty-state">
      <div class="empty-orb">✦</div>

      <h3>${esc(title)}</h3>

      <p>${esc(text)}</p>

      <button
        class="primary-button"
        data-action="${esc(action)}"
      >
        ${icon("plus")} ${esc(actionLabel)}
      </button>
    </div>
  `;
}

/* =========================================================
   5.1 — clima, hidratação personalizada, pomodoro e receitas IA
   ========================================================= */
function getWeatherLabel(){
  const w=state.settings.weather||{};
  if(w.source === "open-meteo" && w.available && Number.isFinite(Number(w.tempC))) return `${Math.round(Number(w.tempC))}°C`;
  return "Temperatura indisponível";
}
let weatherLoading=false;
async function loadRealWeather(){
  if(weatherLoading) return;
  // A 6.8 nunca exibe uma temperatura antiga/fictícia: somente um valor
  // obtido nesta sessão a partir da localização atual do dispositivo.
  state.settings.weather={tempC:null,fetchedAt:0,available:false,source:"none"};
  const el=document.getElementById("lidire-weather");
  if(el) el.textContent="🌡️ Obtendo temperatura local…";
  if(!navigator.geolocation){
    if(el) el.textContent="🌡️ Temperatura indisponível";
    return;
  }
  weatherLoading=true;
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat=pos.coords.latitude, lon=pos.coords.longitude;
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m&timezone=auto`,{cache:"no-store"});
      if(!r.ok) throw new Error(`Weather HTTP ${r.status}`);
      const d=await r.json();
      const temp=d?.current?.temperature_2m;
      if(!Number.isFinite(Number(temp))) throw new Error("Temperatura não retornada");
      state.settings.weather={tempC:Number(temp),fetchedAt:Date.now(),available:true,source:"open-meteo",latitude:lat,longitude:lon};
      saveState();
      const current=document.getElementById("lidire-weather");
      if(current) current.textContent=`🌡️ ${Math.round(Number(temp))}°C`;
    }catch(e){
      console.warn("Weather unavailable",e);
      state.settings.weather={tempC:null,fetchedAt:Date.now(),available:false,source:"none"};
      saveState();
      const current=document.getElementById("lidire-weather");
      if(current) current.textContent="🌡️ Temperatura indisponível";
    } finally{weatherLoading=false;}
  },()=>{
    state.settings.weather={tempC:null,fetchedAt:Date.now(),available:false,source:"none"};
    saveState();
    const current=document.getElementById("lidire-weather");
    if(current) current.textContent="🌡️ Temperatura indisponível";
    weatherLoading=false;
  },{enableHighAccuracy:true,maximumAge:0,timeout:10000});
}
function calculateHydrationRecommendation(){
  const p=state.settings.hydrationProfile||{}; const sex=String(p.sex||"").toLowerCase(); const age=Number(p.age||state.user.age||0); const weight=Number(p.weight||state.user.weight||0); const activity=p.activity||"moderate"; const goal=p.goal||"health";
  let base = sex==="male" ? 2500 : sex==="female" ? 2000 : 2200;
  if(age>=65) base += 0;
  let ml = weight>0 ? Math.max(base, weight*30) : base;
  if(activity==="active") ml += 400; else if(activity==="very-active") ml += 700; else if(activity==="hot") ml += 500;
  if(goal==="performance") ml += 300; if(goal==="weight-loss") ml += 200;
  ml=Math.round(ml/50)*50;
  const note = false ? `LiDire estimate using adult reference values plus a transparent weight/activity adjustment${weight?` (${weight} kg)`:""}. Research reference values describe total water from beverages and food, and needs can rise with heat and physical activity.` : `Estimativa da LiDire usando valores de referência para adultos e um ajuste transparente por peso/atividade${weight?` (${weight} kg)`:""}. As referências científicas tratam de água total (bebidas + alimentos) e indicam que a necessidade aumenta com atividade física e calor.`;
  return {ml,note};
}
function openHydrationProfile(){
  const p=state.settings.hydrationProfile||{}; const l=false;
  openModal(l?"Hydration profile":"Perfil de hidratação", field(l?"Sex":"Sexo","sex","text",p.sex||"")+field(l?"Age":"Idade","age","number",p.age||state.user.age||"",'min="14" max="120"')+field(l?"Weight (kg)":"Peso (kg)","weight","number",p.weight||state.user.weight||"",'min="30" max="300" step="0.1"')+selectField(l?"Activity":"Atividade","activity",[{value:"moderate",label:l?"Moderate":"Moderada"},{value:"active",label:l?"Active":"Ativa"},{value:"very-active",label:l?"Very active":"Muito ativa"},{value:"hot",label:l?"Hot environment":"Ambiente quente"}],p.activity||"moderate")+selectField(l?"Goal":"Objetivo","goal",[{value:"health",label:l?"General health":"Saúde geral"},{value:"performance",label:l?"Performance":"Performance"},{value:"weight-loss",label:l?"Weight management":"Controle de peso"}],p.goal||"health"),{submit:l?"Save":"Salvar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.settings.hydrationProfile={sex:String(f.get("sex")||""),age:Number(f.get("age")||0),weight:Number(f.get("weight")||0),activity:String(f.get("activity")||"moderate"),goal:String(f.get("goal")||"health")};state.user.age=state.settings.hydrationProfile.age||state.user.age;state.user.weight=state.settings.hydrationProfile.weight||state.user.weight;state.user.sex=state.settings.hydrationProfile.sex||state.user.sex;state.settings.hydrationGoal=calculateHydrationRecommendation().ml;saveState();closeModal();render();};
}
let pomodoroState={remaining:(Number(state.settings.pomodoroMinutes)||25)*60,total:(Number(state.settings.pomodoroMinutes)||25)*60,running:false,interval:null,accumulated:0};
let activeStudySession=null;
function formatPomodoro(sec){const s=Math.max(0,Number(sec)||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function syncPomodoroDisplay(){
  const el=document.getElementById("pomodoro-display");
  if(el)el.textContent=formatPomodoro(pomodoroState.remaining);
  const activeEl=document.getElementById("pomodoro-active-session");
  if(activeEl){
    activeEl.textContent=activeStudySession ? `📚 ${activeStudySession.subject}${activeStudySession.topic ? ` · ${activeStudySession.topic}` : ""} · ${activeStudySession.duration} min` : "";
    activeEl.style.display=activeStudySession ? "block" : "none";
  }
  const totalSeconds=pomodoroHistoryTotal()+(pomodoroState.accumulated||0);
  const focusEl=document.getElementById("pomodoro-focus-total");
  if(focusEl)focusEl.textContent=`${Math.floor(totalSeconds/3600)}h ${Math.floor((totalSeconds%3600)/60)}m`;
  const homeFocusEl=document.getElementById("home-focus-total");
  if(homeFocusEl)homeFocusEl.textContent=`${Math.floor(totalSeconds/3600)}h ${Math.floor((totalSeconds%3600)/60)}m`;
  const pomodoroButton=document.querySelector('[data-action="start-study-focus"]');
  if(pomodoroButton)pomodoroButton.textContent=pomodoroState.running ? "Pausar" : "Iniciar";
}
function ensurePomodoroHistory(){if(!Array.isArray(state.data.pomodoroHistory))state.data.pomodoroHistory=[];return state.data.pomodoroHistory;}
function pomodoroHistoryTotal(){return ensurePomodoroHistory().reduce((s,x)=>s+Math.max(0,Number(x.seconds)||0),0);}
function syncManualStudyHistory(studyId, minutes, dateValue){
  const history=ensurePomodoroHistory();
  const id=String(studyId||"");
  const seconds=Math.max(0,Number(minutes)||0)*60;
  const index=history.findIndex(x=>x.sourceType==="estudo-manual"&&String(x.sourceId)===id);
  if(seconds<=0){ if(index>=0) history.splice(index,1); return; }
  const labelDate=dateValue ? dateBR(dateValue) : new Date().toLocaleString("pt-BR");
  const entry={id:index>=0?history[index].id:uid("pomo-manual"),seconds,date:dateValue||new Date().toISOString(),dateLabel:`Estudo manual · ${labelDate}`,sourceType:"estudo-manual",sourceId:id};
  if(index>=0) history[index]=entry; else history.push(entry);
}

function recordPomodoroSession(){
  const elapsed=Math.max(0,Math.min(pomodoroState.total,pomodoroState.total-pomodoroState.remaining));
  if(elapsed<1)return;
  const now=new Date();
  ensurePomodoroHistory().push({id:String(Date.now()),seconds:elapsed,date:now.toISOString(),dateLabel:now.toLocaleString("pt-BR"),sourceType:activeStudySession?"study-session":"pomodoro",sourceId:activeStudySession?.id||"",subject:activeStudySession?.subject||"",topic:activeStudySession?.topic||""});
  saveState();
  pomodoroState.accumulated=0;
}
function completeActiveStudySession(){
  if(!activeStudySession)return;
  const plan=(state.data.studyPlans||[]).find(x=>x.id===activeStudySession.planId);
  if(plan){
    updateStudySession(plan,activeStudySession.id,{done:true});
  }
  toast(`Sessão concluída: ${activeStudySession.subject}${activeStudySession.topic?` — ${activeStudySession.topic}`:""}.`);
  activeStudySession=null;
}
function openPomodoroHistory(){
  const rows=ensurePomodoroHistory().slice().reverse();
  const body=rows.length?`<div class="item-list">${rows.map(x=>`<div class="list-item"><div class="module-icon small">🍅</div><div class="item-main"><strong>${Math.floor(Number(x.seconds||0)/60)} min de foco</strong><span>${esc(x.dateLabel||x.date||"")}</span></div><button type="button" class="ghost-button compact" data-action="delete-pomodoro-history" data-id="${esc(x.id)}" aria-label="Excluir registro">🗑</button></div>`).join("")}</div>`:`<p class="muted">Nenhuma sessão registrada ainda.</p>`;
  openModal("Histórico do Pomodoro",`${body}<div style="margin-top:14px"><button type="button" class="ghost-button" data-action="clear-pomodoro-history">🗑 Limpar histórico</button></div>`,{submit:"Fechar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{
    e.preventDefault();
    closeModal();
  };
}

function openPomodoroDetails(){
  const totals={};
  ensurePomodoroHistory().forEach(x=>{
    let subject=String(x.subject||"").trim();
    let topic=String(x.topic||"").trim();
    if(x.sourceType==="estudo-manual" && x.sourceId){
      const study=(state.data.estudos||[]).find(s=>String(s.id)===String(x.sourceId));
      if(study){
        subject=subject||String(study.subject||"").trim();
        topic=topic||String(study.topic||"").trim();
      }
    }
    subject=subject||"Estudo";
    const key=`${subject}||${topic}`;
    if(!totals[key]) totals[key]={subject,topic,seconds:0};
    totals[key].seconds+=Math.max(0,Number(x.seconds)||0);
  });
  if(activeStudySession && (pomodoroState.accumulated||0)>0){
    const subject=String(activeStudySession.subject||"Estudo").trim();
    const topic=String(activeStudySession.topic||"").trim();
    const key=`${subject}||${topic}`;
    if(!totals[key]) totals[key]={subject,topic,seconds:0};
    totals[key].seconds+=Math.max(0,Number(pomodoroState.accumulated)||0);
  }
  const rows=Object.values(totals).filter(x=>x.seconds>0).sort((a,b)=>b.seconds-a.seconds);
  const totalSeconds=rows.reduce((sum,x)=>sum+x.seconds,0);
  const body=rows.length?`<div class="item-list">${rows.map(x=>{
    const minutes=Math.floor(x.seconds/60);
    const extra=x.seconds%60;
    const label=x.topic?`${esc(x.subject)} — ${esc(x.topic)}`:esc(x.subject);
    return `<div class="list-item"><div class="module-icon small">📚</div><div class="item-main"><strong>${label}</strong><span>${minutes} min${extra?` ${extra}s`:""} contabilizados</span></div></div>`;
  }).join("")}</div>`:`<p class="muted">Nenhum assunto teve tempo contabilizado ainda.</p>`;
  const totalLabel=`${Math.floor(totalSeconds/3600)}h ${Math.floor((totalSeconds%3600)/60)}m`;
  openModal("Detalhes do Pomodoro",`${body}<div style="margin-top:14px;padding:12px;border-radius:12px;background:rgba(255,255,255,.04)"><strong>Total contabilizado: ${totalLabel}</strong></div>`,{submit:"Fechar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();closeModal();};
}

function stopPomodoroInterval(){if(pomodoroState.interval){clearInterval(pomodoroState.interval);pomodoroState.interval=null;}}
function togglePomodoro(){
  if(pomodoroState.running){
    pomodoroState.running=false;
    stopPomodoroInterval();
    recordPomodoroSession();
    syncPomodoroDisplay();
    return;
  }
  pomodoroState.running=true;
  pomodoroState.interval=setInterval(()=>{
    pomodoroState.remaining--;
    pomodoroState.accumulated=(pomodoroState.accumulated||0)+1;
    syncPomodoroDisplay();
    if(pomodoroState.remaining<=0){
      pomodoroState.remaining=0;
      pomodoroState.running=false;
      stopPomodoroInterval();
      recordPomodoroSession();
      if(activeStudySession) completeActiveStudySession();
      playLiDireNotificationSound();
      syncPomodoroDisplay();
    }
  },1000);
}
function resetPomodoro(){pomodoroState.running=false;stopPomodoroInterval();pomodoroState.total=(Number(state.settings.pomodoroMinutes)||25)*60;pomodoroState.remaining=pomodoroState.total;pomodoroState.accumulated=0;activeStudySession=null;syncPomodoroDisplay();}
function setPomodoroTime(){const l=false;openModal(l?"Set focus time":"Definir tempo de foco",field(l?"Minutes":"Minutos","minutes","number",state.settings.pomodoroMinutes||25,'min="1" max="180" required'),{submit:l?"Save":"Salvar"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const m=Math.max(1,Math.min(180,Number(new FormData(e.target).get("minutes"))||25));state.settings.pomodoroMinutes=m;saveState();resetPomodoro();closeModal();};}
async function openRecipeGenerator(){
  const l=false; const foods=(state.data.alimentos||[]).map(x=>x.name||x.title).filter(Boolean); const diets=(state.data.dietas||[]).map(x=>x.name).filter(Boolean);
  const body=selectField(l?"Recipe type":"Tipo de receita","recipeType",[{value:"fitness",label:"Fitness"},{value:"savory",label:l?"Savory":"Salgada"},{value:"sweet",label:l?"Sweet":"Doce"},{value:"dessert",label:l?"Dessert":"Sobremesa"},{value:"main",label:l?"Main course":"Prato principal"},{value:"snack",label:l?"Snack":"Petisco"}],"fitness")+selectField(l?"Diet":"Dieta","diet",[{value:"",label:l?"No specific diet":"Sem dieta específica"},...diets.map(x=>({value:x,label:x}))],"")+textareaField(l?"Available foods":"Alimentos cadastrados","foods",foods.join(", "),'placeholder="Ex.: frango, ovos, banana..."');
  openModal(l?"Generate recipe with LiDire AI":"Gerar receita com a IA LiDire",body,{submit:l?"Generate":"Gerar receita"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const type=f.get("recipeType"),diet=f.get("diet"),available=f.get("foods")||"";closeModal();navigateTo("assistente");const q=l?`Create a ${type} recipe using these registered foods: ${available}. Respect this diet if selected: ${diet||"none"}. Include ingredients, quantities, preparation, portions and approximate calories.`:`Crie uma receita do tipo ${type} usando estes alimentos cadastrados: ${available}. Respeite esta dieta, se houver: ${diet||"nenhuma"}. Inclua ingredientes, quantidades, preparo, porções e calorias aproximadas.`;await answerAssistant(q,false);};
}

/* =========================================================
   INÍCIO
   ========================================================= */

function homeRemindersSection() {
  const reminders = Array.isArray(state.data.lembretes) ? [...state.data.lembretes] : [];
  reminders.sort((a,b)=>{
    const ad = `${a.date||""}T${a.time||"23:59"}`;
    const bd = `${b.date||""}T${b.time||"23:59"}`;
    return ad.localeCompare(bd);
  });
  const active = reminders.filter(r=>!r.paused).length;
  const inactive = reminders.length - active;
  return `<section class="v5-home-reminders">
    <div class="v5-section-row v5-home-reminders-head">
      <div><span class="eyebrow">🔔 LEMBRETES</span><h2>Seus lembretes</h2></div>
      <span class="v5-reminder-count">${reminders.length}</span>
    </div>
    ${reminders.length ? `<div class="v5-home-reminder-summary"><span>● ${active} ativos</span><span>○ ${inactive} inativos</span></div>
      <div class="v5-home-reminder-list">${reminders.map(r=>{
        const isActive=!r.paused;
        const repeat=reminderRepeatLabel(r);
        return `<div class="v5-home-reminder-item ${isActive?"is-active":"is-inactive"}">
          <div class="v5-home-reminder-icon">🔔</div>
          <div class="v5-home-reminder-main">
            <strong>${esc(r.title||"Lembrete")}</strong>
            <span>${dateBR(r.date)} · ${esc(r.time||"—")} · ${esc(repeat)}</span>
            ${r.message?`<small>${esc(r.message)}</small>`:""}
          </div>
          <span class="v5-home-reminder-status">${isActive?"Ativo":"Inativo"}</span>
          <div class="v5-home-reminder-actions"><button type="button" data-action="edit-reminder" data-id="${esc(r.id)}" aria-label="Editar lembrete" title="Editar">✎</button><button type="button" data-action="delete-reminder" data-id="${esc(r.id)}" aria-label="Excluir lembrete" title="Excluir">×</button></div>
        </div>`;
      }).join("")}</div>` : `<div class="v5-home-reminder-empty"><span>🔔</span><div><strong>Nenhum lembrete cadastrado</strong><small>Crie lembretes para acompanhar sua rotina.</small></div></div>`}
    <button class="primary-button compact v5-home-reminders-button" data-action="open-notifications">Ver lembretes</button>
  </section>`;
}

function birthdayHomeMessage(){
  const raw=String(state.user?.birth_date||""); if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const today=new Date(); const [y,m,d]=raw.split("-").map(Number);
  if(today.getMonth()+1!==m || today.getDate()!==d) return "";
  const name=String(state.user?.name||"").trim().split(/\s+/)[0];
  return `<section class="v5-ai-suggestion v81-birthday-card"><div class="v5-ai-copy"><span class="eyebrow">UM DIA ESPECIAL</span><h3>Feliz aniversário${name?`, ${esc(name)}`:""}! 🎉</h3><p>Que seu novo ciclo seja cheio de saúde, conquistas e momentos felizes. Estou aqui para ajudar você a organizar seus planos e aproveitar seu dia!</p></div></section>`;
}

function homeDailyConversation({firstName,pending,commitments,water,hydrationGoal,goals}){
  const name=String(firstName||"").trim();
  const hour=new Date().getHours();
  const greeting=hour<12?"Bom dia":hour<18?"Boa tarde":"Boa noite";
  if(commitments>0 && pending>0) return `${greeting}${name?`, ${name}`:""}! Vamos organizar seu dia com calma. Você tem compromissos e tarefas para acompanhar; escolha a prioridade mais importante e eu ajudo você a montar um plano realista.`;
  if(commitments>0) return `${greeting}${name?`, ${name}`:""}! Sua agenda tem compromissos hoje. Reserve um momento para conferir os horários e, se quiser, posso ajudar a organizar o restante do dia.`;
  if(pending>0) return `${greeting}${name?`, ${name}`:""}! Você tem tarefas esperando por você. Vamos escolher uma prioridade e avançar um passo de cada vez? Estou aqui para ajudar.`;
  if(water<hydrationGoal) return `${greeting}${name?`, ${name}`:""}! Por enquanto, sua rotina parece tranquila. Confira sua hidratação e veja se há algum objetivo que você queira priorizar hoje.`;
  if(goals>0) return `${greeting}${name?`, ${name}`:""}! Que bom ter um momento para cuidar dos seus objetivos. Posso ajudar você a transformar uma meta em pequenos passos para hoje.`;
  return `${greeting}${name?`, ${name}`:""}! Estou aqui para ajudar você a organizar compromissos, tarefas e objetivos. O que é mais importante para você hoje?`;
}
function formatInvitationDate(value){
  const raw=String(value||"").trim();
  if(!raw) return "Data não disponível";
  // D1/SQLite CURRENT_TIMESTAMP é UTC e chega como "YYYY-MM-DD HH:mm:ss" sem sufixo.
  // Interpretar explicitamente como UTC e apresentar no fuso local de Brasília.
  let normalized=raw;
  const sqliteMatch=raw.match(/^(\d{4}-\d{2}-\d{2})[ ](\d{2}:\d{2}(?::\d{2})?)$/);
  if(sqliteMatch) normalized=`${sqliteMatch[1]}T${sqliteMatch[2]}Z`;
  const date=new Date(normalized);
  if(Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("pt-BR",{
    timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
  }).format(date).replace(","," às");
}

function formatFamilyNotificationDate(value){
  const raw=String(value||"").trim();
  if(!raw) return "Data não disponível";
  // Datas do SQLite chegam como YYYY-MM-DD HH:mm:ss; interpretar sem converter fuso.
  const match=raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if(match) return `${match[3]}/${match[2]}/${match[1]}${match[4]?` às ${match[4]}:${match[5]}${match[6]?`:${match[6]}`:""}`:""}`;
  const date=new Date(raw);
  if(Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"medium"}).format(date);
}
function homeFamilyNotificationsSection(){
  const notes=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
  const unread=notes.filter(n=>!n.read_at).length;
  const groups=Array.isArray(state.data.grupos)?state.data.grupos:[];
  const groupInvites=groups.reduce((n,g)=>n+(g.invitations||[]).filter(i=>i.status==="new"||i.status==="pending").length,0);
  const groupLDs=Array.isArray(state.data.notificacoesGrupos)?state.data.notificacoesGrupos.filter(n=>!n.read_at&&n.status!=="deleted").length:0;
  const types=[
    {id:"familia",label:"FAMÍLIA",count:unread,available:true},
    {id:"grupos",label:"GRUPOS",count:groupInvites+groupLDs,available:true},
    {id:"lidire",label:"LIDIRE",count:0,available:false}
  ];
  return `<section class="v93-ld-hub"><div class="v93-ld-heading"><h2>Suas LD's <img src="/lidire-simbolo-coracao.png" alt="" aria-hidden="true"></h2></div><div class="v93-ld-types">${types.map(t=>`<button type="button" class="v93-ld-type${t.count>0?' has-unread':''}" data-action="open-ld-type" data-ld-type="${t.id}" aria-label="Abrir LDs de ${t.label}, ${t.count} não visualizadas"><span>${t.label}</span><strong>${t.count}</strong></button>`).join("")}</div></section>`;
}

function calculateHomeProductivity() {
  // Produtividade consolidada dos seis módulos solicitados: tarefas, estudos,
  // treinos, objetivos, compras e agenda. Cada registro/item conta uma vez.
  const tasks = Array.isArray(state.data.tarefas) ? state.data.tarefas : [];
  // O módulo atual de estudos usa studyPlans e sessões com conclusão salva
  // em sessionOverrides; state.data.estudos contém registros legados/manuais.
  const legacyStudies = Array.isArray(state.data.estudos) ? state.data.estudos : [];
  const studyPlans = Array.isArray(state.data.studyPlans) ? state.data.studyPlans : [];
  const plannedStudySessions = studyPlans.flatMap(plan =>
    typeof studyPlanSessions === "function" ? studyPlanSessions(plan).map(session => !!session.done) : []
  );
  const manualStudies = legacyStudies.map(item => {
    const history = Array.isArray(item.history) ? item.history : [];
    const minutes = Number(item.effectiveDuration || item.duration || 0);
    return !!item.done || history.length > 0 || minutes > 0;
  });
  const studies = [...plannedStudySessions, ...manualStudies];
  const workouts = Array.isArray(state.data.treinos) ? state.data.treinos : [];
  const goals = Array.isArray(state.data.objetivos) ? state.data.objetivos : [];
  const shoppingLists = Array.isArray(state.data.compras) ? state.data.compras : [];
  const appointments = Array.isArray(state.data.compromissos) ? state.data.compromissos : [];
  const activeShoppingLists = shoppingLists.filter(list => !list.saved && !list.archived);
  const entries = [
    ...tasks.map(item => !!item.done),
    ...studies,
    ...workouts.map(item => !!item.completed || !!item.done),
    ...goals.map(item => Math.max(0, Number(item.progress ?? item.percent ?? 0)) >= 100),
    ...activeShoppingLists.map(list => (Array.isArray(list.items) && list.items.length > 0) ? list.items.every(item => !!item.done) : false),
    ...appointments.map(item => !!item.done || !!item.completed)
  ];
  const total = entries.length;
  const completed = entries.filter(Boolean).length;
  return { total, completed, percent: total ? Math.round(completed / total * 100) : 0 };
}

function home() {
  const pending = state.data.tarefas.filter((x) => !x.done).length;
  const totalTasks = state.data.tarefas.length;
  const doneTasks = totalTasks - pending;
  const productivity = calculateHomeProductivity();
  const completionPct = productivity.percent;
  const commitments = state.data.compromissos.filter((x) => x.date === todayISO()).length;
  const goals = state.data.objetivos.length;
  const water = state.data.hidratacao.filter(x=>x.date===todayISO()).reduce((s,x)=>s+Number(x.amount||0),0);
  const firstName = (state.user.name || (false ? "you" : "você")).split(" ")[0];
  const lang = false;
  const next = state.data.compromissos.filter(x=>x.date===todayISO()).sort((a,b)=>String(a.time||"").localeCompare(String(b.time||"")))[0];
  const family = (state.data.familia||[]).filter(x=>x.inviteStatus!=="declined").slice(0,3);
  const hydrationGoal = Number(state.settings.hydrationGoal||2000);
  const hydrationPct = Math.min(100, Math.round(water/hydrationGoal*100));
  return appShell(`
    <section class="v5-home-summary">
      <div class="v5-summary-top"><div><span class="eyebrow" aria-hidden="true"></span><h1>${lang?`Hello, ${esc(firstName)}.`:`Olá, ${esc(firstName)}.`}</h1><p>${lang?"Here is what matters in your routine today.":"Aqui está o que importa na sua rotina hoje."}</p></div><span class="v5-weather" id="lidire-weather">🌡️ ${getWeatherLabel()}</span></div>
      <div class="v5-kpis"><div><small>${lang?"PRODUCTIVITY":"PRODUTIVIDADE"}</small><strong>${completionPct}%</strong><span class="v5-kpi-detail">${productivity.completed}/${productivity.total} concluídos</span></div><div><small>${lang?"TASKS":"TAREFAS"}</small><strong>${doneTasks}/${totalTasks}</strong></div><div><small>${lang?"FOCUS":"FOCO"}</small><strong id="home-focus-total">${Math.floor((pomodoroHistoryTotal()+(pomodoroState.accumulated||0))/3600)}h ${Math.floor(((pomodoroHistoryTotal()+(pomodoroState.accumulated||0))%3600)/60)}m</strong></div></div>
    </section>
    ${next?`<section class="v5-next-card"><span class="v5-label">${lang?"NEXT":"PRÓXIMO"}</span><h2>${esc(next.title||next.name||"Compromisso")}</h2><p>◷ ${esc(next.time||"—")} ${next.endTime?`- ${esc(next.endTime)}`:""}</p><button class="primary-button compact" data-page="agenda">▣ ${lang?"Open calendar":"Abrir agenda"}</button></section>`:""}
    ${birthdayHomeMessage()}
    <section class="v5-section-head"><span>✦</span><h2>LIDIRE DO DIA</h2></section>
    <section class="v5-ai-suggestion v80-daily-conversation"><div class="v5-ai-copy"><h3>${esc(homeDailyConversation({firstName,pending,commitments,water,hydrationGoal,goals}))} 💜</h3><p>${commitments ? `Você tem ${commitments} compromisso${commitments===1?"":"s"} na agenda de hoje.` : "Sua agenda não tem compromissos cadastrados para hoje."} ${pending ? `Ainda há ${pending} tarefa${pending===1?" pendente":"s pendentes"} para organizar.` : "Você não tem tarefas pendentes cadastradas."}</p><button type="button" class="v80-ask-lidire-button" data-page="assistente" aria-label="Pedir ajuda à LiDire">✦ PEDIR AJUDA À LIDIRE</button></div></section>
    <section class="v5-hydration-card"><div class="v5-round-icon">💧</div><div><strong>${lang?"Time to hydrate":"Hora de hidratar"}</strong><p>${lang?`You've had ${water} ml. Goal: ${hydrationGoal} ml.`:`Você bebeu ${water} ml. Meta: ${hydrationGoal} ml.`}</p><div class="v5-progress"><span style="width:${hydrationPct}%"></span></div></div><button class="primary-button compact" data-page="hidratacao">${lang?"View":"Ver"}</button></section>
    ${renderFamilyMemberUpdates({onlyWhenPresent:true})}
    <section id="gmail-daily-summary" class="v5-settings-card" style="display:none"><h3>✉️ E-mails que precisam de atenção</h3><div id="gmail-daily-summary-items"></div></section>
    ${homeRemindersSection()}
  `);
}

/* =========================================================
   COMPRAS
   ========================================================= */

function consolidateShoppingItems(items) {
  const out=[]; const index=new Map();
  for(const item of (Array.isArray(items)?items:[])) {
    const name=String(item.name||item.title||"").trim().toLocaleLowerCase("pt-BR");
    const category=String(item.category||"").trim().toLocaleLowerCase("pt-BR");
    const unit=normalizeShoppingUnit(item.unit||"");
    const key=[name,category,unit].join("::");
    const previous=index.get(key);
    if(previous && previous.done===!!item.done) {
      const a=Number(String(previous.quantityValue??previous.quantity??"").replace(",","."));
      const b=Number(String(item.quantityValue??item.quantity??"").replace(",","."));
      if(Number.isFinite(a)&&Number.isFinite(b)&&String(previous.quantityValue??previous.quantity??"").trim()!==""&&String(item.quantityValue??item.quantity??"").trim()!=="") {
        const total=a+b; previous.quantity=String(formatShoppingNumber(total)); previous.quantityValue=total;
      } else { out.push({...item,id:item.id||uid("item")}); }
    } else { const copy={...item,id:item.id||uid("item"),unit}; out.push(copy); if(!previous)index.set(key,copy); }
  }
  return out;
}

function compras() {
  const allLists = Array.isArray(state.data.compras) ? state.data.compras : [];
  const listas = allLists.filter(x => !x.saved && !x.archived);
  const savedLists = allLists.filter(x => !!x.saved || !!x.archived);
  const lang = false;
  const expanded = listas.find(x => x.id === expandedShoppingListId) || null;
  const mergeControls = listas.length >= 2 ? `
    <section class="shopping-merge-panel">
      <div class="shopping-merge-head"><div><strong>🔗 Juntar listas</strong><small>Selecione duas ou mais listas para transformá-las em uma única lista.</small></div><button type="button" class="primary-button compact" data-action="merge-shopping-lists">Juntar selecionadas</button></div>
      <div class="shopping-merge-options">${listas.map(x=>`<label class="shopping-merge-option"><input type="checkbox" class="shopping-merge-check" value="${esc(x.id)}" aria-label="Selecionar ${esc(x.name)}"><span class="shopping-merge-checkmark">✓</span><span class="shopping-merge-info"><strong>${esc(x.name)}</strong><small>${(x.items||[]).length} ${(x.items||[]).length===1?"item":"itens"}</small></span></label>`).join("")}</div>
    </section>` : "";
  const dateLabel = x => { const raw=x.createdAt||x.created_at||x.created||x.dateCreated; if(!raw)return ""; const d=new Date(raw); return Number.isNaN(d.getTime())?"":d.toLocaleDateString("pt-BR"); };
  const listCard = x => `<div class="shopping-list-card"><button type="button" class="shopping-list-select" data-action="toggle-shopping-list" data-id="${esc(x.id)}" aria-expanded="${expandedShoppingListId===x.id}"><span class="shopping-list-main"><strong>${esc(x.name)}</strong><small>${(x.items||[]).length} ${(x.items||[]).length===1?"item":"itens"}${dateLabel(x)?` · ${dateLabel(x)}`:""}</small></span></button><div class="shopping-list-actions"><button type="button" data-action="edit-lista-compras" data-id="${esc(x.id)}" title="Editar nome da lista" aria-label="Editar nome da lista">✎</button><button type="button" class="shopping-save-label" data-action="save-shopping-list" data-id="${esc(x.id)}" title="Salvar no histórico" aria-label="Salvar lista no histórico">Salvar</button><button type="button" data-action="delete-lista-compras" data-id="${esc(x.id)}" title="Excluir lista" aria-label="Excluir lista">🗑</button></div></div>`;
  const expandedPanel = expanded ? `<section class="v5-list-section shopping-expanded-list"><div class="v5-section-row"><h2>${esc(expanded.name)}</h2><div class="shopping-expanded-actions"><span class="v5-count">${(expanded.items||[]).filter(x=>!x.done).length} pendentes</span><button type="button" class="ghost-button compact" data-action="mark-all-shopping-items" data-id="${esc(expanded.id)}">Marcar todos</button><button type="button" class="primary-button compact" data-action="add-item-compra" data-id="${esc(expanded.id)}">＋ Item</button></div></div>${(expanded.items||[]).length?(expanded.items||[]).map(item=>`<div class="list-item ${item.done?"completed":""}"><button type="button" class="check-button ${item.done?"checked":""}" data-action="toggle-item-compra" data-list-id="${esc(expanded.id)}" data-id="${esc(item.id)}">${item.done?"✓":""}</button><div class="item-main"><strong>${esc(item.name||item.title||"Item")}</strong><span>${esc(formatShoppingQuantity(item))}${item.category?` · ${esc(item.category)}`:""}</span></div><div class="item-actions"><button type="button" data-action="edit-item-compra" data-list-id="${esc(expanded.id)}" data-id="${esc(item.id)}" aria-label="Editar item">✎</button><button type="button" data-action="delete-item-compra" data-list-id="${esc(expanded.id)}" data-id="${esc(item.id)}" aria-label="Excluir item">⌫</button></div></div>`).join(""):`<div class="empty-state"><p>Nenhum item nesta lista.</p><button type="button" class="primary-button" data-action="add-item-compra" data-id="${esc(expanded.id)}">Adicionar item</button></div>`}</section>` : "";
  const savedSection = savedLists.length ? `<section class="shopping-saved-history"><h2>Listas salvas</h2>${savedLists.map(x=>`<div class="shopping-list-card"><button type="button" class="shopping-list-select" data-action="toggle-shopping-list" data-id="${esc(x.id)}"><span class="shopping-list-main"><strong>${esc(x.name)}</strong><small>${(x.items||[]).length} itens${dateLabel(x)?` · ${dateLabel(x)}`:""}</small></span></button><div class="shopping-list-actions"><button type="button" data-action="restore-shopping-list" data-id="${esc(x.id)}" title="Restaurar lista" aria-label="Restaurar lista">↩</button><button type="button" data-action="delete-lista-compras" data-id="${esc(x.id)}" title="Excluir lista" aria-label="Excluir lista">🗑</button></div></div>${expandedShoppingListId===x.id?`<div class="shopping-saved-items">${(x.items||[]).map(i=>`<div class="list-item"><div class="item-main"><strong>${esc(i.name||i.title||"Item")}</strong><span>${esc(formatShoppingQuantity(i))}${i.category?` · ${esc(i.category)}`:""}</span></div></div>`).join("")}</div>`:""}`).join("")}</section>` : "";
  return appShell(`
    ${pageHeader("COMPRAS", "Lista de Compras", "Mantenha suas compras organizadas em um só lugar.", `<div class="shopping-top-actions"><button class="primary-button compact" data-action="add-compras">${icon("plus")} Nova lista</button><button class="primary-button compact" data-action="show-saved-shopping-lists">Listas salvas</button><button class="primary-button compact" data-action="open-notifications">🔔 Lembrete</button></div>`)}
    ${listas.length ? `<div class="shopping-list-tabs shopping-list-manage">${listas.map(listCard).join("")}</div>` : `<div class="empty-state"><div class="empty-orb">🛒</div><h3>Nenhuma lista ativa</h3><p>Crie uma lista de compras para começar.</p><button class="primary-button" data-action="add-compras">＋ Nova lista</button></div>`}
    ${mergeControls}
    ${expandedPanel}
  `);
}
function comprasSalvas() {
  const allLists = Array.isArray(state.data.compras) ? state.data.compras : [];
  const savedLists = allLists.filter(x => !!x.saved || !!x.archived);
  const dateLabel = x => { const raw=x.createdAt||x.created_at||x.created||x.dateCreated; if(!raw)return ""; const d=new Date(raw); return Number.isNaN(d.getTime())?"":d.toLocaleDateString("pt-BR"); };
  return appShell(`
    ${pageHeader("COMPRAS", "Listas salvas", "Histórico das listas que você decidiu guardar.", `<button type="button" class="ghost-button compact" data-action="back-to-shopping">← Voltar às compras</button>`)}
    ${savedLists.length ? `<section class="shopping-saved-history shopping-saved-page">${savedLists.map(x=>`<div class="shopping-list-card"><button type="button" class="shopping-list-select" data-action="toggle-shopping-list" data-id="${esc(x.id)}"><span class="shopping-list-main"><strong>${esc(x.name)}</strong><small>${(x.items||[]).length} ${(x.items||[]).length===1?"item":"itens"}${dateLabel(x)?` · ${dateLabel(x)}`:""}</small></span></button><div class="shopping-list-actions"><button type="button" data-action="restore-shopping-list" data-id="${esc(x.id)}" title="Restaurar lista" aria-label="Restaurar lista">↩</button><button type="button" data-action="delete-lista-compras" data-id="${esc(x.id)}" title="Excluir lista" aria-label="Excluir lista">🗑</button></div></div>${expandedShoppingListId===x.id?`<div class="shopping-saved-items">${(x.items||[]).map(i=>`<div class="list-item"><div class="item-main"><strong>${esc(i.name||i.title||"Item")}</strong><span>${esc(formatShoppingQuantity(i))}${i.category?` · ${esc(i.category)}`:""}</span></div></div>`).join("")}</div>`:""}`).join("")}</section>` : `<div class="empty-state"><div class="empty-orb">📁</div><h3>Nenhuma lista salva</h3><p>As listas que você salvar aparecerão aqui.</p><button type="button" class="primary-button" data-action="back-to-shopping">Voltar às compras</button></div>`}
  `);
}

function listaCompras(id) {
  const lista =
    state.data.compras.find(
      x => x.id === id
    );

  if (!lista) {
    currentPage = "compras";
    currentShoppingList = null;
    render();
    return "";
  }

  const items = lista.items || [];

  const done =
    items.filter(x => x.done).length;

  return appShell(`

    <div class="shopping-back">

      <button
        class="text-button"
        data-action="back-compras"
      >
        ${icon("back")} Voltar para listas de compras
      </button>

    </div>

    ${pageHeader(
      "LISTA DE COMPRAS",
      lista.name,
      `${items.length} ${
        items.length === 1 ? "item" : "itens"
      } · ${done} concluído${done === 1 ? "" : "s"}`,
      `
        <button
          class="primary-button compact"
          data-action="add-item-compra"
          data-id="${lista.id}"
        >
          ${icon("plus")} Adicionar item
        </button>
      `
    )}

    <div class="shopping-diet-actions">

      <button
        class="ghost-button"
        data-action="lista-dieta-para-compras"
        data-id="${lista.id}"
      >
        🍽 Importar alimentos da dieta
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          ${done}/${items.length} concluídos
        </div>

      </div>

      ${
        items.length
          ? `
            <div class="item-list">

              ${items.map(item => `

                <div
                  class="list-item ${
                    item.done ? "completed" : ""
                  }"
                >

                  <button
                    class="check-button ${
                      item.done ? "checked" : ""
                    }"
                    data-action="toggle-item-compra"
                    data-list-id="${lista.id}"
                    data-id="${item.id}"
                  >
                    ${item.done ? "✓" : ""}
                  </button>

                  <div class="item-main">

                    <strong>
                      ${esc(item.name)}
                    </strong>

                    <span>

                      ${
                        formatShoppingQuantity(item)
                          ? esc(formatShoppingQuantity(item))
                          : ""
                      }

                      ${
                        item.category
                          ? ` · ${esc(item.category)}`
                          : ""
                      }

                    </span>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="edit-item-compra"
                      data-list-id="${lista.id}"
                      data-id="${item.id}"
                      title="Editar item"
                    >
                      ${icon("edit")}
                    </button>

                    <button
                      data-action="delete-item-compra"
                      data-list-id="${lista.id}"
                      data-id="${item.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : `
            <div class="empty-state">

              <div class="empty-orb">
                🛒
              </div>

              <h3>Lista vazia</h3>

              <p>
                Adicione o primeiro item desta lista.
              </p>

              <button
                class="primary-button"
                data-action="add-item-compra"
                data-id="${lista.id}"
              >
                ${icon("plus")} Adicionar item
              </button>

            </div>
          `
      }

    </div>

  `);
}

/* =========================================================
   ESTUDOS
   ========================================================= */


function ensureStudySessionOverrides(plan){
  if(!plan.sessionOverrides || typeof plan.sessionOverrides !== "object" || Array.isArray(plan.sessionOverrides)) plan.sessionOverrides={};
  return plan.sessionOverrides;
}

function applyStudySessionOverride(plan, session){
  const overrides=ensureStudySessionOverrides(plan);
  const o=overrides[session.id];
  return o ? {...session,...o} : session;
}

// Quantos assuntos da matéria entram em cada dia de estudo.
// Sem configuração (planejamentos antigos) = 1 por dia, em rodízio; 0 = todos os assuntos todos os dias.
function studySubjectTopicsPerDay(subject){
  const topics = Array.isArray(subject?.topics) ? subject.topics : [];
  if (!topics.length) return 1;
  const raw = subject?.topicsPerDay;
  if (raw === 0 || raw === "0") return topics.length;
  const n = Math.floor(Number(raw));
  return Math.min(topics.length, Math.max(1, Number.isFinite(n) && n > 0 ? n : 1));
}

function studyPlanSessions(plan, includeDeleted=false) {
  if (!plan || !plan.startDate || !plan.endDate) return [];
  const subjects = Array.isArray(plan.subjects) ? plan.subjects : [];
  if (!subjects.length) return [];
  const start = new Date(`${plan.startDate}T00:00:00`);
  const end = new Date(`${plan.endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const topicIndexes = {};
  const sessions = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    subjects.forEach(subject => {
      const days = Array.isArray(subject.weekdays) ? subject.weekdays.map(Number) : [];
      if (!days.includes(weekday)) return;
      const topics = Array.isArray(subject.topics) ? subject.topics : [];
      const subjectId = String(subject.id || subject.name || "study-subject");
      const perDay = studySubjectTopicsPerDay(subject);
      const index = topicIndexes[subjectId] || 0;
      topicIndexes[subjectId] = index + perDay;
      const localSessionDate = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;
      for (let slot = 0; slot < perDay; slot++) {
        const topic = topics.length ? topics[(index + slot) % topics.length] : null;
        const legacyId = `${plan.id || "plan"}-${localSessionDate}-${subjectId}`;
        // O primeiro assunto do dia mantém o id antigo (preserva "concluído" já registrado);
        // os demais assuntos do mesmo dia ganham o id do próprio assunto.
        const sessionId = slot === 0 ? legacyId : `${legacyId}-${String(topic?.id || slot)}`;
        // Com mais de um assunto no dia, vale o tempo de cada assunto; com um só, o tempo da matéria (como antes).
        const topicMinutes = Number(topic?.duration);
        const duration = perDay > 1 && topicMinutes > 0 ? Math.max(1, topicMinutes) : Math.max(1, Number(subject.duration) || 30);
        const base = {
          id: sessionId,
          date: localSessionDate,
          subject: String(subject.name || "Matéria"),
          duration,
          topic: topic ? String(topic.name || "") : "",
          topicId: topic ? String(topic.id || "") : "",
          notes: topic ? String(topic.notes || "") : "",
          link: topic && Array.isArray(topic.links) ? String(topic.links[0] || "") : "",
          // A conclusão pertence a cada sessão/data, não ao tópico inteiro.
          // O estado concluído é salvo individualmente em sessionOverrides.
          done: false,
          deleted: false
        };
        const session = applyStudySessionOverride(plan, base);
        if (includeDeleted || !session.deleted) sessions.push(session);
      }
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions.sort((a,b) => a.date.localeCompare(b.date) || a.subject.localeCompare(b.subject, "pt-BR"));
}

function updateStudySession(plan, sessionId, patch){
  if(!plan) return;
  const overrides=ensureStudySessionOverrides(plan);
  overrides[sessionId]={...(overrides[sessionId]||{}),...patch};
  saveState();
}

function startStudySessionPomodoro(session,plan){
  const minutes=Math.max(1,Number(session?.duration)||25);
  pomodoroState.running=false;
  stopPomodoroInterval();
  pomodoroState.total=minutes*60;
  pomodoroState.remaining=minutes*60;
  pomodoroState.accumulated=0;
  activeStudySession={id:String(session?.id||""),planId:String(plan?.id||""),subject:String(session?.subject||"Estudo"),topic:String(session?.topic||""),duration:minutes};
  closeModal();
  syncPomodoroDisplay();
  toast(`Pomodoro preparado: ${session?.subject||"estudo"}${session?.topic?` — ${session.topic}`:""} · ${minutes} min.`);
}

function editStudySession(plan, session){
  openModal("Editar sessão", `
    ${field("Data", "sessionDate", "date", session.date)}
    ${field("Matéria", "sessionSubject", "text", session.subject)}
    ${field("Assunto", "sessionTopic", "text", session.topic || "")}
    ${field("Duração (min)", "sessionDuration", "number", session.duration, "min=1")}
    ${textareaField("Anotações", "sessionNotes", session.notes || "")}
    ${field("Link", "sessionLink", "url", session.link || "")}
  `, {submit:"Salvar"});
  const form=modal.querySelector("#lidire-form");
  if(!form) return;
  form.onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(form);
    updateStudySession(plan,session.id,{
      date:String(fd.get("sessionDate")||session.date),
      subject:String(fd.get("sessionSubject")||"").trim() || session.subject,
      topic:String(fd.get("sessionTopic")||"").trim(),
      duration:Math.max(1,Number(fd.get("sessionDuration"))||session.duration),
      notes:String(fd.get("sessionNotes")||"").trim(),
      link:String(fd.get("sessionLink")||"").trim()
    });
    closeModal();
    openStudyPlanSessions(plan);
    toast("Sessão atualizada.");
  };
}

function openStudyPlanSessions(plan) {
  const sessions=studyPlanSessions(plan);
  const allGenerated=studyPlanSessions(plan,true);
  const completedCount=allGenerated.filter(s=>s.done && !s.deleted).length;
  const totalCount=allGenerated.length;
  if(!sessions.length){
    openModal("Sessões programadas", `<p class="muted">${totalCount ? "Todas as sessões deste planejamento foram concluídas ou excluídas." : "Nenhuma sessão foi gerada para este planejamento."}</p>${totalCount?`<p class="muted">${completedCount} de ${totalCount} sessões concluídas.</p>`:""}`, {submit:"Fechar"});
    const form=modal.querySelector("#lidire-form"); if(form) form.onsubmit=e=>{e.preventDefault();closeModal();};
    return;
  }
  const months={};
  sessions.forEach(s=>{const key=s.date.slice(0,7);(months[key] ||= []).push(s);});
  const monthLabel=key=>{const [y,m]=key.split("-").map(Number);return new Date(y,m-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});};
  const sessionHtml=s=>`<div class="list-item" style="padding:8px 2px;gap:8px;opacity:${s.done?.68:1}">
    <div class="module-icon small" style="width:32px;height:32px;min-width:32px;font-size:17px">📚</div>
    <div class="item-main"><strong>${s.done?"✅ ":""}${esc(s.subject)}</strong><span>${s.topic?`Assunto: ${esc(s.topic)} · `:""}${s.duration} min</span>${s.notes?`<small>${esc(s.notes)}</small>`:""}${s.link?`<small><a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">🔗 Abrir material</a></small>`:""}</div>
    <div class="item-actions" style="display:flex;flex-wrap:wrap;justify-content:flex-end">
      <button type="button" class="ghost-button compact" data-action="start-study-session" data-plan-id="${esc(plan.id)}" data-session-id="${esc(s.id)}" title="Iniciar estudo">▶️</button>
      <button type="button" class="ghost-button compact" data-action="toggle-study-session" data-plan-id="${esc(plan.id)}" data-session-id="${esc(s.id)}" title="${s.done?"Desmarcar concluída":"Marcar como concluída"}">${s.done?"↩️":"✅"}</button>
      <button type="button" class="ghost-button compact" data-action="edit-study-session" data-plan-id="${esc(plan.id)}" data-session-id="${esc(s.id)}" title="Editar">${icon("edit")}</button>
      <button type="button" class="ghost-button compact" data-action="delete-study-session" data-plan-id="${esc(plan.id)}" data-session-id="${esc(s.id)}" title="Excluir">${icon("trash")}</button>
    </div>
  </div>`;
  const html=Object.entries(months).map(([month,list],mi)=>{
    const days={};list.forEach(s=>(days[s.date] ||= []).push(s));
    return `<details ${mi===0?"open":""} style="border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 11px;margin:8px 0"><summary style="cursor:pointer;font-weight:800;text-transform:capitalize">🗓️ ${esc(monthLabel(month))} <span class="muted">· ${list.length} sessão${list.length===1?"":"ões"}</span></summary><div style="margin-top:6px">${Object.entries(days).map(([date,day])=>`<details style="padding:7px 0;border-top:1px solid rgba(255,255,255,.06)"><summary style="cursor:pointer;font-weight:700">📅 ${esc(dateBR(date))} <span class="muted">· ${day.length}</span></summary><div class="item-list" style="margin-top:5px">${day.map(sessionHtml).join("")}</div></details>`).join("")}</div></details>`;
  }).join("");
  const progress=totalCount?Math.round(completedCount/totalCount*100):0;
  openModal(`Sessões — ${esc(plan.name||"Planejamento")}`,`<div class="content-card" style="margin:0 0 10px;padding:10px"><strong>${completedCount}/${totalCount} concluídas</strong><span class="muted" style="margin-left:8px">${progress}%</span><div class="v5-progress" style="margin-top:7px"><span style="width:${progress}%"></span></div></div>${html}`,{submit:"Fechar"});
  const form=modal.querySelector("#lidire-form");if(form)form.onsubmit=e=>{e.preventDefault();closeModal();};
}

function estudos() {
  normalizeStudiesData(); const items=state.data.estudos||[]; const plans=state.data.studyPlans||[]; const lang=false;
  const now=new Date();
  let weekSessions=[];
  let scheduledWeekMinutes=0;
  let completedWeekMinutes=0;
  let pct=0;
  let dailyWeekMinutes=Array.from({length:7},()=>({scheduled:0,completed:0}));
  let maxDailyMinutes=1;
  try {
    const weekStart=new Date(now);
    weekStart.setHours(0,0,0,0);
    const mondayOffset=(weekStart.getDay()+6)%7;
    weekStart.setDate(weekStart.getDate()-mondayOffset);
    const weekEnd=new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate()+6);
    const weekStartISO=localDateISO(weekStart);
    const weekEndISO=localDateISO(weekEnd);
    weekSessions=Array.isArray(plans)
      ? plans.flatMap(plan=>studyPlanSessions(plan,true))
        .filter(session=>!session.deleted && session.date>=weekStartISO && session.date<=weekEndISO)
      : [];
    scheduledWeekMinutes=weekSessions.reduce((sum,session)=>sum+Math.max(0,Number(session.duration)||0),0);
    completedWeekMinutes=weekSessions.filter(session=>session.done)
      .reduce((sum,session)=>sum+Math.max(0,Number(session.duration)||0),0);
    pct=scheduledWeekMinutes?Math.min(100,Math.round(completedWeekMinutes/scheduledWeekMinutes*100)):0;
    dailyWeekMinutes=Array.from({length:7},(_,dayIndex)=>{
      const date=new Date(weekStart);
      date.setDate(date.getDate()+dayIndex);
      const iso=localDateISO(date);
      const daySessions=weekSessions.filter(session=>session.date===iso);
      const scheduled=daySessions.reduce((sum,session)=>sum+Math.max(0,Number(session.duration)||0),0);
      const completed=daySessions.filter(session=>session.done).reduce((sum,session)=>sum+Math.max(0,Number(session.duration)||0),0);
      return {scheduled,completed};
    });
    maxDailyMinutes=Math.max(1,...dailyWeekMinutes.map(day=>day.scheduled));
  } catch (error) {
    console.error("Erro ao calcular Progresso Semanal:", error);
  }
  const subjects=[...new Set(items.map(x=>String(x.subject||"Subject").trim()).filter(Boolean))];
  const subjectCards=subjects.slice(0,6).map(subject=>{const ss=items.filter(x=>String(x.subject||"").trim()===subject);const total=ss.reduce((s,x)=>s+Number(x.duration||0),0);const completed=ss.reduce((s,x)=>s+Number(x.effectiveDuration||((x.done?x.duration:0))||0),0);const p=total?Math.min(100,Math.round(completed/total*100)):Math.round(ss.filter(x=>x.done).length/Math.max(1,ss.length)*100);return `<div class="v5-study-subject"><div><strong>${esc(subject)}</strong><span>${p}%</span></div><div class="v5-progress"><span style="width:${p}%"></span></div></div>`}).join('');
  const today = todayISO();
  const manualToday = items
    .filter(x => String(x.date || "") === today)
    .map(x => ({
      id: String(x.id || uid("study-today")),
      subject: String(x.subject || "Estudo"),
      topic: String(x.topic || ""),
      duration: Math.max(1, Number(x.duration) || 0),
      time: String(x.time || ""),
      done: !!x.done
    }));
  const plannedToday = plans.flatMap(plan => studyPlanSessions(plan).filter(x => x.date === today));
  const seenToday = new Set();
  const todayItems = [...manualToday, ...plannedToday]
    .filter(x => {
      const key = String(x.id || `${x.subject}|${x.topic}|${x.date}`);
      if (seenToday.has(key)) return false;
      seenToday.add(key);
      return true;
    });
  const todayTasksHtml = todayItems.length
    ? todayItems.map(x => `<div class="v5-study-task"><div><strong>${x.done ? "✅ " : ""}${esc(x.topic || x.subject || "Estudo")}</strong><small>${esc(x.subject || "")}${x.time ? ` · ${esc(x.time)}` : ""}${x.duration ? ` · ${esc(x.duration)} min` : ""}</small></div></div>`).join("")
    : `<div class="v5-study-task"><div><strong>${lang ? "No study tasks today" : "Nenhuma tarefa de estudo para hoje"}</strong><small>${lang ? "Only tasks scheduled for today are shown here." : "Não há sessões de estudo programadas para hoje."}</small></div></div>`;
  return appShell(`
    ${pageHeader("DASHBOARD", lang?"Studies":"Estudos", lang?"Plan, focus and track your progress.":"Planeje, foque e acompanhe seu progresso.", `<button class="primary-button compact" data-action="add-study-plan">${icon("plus")} ${lang?"Plan":"Planejar"}</button>`)}
    <section class="v5-study-progress"><div class="v5-section-row"><div><h2>${lang?"Weekly Progress":"Progresso Semanal"}<p>${scheduledWeekMinutes?`${lang?`You completed ${pct}% of the scheduled study time this week.`:`Você completou ${pct}% do tempo de estudo programado nesta semana.`}`:`${lang?"No study sessions scheduled for this week.":"Nenhuma sessão de estudo programada para esta semana."}`}</p></div><span class="v5-chart-icon">↗</span></div><div class="v5-week-chart">${dailyWeekMinutes.map((day,i)=>{const scheduledHeight=day.scheduled?Math.max(8,Math.round(day.scheduled/maxDailyMinutes*100)):4;const dayPct=day.scheduled?Math.min(100,Math.round(day.completed/day.scheduled*100)):0;const completedHeight=dayPct;const isToday=i===((now.getDay()+6)%7);return `<div class="v5-day-column"><div class="v5-day-bar-wrap"><span class="v5-day-bar-track ${isToday?"active":""}" title="${day.completed} min concluídos de ${day.scheduled} min programados" style="height:${scheduledHeight}%"><span class="v5-day-bar-complete" style="height:${completedHeight}%"></span></span></div><small class="${isToday?"today":""}">${["S","T","Q","Q","S","S","D"][i]}</small><small class="v5-day-pct">${day.scheduled?dayPct+"%":"–"}</small></div>`}).join('')}</div><div class="v5-study-legend"><span><i class="scheduled"></i>Programado</span><span><i class="completed"></i>Concluído</span></div><small style="display:block;margin-top:8px">${completedWeekMinutes} min concluídos · ${scheduledWeekMinutes} min programados</small></section>
    <section class="v5-focus-card"><div class="v5-focus-ring"><strong id="pomodoro-focus-total">${Math.floor((pomodoroHistoryTotal()+(pomodoroState.accumulated||0))/3600)}h ${Math.floor(((pomodoroHistoryTotal()+(pomodoroState.accumulated||0))%3600)/60)}m</strong><small>${lang?"TOTAL POMODORO FOCUS":"FOCO TOTAL DO POMODORO"}</small></div><button class="text-button" data-action="open-pomodoro-details">${lang?"View details":"Ver detalhes"}</button><button type="button" class="text-button" data-action="zero-pomodoro-total">${lang?"Reset total":"Zerar"}</button></section>
    <div class="v5-section-row"><h2>${lang?"Study Plans":"Planejamentos de Estudos"}<button class="text-button" data-action="add-study-plan">＋</button></h2></div>
    ${plans.length ? plans.map(studyPlanCard).join("") : `<section class="content-card"><p class="muted">${lang?"Create your first study plan.":"Crie seu primeiro planejamento de estudos."}</p><button class="primary-button compact" data-action="add-study-plan">＋ Planejar</button></section>`}
    <h2 class="v5-inline-title">${lang?"Today's Tasks":"Tarefas de Hoje"}</h2>
    <section class="v5-today-tasks">${todayTasksHtml}</section>
    <section class="v5-pomodoro"><small>${lang?"DEEP FOCUS":"FOCO PROFUNDO"}</small><div id="pomodoro-active-session" style="display:none;margin:6px 0 10px;font-size:12px;opacity:.85"></div><strong id="pomodoro-display">${formatPomodoro(pomodoroState.remaining)}</strong><span>${lang?"POMODORO":"POMODORO"}</span><div><button class="primary-button compact" data-action="start-study-focus">▷ ${pomodoroState.running?(lang?"Pause":"Pausar"):(lang?"Start":"Iniciar")}</button><button class="ghost-button compact" data-action="reset-study-focus">↻</button><button class="ghost-button compact" data-action="set-study-focus">⚙ ${lang?"Set time":"Definir tempo"}</button></div><div class="v5-pomo-stats"><span>${ensurePomodoroHistory().length}<br><small>${lang?"Sessions":"Sessões"}</small></span><span>${Math.floor((pomodoroHistoryTotal()+(pomodoroState.accumulated||0))/60)}m<br><small>${lang?"Total":"Total"}</small></span><button class="ghost-button compact" data-action="open-pomodoro-history">Histórico</button></div></section>
  `);
}

/* =========================================================
   TREINOS
   ========================================================= */

function workoutPerformanceChart(items) {
  if (!items.length) return `<p class="muted">Registre treinos para visualizar o rendimento.</p>`;
  const groups = {};
  items.forEach(t => {
    const type = (t.type || "Treino").trim() || "Treino";
    const distance = Number(t.distance || 0);
    const reps = (t.exercises || []).reduce((sum,e)=>sum + Number(e.repsDone || 0),0);
    const value = distance > 0 ? distance : reps;
    const unit = distance > 0 ? "km" : "reps";
    if (!groups[type]) groups[type] = {value:0,unit};
    groups[type].value += value;
  });
  const rows = Object.entries(groups);
  const max = Math.max(1, ...rows.map(([,v])=>v.value));
  return `<div class="performance-chart">${rows.map(([type,v])=>`<div class="chart-row"><div class="chart-label"><span>${esc(type)}</span><strong>${v.value.toLocaleString("pt-BR")} ${v.unit}</strong></div><div class="chart-bar"><span style="width:${Math.round(v.value/max*100)}%"></span></div></div>`).join("")}</div>`;
}


function workoutWeeklyPerformanceChart(items) {
  const start = workoutWeekStart(workoutWeekOffset);
  const now = new Date(); now.setHours(12,0,0,0);
  const today = workoutISODate(now);
  const rows = workoutWeekDays.map((name, i) => {
    const d = new Date(start); d.setDate(start.getDate()+i); const iso = workoutISODate(d);
    const dayItems = items.filter(t => (t.date || todayISO()) === iso);
    const completed = dayItems.filter(t => t.completed).length;
    return {short:name.slice(0,1), total:dayItems.length, completed, today:iso===today};
  });
  const max = Math.max(1, ...rows.map(r => r.total));
  const completedTotal = rows.reduce((n,r)=>n+r.completed,0);
  const plannedTotal = rows.reduce((n,r)=>n+r.total-r.completed,0);
  const all = items.filter(t => (t.date || todayISO()) >= workoutISODate(start) && (t.date || todayISO()) <= workoutISODate(new Date(start.getFullYear(),start.getMonth(),start.getDate()+6)));
  const metric = workoutAnalysisMode === "tempo" ? {label:"Tempo acumulado",unit:"min",value:t=>Number(t.duration||0)} : workoutAnalysisMode === "repeticoes" ? {label:"Repetições",unit:"reps",value:t=>(t.exercises||[]).reduce((n,e)=>n+Number(e.repsDone||0),0)} : workoutAnalysisMode === "carga" ? {label:"Carga acumulada (força)",unit:"kg·reps",value:t=>(/força|forca|musculação|musculacao|resistência|resistencia/i.test(t.type||"")?(t.exercises||[]).reduce((n,e)=>n+((Number(String(e.loadDone||0).replace(",",".").match(/-?\d+(?:\.\d+)?/)?.[0])||0)*(Number(String(e.repsDone||0).replace(",",".").match(/-?\d+(?:\.\d+)?/)?.[0])||0)),0):0)} : {label:"Treinos por tipo",unit:"treinos",value:t=>1};
  const byType = {};
  all.forEach(t=>{const type=(t.type||"Não especificado").trim(); if(!byType[type])byType[type]=0; byType[type]+=metric.value(t);});
  const analysisRows=Object.entries(byType).sort((a,b)=>b[1]-a[1]); const analysisMax=Math.max(1,...analysisRows.map(x=>x[1]));
  return `<section class="workout-week-performance"><div class="workout-week-performance-head"><div><strong>Desempenho semanal</strong><small>Treinos concluídos por dia nesta semana</small></div><span>${completedTotal}/${completedTotal+plannedTotal}</span></div><div class="workout-week-performance-chart">${rows.map(r=>`<div class="workout-performance-day"><div class="workout-performance-track" title="${r.completed} concluídos de ${r.total} treinos"><span class="workout-performance-planned" style="height:${r.total?Math.max(8,Math.round(r.total/max*100)):4}%"><span class="workout-performance-completed" style="height:${r.total?Math.round(r.completed/r.total*100):0}%"></span></span></div><small class="${r.today?'today':''}">${r.short}</small><b>${r.completed}/${r.total}</b></div>`).join('')}</div><div class="workout-week-performance-legend"><span><i class="planned"></i>Planejados</span><span><i class="completed"></i>Concluídos</span></div><div class="workout-analysis"><strong>Análise de evolução semanal</strong><div class="workout-analysis-options"><button class="${workoutAnalysisMode==='volume'?'active':''}" data-action="workout-analysis-mode" data-mode="volume">Tipos de treino</button><button class="${workoutAnalysisMode==='tempo'?'active':''}" data-action="workout-analysis-mode" data-mode="tempo">Tempo</button><button class="${workoutAnalysisMode==='repeticoes'?'active':''}" data-action="workout-analysis-mode" data-mode="repeticoes">Repetições</button><button class="${workoutAnalysisMode==='carga'?'active':''}" data-action="workout-analysis-mode" data-mode="carga">Cargas (força)</button></div><small>${metric.label}</small>${analysisRows.length?analysisRows.map(([type,value])=>`<div class="workout-analysis-row"><div><span>${esc(type)}</span><b>${Number(value).toLocaleString('pt-BR')} ${metric.unit}</b></div><div class="workout-analysis-track"><span style="width:${Math.round(value/analysisMax*100)}%"></span></div></div>`).join(''):`<p class="muted">Registre treinos nesta semana para visualizar a evolução.</p>`}</div></section>`;
}

const expandedWorkoutIds = new Set();
let workoutWeekOffset = 0;
let workoutHistoryView = false;
let workoutPrefillDate = "";
let workoutAnalysisMode = "volume";
const workoutWeekDays = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
function workoutWeekStart(offset = 0) {
  const d = new Date(); d.setHours(12,0,0,0);
  const mondayShift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayShift + offset * 7);
  return d;
}
function workoutISODate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function workoutWeekLabel(start) { const end = new Date(start); end.setDate(end.getDate()+6); return `${dateBR(workoutISODate(start))} – ${dateBR(workoutISODate(end))}`; }
function renderWorkoutWeek(planned) {
  const start = workoutWeekStart(workoutWeekOffset);
  const days = workoutWeekDays.map((name, i) => {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const iso = workoutISODate(d);
    const dayItems = planned.filter(t => (t.date || todayISO()) === iso);
    const isToday = iso === todayISO();
    const title = `<div><strong>${name}</strong><small>${dateBR(iso)}${isToday ? " · Hoje" : ""}</small></div><span>${dayItems.length} ${dayItems.length===1?"treino":"treinos"}</span>`;
    const dayHeader = dayItems.length
      ? `<div class="workout-week-day-title">${title}</div>`
      : `<button type="button" class="workout-week-day-title workout-week-day-add" data-action="add-workout-on-day" data-date="${iso}" aria-label="Adicionar treino em ${name}, ${dateBR(iso)}">${title}</button>`;
    return `<section class="workout-week-day workout-day-${i} ${isToday ? "is-today" : ""}">${dayHeader}${dayItems.length ? `<div class="item-list">${dayItems.map(t=>workoutCard(t,false)).join("")}</div>` : ""}</section>`;
  }).join("");
  return `<div class="workout-week-nav"><button class="ghost-button compact" data-action="workout-week-prev">← Semana anterior</button><strong>${workoutWeekLabel(start)}</strong><button class="ghost-button compact" data-action="workout-week-next">Próxima semana →</button><button class="text-button" data-action="workout-week-today">Hoje</button></div>${days}`;
}
function treinos() {
  const items = state.data.treinos || [];
  const planned = items.filter(t => !t.completed);
  const done = items.filter(t => t.completed);
  if (workoutHistoryView) return appShell(`${pageHeader("BEM-ESTAR", "Histórico de treinos", "Treinos que você marcou como concluídos", `<button class="ghost-button compact" data-action="workout-history-back">← Voltar aos treinos</button>`)}<div class="content-card">${done.length?`<div class="item-list">${done.map(t=>workoutCard(t,true)).join("")}</div>`:`<p class="muted">Nenhum treino concluído ainda.</p>`}</div>`);
  return appShell(`${pageHeader("BEM-ESTAR", "Treinos", "Organize seu treino semanal", `<div class="workout-header-actions"><button class="primary-button compact" data-action="add-treinos">${icon("plus")} Novo treino</button><button class="ghost-button compact" data-action="workout-history-open">Histórico de treinos</button></div>`)}
    <div class="content-card"><div class="workout-tabs"><span>📅 Planejados: <strong>${planned.length}</strong></span><span>✅ Executados: <strong>${done.length}</strong></span><span>🏋️ Total: <strong>${items.length}</strong></span></div>${workoutWeeklyPerformanceChart(items)}</div>
    <div class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">Agenda semanal de treinos</div><small>Toque em um dia da semana para adicionar um treino nessa data.</small></div></div>${renderWorkoutWeek(planned)}</div>`);
}
function workoutCard(treino, done){
  const exercises = Array.isArray(treino.exercises) ? treino.exercises : [];
  const isExpanded = expandedWorkoutIds.has(String(treino.id));
  const exerciseHtml = exercises.length ? exercises.map(ex => `
    <div class="list-item">
      <div class="module-icon small">${icon("dumbbell")}</div>
      <div class="item-main"><strong>${esc(ex.name)}</strong><span>Carga: meta ${esc(ex.loadGoal||"—")} / realizada ${esc(ex.loadDone||"—")} · Repetições: meta ${esc(ex.repsGoal||"—")} / realizadas ${esc(ex.repsDone||"—")}</span></div>
      <div class="item-actions">
        <button class="ghost-button compact" data-action="complete-exercicio" data-id="${ex.id}" data-treino-id="${treino.id}">${ex.completed ? "✓ Concluído" : "Concluir exercício"}</button>
        <button data-action="edit-exercicio" data-id="${ex.id}" data-treino-id="${treino.id}">${icon("edit")}</button>
        <button data-action="delete-exercicio" data-id="${ex.id}" data-treino-id="${treino.id}">${icon("trash")}</button>
      </div>
    </div>`).join("") : `<p class="muted">Nenhum exercício cadastrado.</p>`;
  return `<div class="exercise-card">
    <div class="goal-top"><div><button type="button" class="workout-name-toggle" data-action="toggle-exercises" data-id="${treino.id}" aria-expanded="${isExpanded ? "true" : "false"}" title="${isExpanded ? "Recolher exercícios" : "Exibir exercícios"}"><strong>${esc(treino.name)}</strong><span class="workout-toggle-hint">${isExpanded ? "▾ Ocultar exercícios" : "▸ Ver exercícios"} (${exercises.length})</span></button><span>${esc(treino.type||"Treino")} · ${new Date((treino.date||todayISO())+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long"})} · ${dateBR(treino.date||todayISO())}${treino.time ? ` · ${esc(treino.time)}` : ""}${treino.duration ? ` · ${esc(treino.duration)} min` : ""}${treino.distance ? ` · ${esc(treino.distance)} km` : ""}${treino.pace ? ` · Pace ${esc(treino.pace)}` : ""}</span></div>
      <div class="item-actions"><button data-action="edit-treino" data-id="${treino.id}" title="Editar">${icon("edit")}</button><button data-action="delete-treino" data-id="${treino.id}" title="Excluir">${icon("trash")}</button></div>
    </div>
    <div class="workout-actions"><button class="${done?"ghost-button":"primary-button"} compact" data-action="toggle-treino" data-id="${treino.id}">${done?"↩ Desmarcar concluído":"✓ Marcar como concluído"}</button><button class="ghost-button compact" data-action="copy-workout" data-id="${treino.id}">⧉ Copiar para outro dia</button><button class="ghost-button compact" data-action="create-reminder" data-source="treino" data-id="${treino.id}">⏰ Lembrete</button><button class="ghost-button compact" data-action="add-exercicio" data-id="${treino.id}">+ Exercício</button></div>
    ${isExpanded ? `<div class="workout-exercises">${exerciseHtml}</div>` : ""}${treino.observations ? `<p class="muted">${esc(treino.observations)}</p>` : ""}
  </div>`;
}

/* =========================================================
   HIDRATAÇÃO
   ========================================================= */

function formatHydrationInterval(minutes) {
  const value = Number(minutes) || 30;
  if (value < 60) return `${value} min`;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (!mins) return `${hours}h`;
  return `${hours}h${String(mins).padStart(2, "0")}`;
}

function hidratacao() {
  const lang = false;
  const hydrationRecommendation = calculateHydrationRecommendation();
  const total = state.data.hidratacao
    .filter(x => x.date === todayISO())
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const goal =
    Number(state.settings.hydrationGoal) || 2000;

  const intervalMinutes =
    Number(state.settings.hydrationIntervalMinutes) ||
    (Number(state.settings.hydrationInterval) || 2) * 60;

  const startTime = state.settings.hydrationStart || "08:00";
  const endTime = state.settings.hydrationEnd || "21:00";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let periodMinutes =
    (endHour * 60 + endMinute) -
    (startHour * 60 + startMinute);

  if (periodMinutes <= 0) periodMinutes += 24 * 60;

  const consumptionCount = Math.max(1, Math.ceil(periodMinutes / intervalMinutes));
  const periodAmount = Math.round(goal / consumptionCount);

  const pct = Math.min(
    100,
    Math.round((total / goal) * 100)
  );

  return appShell(`

    ${pageHeader(
      lang ? "WELL-BEING" : "BEM-ESTAR",
      lang ? "Hydration" : "Hidratação",
      lang ? "Track your daily goal and the suggested amount for each period." : "Acompanhe sua meta diária e a quantidade indicada por período.",
      `
        <button
          class="primary-button compact"
          data-action="add-hidratacao"
        >
          ${icon("plus")} ${lang?"Log water":"Registrar"}
        </button>
      `
    )}

    <div class="hydration-card">

      <div class="hydration-top">

        <div>

          <span class="eyebrow">
            ${lang?"TODAY":"HOJE"}
          </span>

          <h2>
            ${total} ml
          </h2>

          <p>
            ${lang?"of":"de"} ${goal} ml
          </p>

          <p class="muted">
            ${periodAmount} ml ${lang?"every":"a cada"} ${formatHydrationInterval(intervalMinutes)}
            <br><span class="muted">${startTime} ${lang?"to":"às"} ${endTime} · ${consumptionCount} ${lang?"planned drinks":"consumos previstos"}</span>
          </p>

        </div>

        <div class="water-drop">
          ◉
        </div>

      </div>

      <div class="progress">
        <span style="width:${pct}%"></span>
      </div>

      <div class="progress-labels">

        <span>0 ml</span>

        <strong>${pct}%</strong>

        <span>${goal} ml</span>

      </div>

      <div class="quick-water">

        ${[200, 300, 500].map(v => `
          <button
            data-action="quick-water"
            data-value="${v}"
          >
            +${v} ml
          </button>
        `).join("")}

        <button
          class="custom-water-button"
          data-action="add-hidratacao"
        >
          Digitar quantidade
        </button>

      </div>

      <button
        class="ghost-button"
        data-action="config-hidratacao"
      >
        ⚙ Definir meta e período
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          Registros de hoje
        </div>

        <button
          class="text-button"
          data-action="reset-hidratacao"
        >
          Limpar
        </button>

      </div>

      ${
        state.data.hidratacao.filter(
          x => x.date === todayISO()
        ).length
          ? `
            <div class="item-list">

              ${state.data.hidratacao
                .filter(x => x.date === todayISO())
                .map(x => `

                  <div class="list-item">

                    <div class="module-icon small">
                      ◉
                    </div>

                    <div class="item-main">

                      <strong>
                        ${x.amount} ml
                      </strong>

                      <span>
                        ${new Date(
                          x.createdAt
                        ).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit"
                          }
                        )}
                      </span>

                    </div>

                    <div class="item-actions">

                      <button
                        data-action="delete-hidratacao"
                        data-id="${x.id}"
                      >
                        ${icon("trash")}
                      </button>

                    </div>

                  </div>

                `).join("")}

            </div>
          `
          : `<p class="muted">
              Nenhum registro hoje.
            </p>`
      }

    </div>

    <section class="content-card hydration-recommendation-card">
      <div class="card-toolbar"><div><div class="toolbar-title">${lang?"LiDire hydration suggestion":"Sugestão de hidratação da LiDire"}</div><small>${lang?"Based on sex, age, weight, activity and goal.":"Baseada em sexo, idade, peso, atividade e objetivo."}</small></div><button class="ghost-button compact" data-action="config-hidratacao">⚙ ${lang?"Set profile":"Definir perfil"}</button></div>
      <strong>${hydrationRecommendation.ml} ml/dia</strong>
      <p class="muted">${esc(hydrationRecommendation.note)}</p>
      <small class="muted">${lang?"Estimate only; not a medical prescription.":"Estimativa para orientação; não é prescrição médica."}</small>
    </section>

  `);
}

/* =========================================================
   ALIMENTAÇÃO
   ========================================================= */

function alimentacao() {
  const today = todayISO();

  const meals = state.data.alimentacao
    .filter(x => x.date === today)
    .sort((a, b) =>
      (a.time || "").localeCompare(
        b.time || ""
      )
    );

  const consumed = meals.reduce(
    (sum, meal) =>
      sum +
      (meal.foods || []).reduce(
        (s, food) =>
          s + Number(food.calories || 0),
        0
      ),
    0
  );

  const goal =
    Number(state.settings.calorieGoal) || 2000;

  const remaining =
    Math.max(0, goal - consumed);

  const pct = Math.min(
    100,
    Math.round((consumed / goal) * 100)
  );

  return appShell(`

    ${pageHeader(
      "BEM-ESTAR",
      "Alimentação",
      "Organize refeições, alimentos da dieta e calorias.",
      `
        <button
          class="primary-button compact"
          data-action="add-alimentacao"
        >
          ${icon("plus")} Refeição
        </button>
        <button class="ghost-button compact" data-action="food-catalog">🍎 Cadastro de alimentos</button><button class="ghost-button compact" data-action="recipe-coming-soon">🍳 Receita com IA</button>
      `
    )}

    <div class="calorie-summary">

      <span class="eyebrow">
        CALORIAS DE HOJE
      </span>

      <strong>
        ${consumed} kcal
      </strong>

      <p>
        Meta: ${goal} kcal · Restam ${remaining} kcal
      </p>

      <div class="calorie-progress">
        <span style="width:${pct}%"></span>
      </div>

      <button
        class="ghost-button"
        data-action="config-calorias"
      >
        ⚙ Definir meta diária
      </button>

    </div>

    <div class="shopping-diet-actions">

      <button class="ghost-button" data-action="add-dieta">🍽 Nova dieta</button>
      <button class="ghost-button" data-action="diet-library">📚 Biblioteca de dietas</button>

      <button
        class="ghost-button"
        data-page="receitas"
      >
        🍳 Receitas
      </button>

      <button
        class="ghost-button"
        data-action="dieta-para-compras"
      >
        🛒 Criar compras da dieta
      </button>

    </div>

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          Refeições de hoje
        </div>

      </div>

      ${
        meals.length
          ? `
            <div class="item-list">

              ${meals.map(meal => `

                <div class="list-item">

                  <div class="module-icon small">
                    🍽
                  </div>

                  <div class="item-main">

                    <strong>
                      ${esc(meal.name)}
                    </strong>

                    <span>
                      ${esc(meal.time || "--:--")}
                      ·
                      ${
                        (meal.foods || []).reduce(
                          (s, f) =>
                            s +
                            Number(
                              f.calories || 0
                            ),
                          0
                        )
                      } kcal
                    </span>

                    <small>

                      ${(meal.foods || [])
                        .map(
                          f =>
                            `${esc(f.name)} (${Number(
                              f.calories || 0
                            )} kcal)`
                        )
                        .join(", ")}

                    </small>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="edit-refeicao"
                      data-id="${meal.id}"
                    >
                      ${icon("edit")}
                    </button>

                    <button
                      data-action="delete-refeicao"
                      data-id="${meal.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : emptyState(
              "Nenhuma refeição hoje",
              "Registre sua primeira refeição para acompanhar as calorias.",
              "Adicionar refeição",
              "add-alimentacao"
            )
      }

    </div>

  `);
                        }
/* =========================================================
   FINANÇAS
   ========================================================= */

function currentFinanceMonth() {
  return todayISO().slice(0, 7);
}

function activeFinanceRows() {
  const month = currentFinanceMonth();
  const resetAt = state.settings.financeMonthResets?.[month] || "";
  return (state.data.financas || []).filter(x => {
    const date = String(x.date || "");
    if (!date.startsWith(month)) return false;
    return !resetAt || String(x.createdAt || "") >= resetAt;
  });
}

function financeByCategory(rows = activeFinanceRows()) {
  const result = {};
  rows.filter(x => x.type === "expense").forEach(x => {
    const category = x.category?.trim() || "Geral";
    const currency = x.currency || "BRL";
    const key = `${currency}::${category}`;
    if (!result[key]) result[key] = { category, currency, value: 0 };
    result[key].value += Number(x.value || 0);
  });
  return result;
}

function financeChart() {
  const data = financeByCategory();
  const entries = Object.values(data);
  if (!entries.length) return `<p class="muted">Ainda não existem gastos por categoria neste mês.</p>`;
  const max = Math.max(...entries.map(x => x.value));
  return entries.sort((a,b)=>b.value-a.value).map(item => {
    const pct = max ? Math.round((item.value / max) * 100) : 0;
    const limit = item.currency === "BRL" ? Number(state.settings.financeLimits?.[item.category] || 0) : 0;
    const warning = limit > 0 ? `<div class="limit-warning ${item.value > limit ? "limit-danger" : "limit-ok"}">Teto: ${money(limit,"BRL")} · ${item.value > limit ? "Teto ultrapassado" : `Restam ${money(limit-item.value,"BRL")}`}</div>` : "";
    return `<div class="chart-row"><div class="chart-label"><span>${esc(item.category)} · ${item.currency === "USD" ? "US$" : "R$"}</span><strong>${money(item.value,item.currency)}</strong></div><div class="chart-bar"><span style="width:${pct}%"></span></div>${warning}</div>`;
  }).join("");
}

function financas() {
  const rows=activeFinanceRows(); const lang=false; const income=rows.filter(x=>x.type==="income"&&(x.currency||"BRL")==="BRL").reduce((s,x)=>s+Number(x.value||0),0); const expense=rows.filter(x=>x.type==="expense"&&(x.currency||"BRL")==="BRL").reduce((s,x)=>s+Number(x.value||0),0); const balance=income-expense;
  return appShell(`
    ${pageHeader(lang?"MONEY":"DINHEIRO", lang?"Finances":"Finanças", lang?"See your money, goals and spending in one place.":"Veja seu dinheiro, metas e gastos em um só lugar.", `<button class="primary-button compact" data-action="add-financas">${icon("plus")} ${lang?"Add transaction":"Adicionar transação"}</button>`)}
    <section class="v5-finance-summary"><small>${lang?"FINANCIAL SUMMARY":"RESUMO FINANCEIRO"}</small><strong>${money(balance,"BRL")}</strong><span>↗ ${lang?"This month":"este mês"}</span><div><button class="primary-button compact" data-action="add-financas">${lang?"Add transaction":"Adicionar transação"}</button><button class="ghost-button compact" data-action="finance-monthly-report">${lang?"Report":"Relatório"}</button><button class="ghost-button compact" data-action="finance-zero-month">${lang?"Reset month":"Zerar mês"}</button></div></section>
    <section class="v5-smart-banner finance"><span>✦</span><div><strong>${lang?"AI Tip":"Dica da IA"}</strong><p>${lang?"LiDire can analyze your spending and suggest adjustments based on your goals.":"A LiDire pode analisar seus gastos e sugerir ajustes com base nos seus objetivos."}</p></div><button class="text-button" data-page="assistente">${lang?"View full suggestion":"Ver sugestão completa"}</button></section>
    <section class="v5-finance-chart"><div class="v5-section-row"><h2>${lang?"Spending by Category":"Gastos por Categoria"}<button class="text-button" data-action="config-tetos">•••</button></h2></div>${financeChart()}</section>
    <section class="v5-goals-card"><div class="v5-section-row"><h2>${lang?"Financial Goals":"Objetivos Financeiros"}</h2><button class="text-button" data-action="add-objetivos">+ ${lang?"New":"Novo"}</button></div>${state.data.objetivos.slice(0,3).map(o=>`<div class="v5-fin-goal"><div><strong>${esc(o.title||o.name||"Goal")}</strong><small>${lang?"Target":"Meta"}: ${esc(o.target||o.valorMeta||"—")}</small></div><b>${Math.min(100,Number(o.progress||o.percent||0))}%</b><div class="v5-progress"><span style="width:${Math.min(100,Number(o.progress||o.percent||0))}%"></span></div></div>`).join('')||`<p class="muted">${lang?"Create a financial goal to start.":"Crie um objetivo financeiro para começar."}</p>`}</section>
    <section class="v5-transactions"><div class="v5-section-row"><h2>${lang?"Recent Transactions":"Transações Recentes"}</h2><button class="text-button" data-action="finance-history">☷</button></div>${rows.slice().reverse().slice(0,5).map(x=>`<div class="v5-transaction"><span>${x.type==="income"?"▣":"◼"}</span><div><strong>${esc(x.description||x.title||x.category||"Transaction")}</strong><small>${dateBR(x.date||todayISO())} · ${esc(x.category||"")}</small></div><b class="${x.type}">${x.type==="income"?"+":"-"} ${money(Number(x.value||0),x.currency||"BRL")}</b></div>`).join('')||`<p class="muted">${lang?"No transactions yet.":"Nenhuma transação ainda."}</p>`}</section>
  `);
}

/* =========================================================
   OBJETIVOS
   ========================================================= */

function objetivos() {
  const items =
    state.data.objetivos || [];

  return appShell(`

    ${pageHeader(
      "DIREÇÃO",
      "Objetivos",
      "Dê forma aos planos que você quer realizar.",
      `
        <button
          class="primary-button compact"
          data-action="add-objetivos"
        >
          ${icon("plus")} Objetivo
        </button>
      `
    )}

    <div class="content-card">

      ${
        items.length
          ? items.map(x => `

              <div class="goal-item">

                <div class="goal-top">

                  <div>

                    <strong>
                      ${esc(x.title)}
                    </strong>

                    <span>

                      ${
                        x.deadline
                          ? `Até ${dateBR(
                              x.deadline
                            )}`
                          : "Sem prazo"
                      }

                      ${
                        Number(x.moneyGoal || 0) > 0
                          ? ` · Meta financeira ${money(
                              x.moneyGoal,
                              x.moneyCurrency || "BRL"
                            )}`
                          : ""
                      }

                    </span>

                  </div>

                  <b>
                    ${Number(
                      x.progress || 0
                    )}%
                  </b>

                </div>

                <div class="progress">
                  <span
                    style="width:${Math.min(
                      100,
                      Number(x.progress || 0)
                    )}%"
                  ></span>
                </div>

                ${
                  x.observations
                    ? `
                      <p class="muted">
                        ${esc(
                          x.observations
                        )}
                      </p>
                    `
                    : ""
                }

                <div class="goal-subtasks">

                  ${
                    x.metas?.length
                      ? x.metas.map(meta => `

                          <div class="goal-subtask">

                            <button
                              class="check-button ${
                                meta.done
                                  ? "checked"
                                  : ""
                              }"
                              data-action="toggle-meta"
                              data-id="${meta.id}"
                              data-goal-id="${x.id}"
                            >
                              ${
                                meta.done
                                  ? "✓"
                                  : ""
                              }
                            </button>

                            <div class="item-main">

                              <strong>
                                ${esc(
                                  meta.title
                                )}
                              </strong>

                              <span>
                                ${esc(
                                  meta.period
                                )}
                              </span>

                            </div>

                          </div>

                        `).join("")
                      : `
                        <p class="muted">
                          Nenhuma meta interna cadastrada.
                        </p>
                      `
                  }

                </div>

                <div class="goal-actions">

                  <button
                    data-action="add-meta"
                    data-id="${x.id}"
                  >
                    + Meta
                  </button>

                  <button
                    data-action="progress-objetivo"
                    data-id="${x.id}"
                  >
                    Atualizar progresso
                  </button>

                  <button
                    data-action="edit-objetivo"
                    data-id="${x.id}"
                  >
                    Editar
                  </button>

                  <button
                    data-action="delete-objetivo"
                    data-id="${x.id}"
                  >
                    Excluir
                  </button>

                </div>

              </div>

            `).join("")
          : emptyState(
              "Nenhum objetivo",
              "Crie um objetivo e transforme-o em pequenas metas.",
              "Criar objetivo",
              "add-objetivos"
            )
      }

    </div>

  `);
}

/* =========================================================
   FAMÍLIA
   ========================================================= */

function familyPermissionSummary(x){
  const p=x?.permissions||{};
  const modules=[
    ["shareTasksData","Tarefas"],["agenda","Agenda"],["compras","Compras"],
    ["estudos","Estudos"],["treinos","Treinos"],["hidratacao","Hidratação"],
    ["alimentacao","Alimentação"],["financas","Finanças"],["objetivos","Objetivos"],["lembretes","Lembretes"]
  ];
  const enabled=modules.filter(([key])=>p[key]===true).map(([,label])=>label);
  const status=String(x?.inviteStatus||x?.status||"").toLowerCase();
  if(!enabled.length) return p.consentRequired?"Nenhum dado compartilhado (revise e salve as permissões para liberar)":"Nenhum dado compartilhado";
  if(!["active","accepted"].includes(status)) return `${enabled.join(", ")} — nada é enviado até o convite ser aceito`;
  return `${enabled.join(", ")} (somente leitura)`;
}
function familyHasActiveSharing(){
  return (state.data.familia||[]).some(x=>["active","accepted"].includes(String(x?.inviteStatus||x?.status||"").toLowerCase())&&
    ["shareTasksData","agenda","compras","estudos","treinos","hidratacao","alimentacao","financas","objetivos","lembretes"].some(k=>x?.permissions?.[k]===true));
}
function familySettings(){
  const people=state.data.familia||[];
  const fs=state.settings.familySharing||{};
  const toggle=(key,onLabel,offLabel)=>`<button class="family-toggle ${fs[key]?"on":""}" data-action="family-toggle-feature" data-key="${key}" aria-label="${fs[key]?onLabel:offLabel}"><span></span></button>`;
  return appShell(`${pageHeader("FAMÍLIA","Configurações de Família","Gerencie membros, recursos compartilhados e convites.",`<button class="ghost-button compact" data-page="familia">← ${false?"Back":"Voltar"}</button>`)}
    <div class="family-status-pill">✓ <span>${false?(["connected_calendar","connected_outlook","connected_notion"].some(k=>fs[k])?"Connected services available":"No calendars connected"):(["connected_calendar","connected_outlook","connected_notion"].some(k=>fs[k])?"Serviços conectados disponíveis":"Nenhuma agenda conectada")}</span></div>
    <section class="family-plan-card">
      <div class="family-plan-head"><div class="family-plan-icon">👥</div><div><strong>${false?"Family Plan":"Plano Família"}</strong><small>${people.length} ${false?"of 6 members used":"de 6 membros utilizados"}</small></div></div>
      <button class="primary-button family-add-member" data-action="add-familia">＋ ${false?"Add Member":"Adicionar membro"}</button>
      <div class="family-member-stack">${people.length?people.slice(0,6).map(x=>`<div class="family-person-row"><div class="family-person-avatar">${x.photo?`<img src="${esc(x.photo)}" alt="">`:esc((x.name||"?").charAt(0).toUpperCase())}</div><div><strong>${esc(x.name||"Membro")}</strong><small>${esc(String(x.relation||"Membro").toUpperCase())}</small></div><button class="family-more" data-action="edit-familia" data-id="${x.id}">⋮</button></div>`).join(""):`<div class="family-empty">${false?"No members yet.":"Nenhum membro adicionado ainda."}</div>`}</div>
    </section>
    <section class="family-section"><div class="family-section-title"><span>⌘</span><h2>${false?"Shared Features":"Recursos compartilhados"}</h2></div>
      <div class="family-feature-grid">
        <div class="family-feature-card"><div class="family-feature-icon calendar">▣</div><div><strong>Agenda</strong><p>Compartilhada por contato, somente leitura. Libere em Adicionar/Editar pessoa.</p></div><span class="family-share-notification-status">Por contato</span></div>
        <div class="family-feature-card"><div class="family-feature-icon money">▣</div><div><strong>Finanças</strong><p>Compartilhadas por contato, somente leitura. Libere em Adicionar/Editar pessoa.</p></div><span class="family-share-notification-status">Por contato</span></div>
        <div class="family-feature-card"><div class="family-feature-icon location">⌾</div><div><strong>Localização em tempo real</strong><p>Ainda não disponível: nenhuma localização é compartilhada.</p></div><span class="family-share-notification-status">Indisponível</span></div>
      </div>
      <p class="muted">O compartilhamento entre contas é somente leitura e controlado por contato e por módulo. Nada é enviado sem a sua marcação e sem o aceite do convite pelo contato.</p>
    </section>
    <section class="family-section"><div class="family-section-title"><span>✉</span><h2>${false?"Pending Invitations":"Convites Pendentes"}</h2></div>
      <div class="family-invite-list">${people.filter(x=>x.email).map(x=>`<div class="family-pending-row"><div class="family-pending-avatar">${esc((x.name||x.email||"?").charAt(0).toUpperCase())}</div><div><strong>${esc(x.email)}</strong><small>${x.inviteStatus==="pending"?(false?"Invitation pending":"Convite pendente"):(false?"Member":"Membro")}</small></div><button class="ghost-button compact" data-action="family-invite-link" data-id="${x.id}">${false?"Resend":"Reenviar"}</button></div>`).join("") || `<div class="family-empty">${false?"No pending invitations.":"Nenhum convite pendente."}</div>`}</div>
    </section>
    <section class="family-section family-install-section">
      <div class="family-section-title"><span>⌁</span><h2>${false?"Invite & install LiDire":"Convidar e instalar a LiDire"}</h2></div>
      <div class="family-install-card">
        <div><strong>${false?"Send an invitation with the installation link":"Envie um convite com link de instalação"}</strong><p>${false?"Share the LiDire installation page by link or QR code.":"Compartilhe a página de instalação da LiDire por link ou QR Code."}</p></div>
        <img src="/lidire-install-qr.png" alt="QR Code de instalação da LiDire" class="family-install-qr">
        <div class="family-install-actions"><button class="primary-button compact" data-action="create-promo-link">⌁ ${false?"Create installation invite":"Criar convite de instalação"}</button><button class="ghost-button compact" data-action="create-family-invite">👥 ${false?"Invite family member":"Convidar familiar"}</button></div>
      </div>
    </section>`);
}
function familyShareNotifications(){
  const sharingKeys=["shareTasksData","agenda","compras","estudos","treinos","hidratacao","alimentacao","financas","objetivos","lembretes"];
  const people=(state.data.familia||[]).filter(x=>sharingKeys.some(k=>x?.permissions?.[k]===true) && ["active","accepted"].includes(String(x.inviteStatus||x.status||"").toLowerCase()));
  if(!people.length){
    return `<section class="family-reference-card family-share-notifications">
      <div class="family-reference-card-head compact"><div><h3>🔔 Compartilhamento ativo</h3><p>Nenhum contato tem acesso de leitura aos seus dados.</p></div></div>
    </section>`;
  }
  return `<section class="family-reference-card family-share-notifications">
    <div class="family-reference-card-head compact"><div><h3>🔔 Compartilhamento ativo</h3><p>Estes contatos podem consultar, em modo de leitura, os módulos indicados abaixo.</p></div></div>
    <div class="family-reference-divider"></div>
    <div class="family-share-notification-list">${people.slice(0,12).map(x=>{
      const summary=familyPermissionSummary(x);
      const initial=esc((x.name||"M").charAt(0).toUpperCase());
      return `<div class="family-share-notification"><div class="family-share-notification-icon">${initial}</div><div class="family-share-notification-main"><strong>${esc(x.name||"Membro da família")}</strong><span>Você compartilha: ${esc(summary)}</span></div><span class="family-share-notification-status">Ativo</span></div>`;
    }).join("")}</div>
  </section>`;
}

function renderFamilyNotificationInbox(){
  const notes=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
  const trash=Array.isArray(state.data.notificacoesFamiliaLixeira)?state.data.notificacoesFamiliaLixeira:[];
  const unread=notes.filter(n=>!n.read_at).length;
  const rows=notes.filter(n=>{
    const type=String(n.resource_type||"").toLowerCase();
    return !["shared_resource_update","family_update","task","shopping","study","workout","goal"].includes(type)
      && !["family_invitation","group_invitation","invitation_accepted","family_invitation_accepted","group_invitation_accepted"].includes(type);
  }).slice(0,50).map(n=>{const isCommitment=["commitment","commitment_change"].includes(n.resource_type);const statusLabel=n.response_status==="confirmed"?"Confirmado":n.response_status==="suggested"?"Sugestão enviada":n.response_status==="replied"?"Respondida":"";return `<div class="family-share-notification" data-notification-id="${esc(n.id)}"><div class="family-share-notification-icon family-ld-icon" aria-label="LD">LD</div><div class="family-share-notification-main"><strong>${esc(n.title||"LiDire — Família")}</strong><span>${esc(n.message||"")}</span><small class="family-notification-sender">Enviado por: ${esc(n.sender_name||"Membro da família")}</small><small class="family-notification-date">${esc(formatFamilyNotificationDate(n.created_at))}</small>${statusLabel?`<small class="family-notification-response-status">${statusLabel}</small>`:""}<div class="family-notification-actions">${isCommitment?`<button class="ghost-button compact" data-action="respond-family-notification" data-kind="confirm" data-id="${esc(n.id)}">Confirmar</button><button class="ghost-button compact" data-action="respond-family-notification" data-kind="suggest" data-id="${esc(n.id)}">Fazer sugestão</button>`:""}<button class="ghost-button compact" data-action="respond-family-notification" data-kind="reply" data-id="${esc(n.id)}">Responder</button><button class="ghost-button compact family-notification-delete" data-action="delete-family-notification" data-id="${esc(n.id)}" aria-label="Mover LD para a lixeira">Excluir</button></div></div>${!n.read_at?`<button class="ghost-button compact" data-action="mark-family-notification-read" data-id="${esc(n.id)}">Marcar lida</button>`:`<span class="family-share-notification-status">Lida</span>`}</div>`;}).join("");
  return `<section class="family-reference-card"><div class="family-reference-card-head compact"><div><h3 class="ld-family-title">LD - FAMÍLIA <img src="/lidire-simbolo-coracao.png" alt="" class="ld-heart-arrow" aria-hidden="true"></h3><p>Mensagens recebidas dos membros da sua família LiDire.${unread?` <strong>${unread} não lida(s)</strong>`:""}</p></div></div><div class="family-reference-divider"></div><div class="family-share-notification-list">${rows||`<p class="muted">Nenhuma LD recebida.</p>`}</div><div class="family-trash-entry"><button type="button" class="ghost-button compact" data-page="familia-lixeira">🗑️ Abrir lixeira${trash.length?` (${trash.length})`:""}</button></div></section>`;
}


function renderGroupLDInbox(){
  const notes=Array.isArray(state.data.notificacoesGrupos)?state.data.notificacoesGrupos:[];
  const rows=notes.filter(n=>n && n.status!=="deleted").map(n=>`<div class="family-share-notification"><div class="family-share-notification-icon family-ld-icon">LD</div><div class="family-share-notification-main"><strong>${esc(n.title||"LD de grupo")}</strong><span>${esc(n.message||n.body||"Mensagem recebida de um grupo.")}</span></div><span class="family-share-notification-status">${n.read_at?"Lida":"Nova"}</span></div>`).join("");
  return `<div class="family-reference-divider"></div><h3>LDs dos grupos</h3><div class="family-share-notification-list">${rows||`<p class="muted">Nenhuma LD de grupo recebida.</p>`}</div>`;
}
function renderInvitationNotifications(){
  const notes=(Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[])
    .filter(n=>{
      if(!n || n.deleted_at || n.status==="deleted" || n.read_at) return false;
      const type=String(n.resource_type||"").toLowerCase();
      const title=String(n.title||"").toLowerCase();
      const message=String(n.message||"").toLowerCase();
      // O backend usa mais de um tipo para avisos de convite/aceite entre versões.
      return ["family_invitation","group_invitation","invitation_accepted","family_invitation_accepted","group_invitation_accepted"].includes(type)
        || /convite|convidou|aceitou o convite|aceite do convite/.test(title+" "+message)
        || /invitation|invited|accepted the invitation/.test(type+" "+title+" "+message);
    });
  const rows=notes.map(n=>`<div class="family-share-notification" data-notification-id="${esc(n.id)}"><div class="family-share-notification-icon">✉️</div><div class="family-share-notification-main"><strong>${esc(n.title||"Atualização de convite")}</strong><span>${esc(n.message||"Há uma atualização sobre um convite.")}</span><small class="family-notification-date">Recebido em: ${esc(formatFamilyNotificationDate(n.created_at))}</small><div class="family-notification-actions invitation-notification-actions"><button type="button" class="primary-button compact" data-action="mark-family-notification-read" data-id="${esc(n.id)}">Dar ciência</button><button type="button" class="ghost-button compact family-notification-delete" data-action="delete-family-notification" data-id="${esc(n.id)}">Excluir notificação</button></div></div></div>`).join("");
  return `<div class="family-invitation-notifications"><h4>Notificações de convites</h4><p class="muted">Ao dar ciência, a notificação desaparece desta área.</p><div class="family-share-notification-list">${rows||`<p class="muted">Nenhuma notificação de convite pendente de ciência.</p>`}</div></div>`;
}

function renderUnifiedInvitations(filter="all"){
  const groups=Array.isArray(state.data.grupos)?state.data.grupos:[];
  const groupInvites=groups.flatMap(g=>(g.invitations||[]).map(i=>({...i,groupName:g.name||"Grupo",inviteKind:"group"})));
  const family=Array.isArray(state.data.familia)?state.data.familia:[];
  const familyInvites=family.filter(m=>["pending","pending_acceptance","invited"].includes(String(m.status||"").toLowerCase())).map(m=>({...m,title:`Convite familiar: ${m.name||m.email||"membro"}`,message:`Status: ${m.status||"pendente"}`,inviteKind:"family"}));
  const serverInvites=Array.isArray(state.data.groupInvitations)?state.data.groupInvitations:[];
  const acknowledgedGroupInvites = (()=>{try{return JSON.parse(localStorage.getItem("lidire_ack_group_invites")||"[]")}catch(_){return []}})();
  const serverGroupInvites=serverInvites.map(i=>({...i,inviteKind:"group",groupName:i.group_name||i.groupName||"Grupo",title:i.direction==="received"?`Convite para ${i.group_name||"Grupo"}`:`Convite enviado: ${i.group_name||"Grupo"}`,message:i.direction==="received"?`${i.sender_name||i.sender_email||"Uma pessoa"} convidou você.`:`Enviado para ${i.recipient_email||"participante"}.`,status:i.status||"pending"})).filter(i=>!acknowledgedGroupInvites.includes(String(i.id)) && !tombstoneHas(groupInviteTombstones,i.id));
  const localGroupInvites=groupInvites.filter(i=>!i.serverInvitationId && !i.id?.startsWith("server:"));
  const rawItems=[...familyInvites,...serverGroupInvites,...localGroupInvites];
  const seenInvites=new Set();
  const allItems=rawItems.filter(i=>{
    const key=i.inviteKind==="group"
      ? `group:${String(i.serverInvitationId||i.id||"")}`
      : `family:${String(i.id||i.email||i.invitee_email||"")}:${String(i.status||"")}`;
    if(!key.endsWith(":" ) && seenInvites.has(key)) return false;
    seenInvites.add(key); return true;
  });
  const items=filter==="group"?allItems.filter(i=>i.inviteKind==="group"):filter==="family"?allItems.filter(i=>i.inviteKind==="family"):allItems;
  const statusPt = value => ({pending:"Pendente",accepted:"Aceito",rejected:"Recusado",failed:"Falhou",cancelled:"Cancelado",canceled:"Cancelado",new:"Novo",sent:"Enviado",expired:"Expirado"}[String(value||"pending").toLowerCase()] || String(value||"Pendente"));
  const rows=items.map(i=>`<div class="family-share-notification"><div class="family-share-notification-icon">${i.inviteKind==="group"?"👥":"✉️"}</div><div class="family-share-notification-main"><strong>${esc(i.title||(i.inviteKind==="group"?`Convite para ${i.groupName}`:"Convite familiar"))}</strong><span>${esc(i.message||`Convite ${statusPt(i.status)}${i.groupName?` para ${i.groupName}`:""}.`)}</span>${i.created_at?`<small class="family-notification-date">Enviado/recebido em: ${esc(formatInvitationDate(i.created_at))}</small>`:""}${i.responded_at?`<small class="family-notification-date">Respondido em: ${esc(formatInvitationDate(i.responded_at))}</small>`:""}</div><span class="family-share-notification-status">${esc(statusPt(i.status))}</span>${i.inviteKind==="group"&&i.direction==="received"&&i.status==="pending"?`<button type="button" class="family-reference-action primary" data-action="respond-group-invite" data-id="${esc(i.id)}" data-decision="accept">Aceitar</button><button type="button" class="family-reference-action" data-action="respond-group-invite" data-id="${esc(i.id)}" data-decision="reject">Recusar</button>`:""}${i.inviteKind==="group"&&i.direction==="sent"&&i.status==="pending"?`<div class="group-invite-actions"><button type="button" class="family-reference-action" data-action="resend-group-invite" data-id="${esc(i.id)}">Reenviar convite</button><button type="button" class="family-reference-action" data-action="delete-group-invite" data-id="${esc(i.id)}">Excluir convite</button></div>`:""}${i.inviteKind==="group"&&["accepted","rejected","cancelled","canceled"].includes(String(i.status||"").toLowerCase())?`<div class="group-invite-actions"><button type="button" class="primary-button compact" data-action="ack-group-invite" data-id="${esc(i.id)}">Dar ciência</button></div>`:""}</div>`).join("");
  return `<div class="family-share-notification-list">${rows||`<p class="muted">Nenhum convite ${filter==="group"?"de grupo":filter==="family"?"familiar":"recebido ou enviado"} encontrado.</p>`}</div>`;
}

function renderGroupNotificationInbox(){
  const groups=Array.isArray(state.data.grupos)?state.data.grupos:[];
  const invitations=groups.flatMap(g=>(g.invitations||[]).filter(i=>i.status==="new").map(i=>({...i,groupName:g.name||"Grupo"})));
  const rows=invitations.map(i=>`<div class="family-share-notification"><div class="family-share-notification-icon family-ld-icon" aria-label="LD">LD</div><div class="family-share-notification-main"><strong>${esc(i.title||`Convite para ${i.groupName}`)}</strong><span>${esc(i.message||`Há uma nova atualização no grupo ${i.groupName}.`)}</span></div><span class="family-share-notification-status">Nova</span></div>`).join("");
  const unread=invitations.length;
  return `<section class="family-reference-card family-group-ld-card"><div class="family-reference-card-head compact"><div><h3 class="ld-family-title">GRUPOS <img src="/lidire-simbolo-coracao.png" alt="" class="ld-heart-arrow" aria-hidden="true"></h3><p>Mensagens e convites dos seus grupos LiDire.${unread?` <strong>${unread} não visualizada(s)</strong>`:""}</p></div></div><div class="family-reference-divider"></div><div class="family-share-notification-list">${rows||`<p class="muted">Nenhuma LD recebida dos grupos.</p>`}</div><div class="family-trash-entry"><button type="button" class="primary-button compact" data-page="familia">👥 Gerenciar grupos</button></div></section>`;
}

function familiaLixeira(){
  const trash=Array.isArray(state.data.notificacoesFamiliaLixeira)?state.data.notificacoesFamiliaLixeira:[];
  const rows=trash.map(n=>`<div class="family-share-notification family-trash-item"><div class="family-share-notification-icon family-ld-icon" aria-label="LD">LD</div><div class="family-share-notification-main"><strong>${esc(n.title||"LD - FAMÍLIA")}</strong><span>${esc(n.message||"")}</span><small class="family-notification-sender">Enviado por: ${esc(n.sender_name||"Membro da família")}</small><small class="family-notification-date">${esc(formatFamilyNotificationDate(n.created_at))}</small><div class="family-notification-actions"><button class="ghost-button compact family-notification-delete" data-action="purge-family-notification" data-id="${esc(n.id)}">Excluir definitivamente</button></div></div></div>`).join("");
  return appShell(`${pageHeader("LD - FAMÍLIA","Lixeira de LDs","As LDs excluídas ficam guardadas aqui até serem removidas definitivamente.",`<button type="button" class="ghost-button compact" data-page="familia">Voltar para LD - FAMÍLIA</button>`)}<section class="family-reference-card"><div class="family-trash-header"><div><h3>Lixeira</h3><p class="muted">Você pode excluir uma LD individualmente ou esvaziar a lixeira.</p></div>${trash.length?`<button type="button" class="ghost-button compact family-notification-delete" data-action="empty-family-notification-trash">Esvaziar lixeira</button>`:""}</div><div class="family-share-notification-list">${rows||`<p class="muted">A lixeira está vazia.</p>`}</div></section>`);
}

function getFamilyMemberUpdateNotes(){
  const notes=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
  return notes.filter(n=>{
    if(!n || n.status==="deleted" || n.deleted_at || n.read_at) return false;
    const type=String(n.resource_type||"").toLowerCase();
    const title=String(n.title||"").trim().toLowerCase();
    const message=String(n.message||"").trim().toLowerCase();
    // LDs e mensagens familiares ficam exclusivamente na caixa de LDs, nunca no feed de atualizações.
    if(["family_message","family_invitation","group_invitation","invitation_accepted","family_invitation_accepted","group_invitation_accepted"].includes(type)) return false;
    if(/^(ld\b|ld - família|lidire — família|lidire - família)/i.test(title)) return false;
    if(/\b(ld recebida|mensagem da família|mensagem recebida|li dire — família)\b/i.test(message)) return false;
    return ["shared_resource_update","family_update","commitment","commitment_change","task","shopping","study","workout","goal"].includes(type);
  });
}
function renderFamilyMemberUpdates({onlyWhenPresent=false}={}){
  // Compartilhamento familiar desativado no MVP 1.0.
  return "";
}


function familia(){
  return appShell(`${pageHeader("FAMÍLIA","Compartilhamento familiar","Esta funcionalidade estará disponível em uma versão futura da LiDire.")}
    <section class="content-card" style="text-align:center;padding:28px 20px;">
      <div style="font-size:42px;margin-bottom:12px;" aria-hidden="true">👥</div>
      <h2>Funcionalidade em desenvolvimento</h2>
      <p>O compartilhamento familiar, os grupos, os convites e o envio de notificações entre contas estão temporariamente indisponíveis enquanto trabalhamos para oferecer uma experiência segura e confiável.</p>
      <p class="muted">Seus módulos pessoais continuam disponíveis normalmente. As funções familiares serão anunciadas quando estiverem prontas.</p>
    </section>`);
}


function weatherCodeLabel(code){
  const map={0:"Céu limpo",1:"Predominantemente limpo",2:"Parcialmente nublado",3:"Nublado",45:"Neblina",48:"Neblina com geada",51:"Garoa leve",53:"Garoa moderada",55:"Garoa intensa",61:"Chuva leve",63:"Chuva moderada",65:"Chuva forte",71:"Neve leve",73:"Neve moderada",75:"Neve forte",80:"Pancadas leves",81:"Pancadas moderadas",82:"Pancadas fortes",95:"Trovoada",96:"Trovoada com granizo leve",99:"Trovoada com granizo forte"};
  return map[Number(code)]||"Condição não informada";
}

async function geocodeWeatherLocation(location){
  const q=String(location||"").trim();
  if(!q) throw new Error("Informe uma cidade ou local.");
  const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=pt&format=json`;
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error("Não foi possível localizar esse endereço.");
  const d=await r.json();
  const x=d?.results?.[0];
  if(!x) throw new Error("Não encontrei esse local.");
  return {latitude:Number(x.latitude),longitude:Number(x.longitude),name:x.name||q,country:x.country||"",admin1:x.admin1||""};
}

async function fetchWeatherForLocation(location){
  const place=await geocodeWeatherLocation(location);
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`;
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error("Não foi possível consultar a previsão do tempo.");
  const d=await r.json();
  const forecast=(d.daily?.time||[]).map((date,i)=>({date,code:d.daily.weather_code?.[i],max:d.daily.temperature_2m_max?.[i],min:d.daily.temperature_2m_min?.[i],rain:d.daily.precipitation_probability_max?.[i]}));
  const result={location:place.name+(place.admin1?`, ${place.admin1}`:""),latitude:place.latitude,longitude:place.longitude,current:d.current||{},forecast,fetchedAt:Date.now()};
  state.settings.weather={...state.settings.weather,tempC:Number(d.current?.temperature_2m),current:d.current||{},fetchedAt:Date.now(),available:true,source:"open-meteo",location:result.location,forecast};
  saveState();
  return result;
}

function getCurrentDeviceLocation(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error("Este dispositivo/navegador não oferece geolocalização."));return;}
    navigator.geolocation.getCurrentPosition(
      pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy}),
      err=>reject(new Error(err.code===1?"Permita o acesso à localização para usar esta função.":"Não foi possível obter sua localização agora.")),
      {enableHighAccuracy:true,maximumAge:0,timeout:15000}
    );
  });
}

function formatDurationSeconds(value){
  const m=String(value||"").match(/([0-9]+(?:\\.[0-9]+)?)s/); const sec=m?Math.round(Number(m[1])):0;
  if(!sec) return "—";
  const h=Math.floor(sec/3600), min=Math.round((sec%3600)/60);
  return h?`${h}h ${min}min`:`${min} min`;
}

async function calculateRouteFromAddresses(origin,destination,travelMode="DRIVE",options={}){
  let originValue=origin;
  if(typeof originValue==="string" && ["current_location","current","gps","daqui","onde estou","minha localização"].includes(originValue.toLowerCase().trim())){
    originValue=await getCurrentDeviceLocation();
  }
  const normalizedOrigin=typeof originValue==="object" && Number.isFinite(Number(originValue.latitude)) ? {location:{latLng:{latitude:Number(originValue.latitude),longitude:Number(originValue.longitude)}}} : {address:String(originValue||"")};
  const normalizedDestination=typeof destination==="object" && Number.isFinite(Number(destination.latitude)) ? {location:{latLng:{latitude:Number(destination.latitude),longitude:Number(destination.longitude)}}} : {address:String(destination||"")};
  const payload={origin:normalizedOrigin,destination:normalizedDestination,travelMode};
  if(!payload.destination.address && !(payload.destination.latitude||payload.destination.location)) throw new Error("Informe o endereço de destino.");
  let data=await apiRequest("/api/routes",{method:"POST",timeoutMs:25000,body:JSON.stringify({...payload,departureTime:String(options.departureTime||"")})});
  let suggestedDepartureTime="";
  if(options.arrivalTime){
    const firstSeconds=parseRouteDurationSeconds(data.duration);
    const tentative=subtractSecondsFromLocalDateTime(String(options.date||todayISO()),String(options.arrivalTime),firstSeconds);
    if(tentative){
      let routeForDeparture=data;
      let finalDeparture=tentative;
      if(["DRIVE","TWO_WHEELER"].includes(String(travelMode).toUpperCase())){
        const refined=await apiRequest("/api/routes",{method:"POST",timeoutMs:25000,body:JSON.stringify({...payload,departureTime:tentative.toISOString()})});
        const refinedSeconds=parseRouteDurationSeconds(refined.duration);
        finalDeparture=subtractSecondsFromLocalDateTime(String(options.date||todayISO()),String(options.arrivalTime),refinedSeconds)||tentative;
        routeForDeparture=refined;
      }
      suggestedDepartureTime=formatLocalTime(finalDeparture);
      data={...routeForDeparture,suggestedDepartureTime,arrivalTime:String(options.arrivalTime),departureTime:finalDeparture.toISOString()};
    }
  }
  state.settings.route={last:{...data,origin:payload.origin,destination:payload.destination,travelMode,fetchedAt:Date.now()}};
  saveState();
  return data;
}


function openPlaceForm(existing=null){
  openModal(existing?"Editar lugar":"Cadastrar lugar frequente",
    field("Nome do lugar","name","text",existing?.name||"","required")+
    field("Endereço","address","text",existing?.address||"",'required autocomplete="off" data-address-autocomplete="true"')+
    field("Apelidos (opcional)","aliases","text",(existing?.aliases||[]).join(", "),'placeholder="Ex.: faculdade, campus"')+
    textareaField("Observações","notes",existing?.notes||""),{submit:existing?"Salvar":"Cadastrar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const item=existing||{id:uid("place")};item.name=String(f.get("name")||"").trim();item.address=String(f.get("address")||"").trim();item.aliases=String(f.get("aliases")||"").split(",").map(x=>x.trim()).filter(Boolean);item.notes=String(f.get("notes")||"").trim();if(!item.name||!item.address){toast("Informe nome e endereço.","error");return;}if(!existing)state.data.lugares.unshift(item);saveState();closeModal();render(true);toast(existing?"Lugar atualizado.":"Lugar cadastrado.");};
}
function frequentPlacesSection(){
  const places=state.data.lugares||[];
  return `<section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">📍 Lugares frequentes</div><small>Cadastre locais como trabalho, faculdade, escola do filho ou consultório. A IA poderá usá-los em perguntas de rota.</small></div><button class="primary-button compact" type="button" data-action="add-lugar">+ Cadastrar lugar</button></div>${places.length?`<div class="item-list">${places.map(p=>`<div class="list-item"><div class="module-icon small">📍</div><div class="item-main"><strong>${esc(p.name)}</strong><span>${esc(p.address)}</span>${p.aliases?.length?`<small>${esc(p.aliases.join(" · "))}</small>`:""}</div><div class="item-actions"><button data-action="edit-lugar" data-id="${esc(p.id)}">${icon("edit")}</button><button data-action="delete-lugar" data-id="${esc(p.id)}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum lugar cadastrado ainda.</p>`}</section>`;
}

function climaRotas(){
  const w=state.settings.weather||{}; const route=state.settings.route?.last; const forecast=w.forecast||[];
  return appShell(`${pageHeader("CLIMA E MOBILIDADE","Clima e Rotas","Consulte a previsão e calcule deslocamentos usando o local informado ou a localização do celular.")}
    <section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">🌦️ Clima e previsão</div><small>Você pode informar uma cidade ou endereço. A consulta é feita na internet.</small></div></div>
      <form id="weather-form" class="form-grid"><label class="form-field"><span>Local</span><input name="location" data-address-autocomplete="true" placeholder="Informe uma cidade ou endereço" value="${esc(w.location||"")}" required autocomplete="off"></label><button class="primary-button" type="submit">Consultar clima</button></form>
      ${w.available?`<div class="weather-result-card"><strong>${esc(w.location||"")}</strong><h2>🌡️ ${Math.round(Number(w.tempC||0))}°C</h2><p>${esc(weatherCodeLabel(w.current?.weather_code))}</p>${forecast.length?`<div class="weather-forecast-row">${forecast.slice(0,5).map(x=>`<div><strong>${dateBR(x.date)}</strong><span>${Math.round(Number(x.max||0))}° / ${Math.round(Number(x.min||0))}°</span><small>☔ ${Number(x.rain||0)}%</small></div>`).join("")}</div>`:""}</div>`:""}
    </section>
    <section class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">🧭 Calcular rota</div><small>Use o GPS para sair da sua localização atual ou informe um endereço de origem.</small></div><button class="ghost-button" type="button" data-action="route-use-gps">📍 Usar minha localização</button></div>
      <form id="route-form" class="form-grid"><label class="form-field"><span>Origem</span><input id="route-origin" name="origin" data-address-autocomplete="true" placeholder="Endereço de origem ou 'Minha localização'" autocomplete="off"></label><div class="form-field route-destination-field"><span>Destino</span><div class="route-destination-input-wrap"><input id="route-destination" name="destination" data-address-autocomplete="true" placeholder="Digite um endereço ou local" required autocomplete="off"><button class="route-destination-toggle" type="button" data-action="toggle-route-destinations" aria-label="Mostrar destinos cadastrados" aria-expanded="false">⌄</button><div id="route-destination-menu" class="route-destination-menu" hidden>${(state.data.lugares||[]).length?`<div class="route-destination-menu-title">Destinos cadastrados</div>${(state.data.lugares||[]).map(p=>`<button type="button" class="route-destination-option" data-action="route-select-destination" data-id="${esc(p.id)}"><span class="route-destination-option-icon">📍</span><span><strong>${esc(p.name)}</strong><small>${esc(p.address)}</small></span></button>`).join("")}`:`<div class="route-destination-empty">Nenhum destino cadastrado. Cadastre um lugar abaixo.</div>`}</div></div></div>${selectField("Meio de transporte","travelMode",[{value:"DRIVE",label:"🚗 Carro"},{value:"WALK",label:"🚶 A pé"},{value:"BICYCLE",label:"🚲 Bicicleta"},{value:"TWO_WHEELER",label:"🏍️ Moto"},{value:"TRANSIT",label:"🚌 Transporte público"}],route?.travelMode||"DRIVE")}<button class="primary-button" type="submit">Calcular rota</button></form>
      ${route?`<div class="route-result-card" style="position:relative;padding-top:22px"><button type="button" data-action="route-delete-result" aria-label="Excluir resultado da rota" title="Excluir resultado" style="position:absolute;top:10px;right:10px;width:30px;height:30px;min-width:30px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:inherit;font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:2">×</button><strong>Resultado</strong><h3>⏱️ ${esc(formatDurationSeconds(route.duration))}</h3><p>📏 ${Math.round(Number(route.distanceMeters||0)/100)/10} km · ${esc(({DRIVE:"Carro",WALK:"A pé",BICYCLE:"Bicicleta",TWO_WHEELER:"Moto",TRANSIT:"Transporte público"})[String(route.travelMode||"DRIVE").toUpperCase()]||"Carro")}</p><small>O tempo estimado depende das condições de trânsito e do horário da consulta.</small><div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="ghost-button" data-action="route-open-google-maps">🗺️ Ver rota no Google Maps</button><button type="button" class="ghost-button" data-action="route-open-waze">🚗 Abrir no Waze</button></div></div>`:""}
    </section>
    ${frequentPlacesSection()}`);
}

function bindAddressAutocomplete() {
  document.querySelectorAll('[data-address-autocomplete="true"]').forEach(input => {
    if (input.dataset.autocompleteBound === "true") return;
    input.dataset.autocompleteBound = "true";
    input.setAttribute("autocomplete", "off");
    const wrap = document.createElement("div");
    wrap.className = "lidire-autocomplete-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const list = document.createElement("div");
    list.className = "lidire-autocomplete-list";
    list.hidden = true;
    list.setAttribute("role", "listbox");
    wrap.appendChild(list);
    let timer = null, controller = null, sequence = 0;
    const close = () => { list.hidden = true; list.replaceChildren(); };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      if (controller) controller.abort();
      const value = input.value.trim();
      if (value.length < 3) { close(); return; }
      const current = ++sequence;
      timer = setTimeout(async () => {
        controller = new AbortController();
        try {
          const result = await apiRequest(`/api/places/autocomplete?input=${encodeURIComponent(value)}`, { method: "GET", timeoutMs: 12000, signal: controller.signal });
          if (current !== sequence || input.value.trim() !== value) return;
          list.replaceChildren();
          (result.suggestions || []).forEach(item => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "lidire-autocomplete-option";
            button.setAttribute("role", "option");
            button.textContent = item.text;
            button.addEventListener("click", () => {
              input.value = item.text;
              input.dispatchEvent(new Event("change", { bubbles: true }));
              close();
            });
            list.appendChild(button);
          });
          list.hidden = !list.childElementCount;
        } catch (error) {
          if (error?.name !== "AbortError") close();
        }
      }, 280);
    });
    input.addEventListener("focus", () => { if (list.childElementCount) list.hidden = false; });
    document.addEventListener("click", event => { if (!wrap.contains(event.target)) close(); });
    input.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  });
}

function bindClimateRouteForms(){
  bindAddressAutocomplete();
  const wf=document.getElementById("weather-form");
  if(wf) wf.onsubmit=async e=>{e.preventDefault();const f=new FormData(wf);const location=String(f.get("location")||"").trim();if(!location)return;try{weatherLocationLoading=true;const r=await fetchWeatherForLocation(location);toast(`Clima consultado para ${r.location}.`);render(true);}catch(err){toast(err.message||"Não foi possível consultar o clima.","error");}finally{weatherLocationLoading=false;}};
  const rf=document.getElementById("route-form");
  if(rf) rf.onsubmit=async e=>{e.preventDefault();const f=new FormData(rf);try{routeLoading=true;const origin=String(f.get("origin")||"").trim()||"current_location";const destination=String(f.get("destination")||"").trim();const mode=String(f.get("travelMode")||"DRIVE");await calculateRouteFromAddresses(origin,destination,mode);toast("Rota calculada.");render(true);}catch(err){toast(err.message||"Não foi possível calcular a rota.","error");}finally{routeLoading=false;}};
}

/* =========================================================
   ASSISTENTE
   ========================================================= */

function assistente() {
  const pending=state.data.tarefas.filter(x=>!x.done); const today=state.data.compromissos.filter(x=>x.date===todayISO()); const upcomingAppointments=[...(state.data.compromissos||[])].filter(x=>x.date && x.date>=todayISO()).sort((a,b)=>`${a.date||""} ${a.time||""}`.localeCompare(`${b.date||""} ${b.time||""}`)).slice(0,4); const water=state.data.hidratacao.filter(x=>x.date===todayISO()).reduce((s,x)=>s+Number(x.amount||0),0); const lang=false; const first=(state.user.name||"").split(" ")[0] || (lang?"there":"você");
  return appShell(`
    ${pageHeader("IA", lang?"LiDire Assistant":"Assistente LiDire", lang?"Your intelligent copilot for everything in your routine.":"Seu copiloto inteligente para tudo o que acontece na sua rotina.")}
    <section class="v5-assistant-hero"><button type="button" class="v5-ai-orb" data-action="assistant-focus" aria-label="Assistente LiDire">✦</button><h2>${lang?`Hello, ${esc(first)}`:`Olá, ${esc(first)}`}</h2><p>${lang?"How can I accelerate your day today?":"Como posso acelerar seu dia hoje?"}</p></section>
    <section class="v5-ai-analysis"><div class="v5-ai-icon">▣</div><div><strong>${lang?"I analyzed your priorities.":"Analisei suas prioridades."}</strong><p>${pending.length? (lang?`You have ${pending.length} pending task(s) and ${today.length} commitment(s) today.`:`Você tem ${pending.length} tarefa(s) pendente(s) e ${today.length} compromisso(s) hoje.`):(lang?"Your agenda is clear. I can help you plan the next step.":"Sua agenda está organizada. Posso ajudar a planejar o próximo passo.")}</p></div></section>
    <section class="v5-ai-context-card"><div class="card-toolbar"><div><h3>▣ Próximos compromissos</h3><p class="muted">Compromissos cadastrados que a IA pode consultar.</p></div><button class="ghost-button compact" data-page="compromissos">Ver agenda</button></div>${upcomingAppointments.length?`<div class="item-list">${upcomingAppointments.map(item=>`<div class="list-item"><div class="module-icon small">📅</div><div class="item-main"><strong>${esc(item.title||item.name||"Compromisso")}</strong><span>${dateBR(item.date)}${item.time?` · ${esc(item.time)}`:""}</span>${item.location||item.address?`<small>${esc(item.location||item.address)}</small>`:""}</div></div>`).join("")}</div>`:`<p class="muted">Nenhum compromisso futuro cadastrado.</p>`}</section>
    ${pending[0]?`<section class="v5-ai-context-card"><span class="v5-priority">${lang?"HIGH PRIORITY":"ALTA PRIORIDADE"}</span><h3>✓ ${esc(pending[0].title||pending[0].name||"Tarefa")}</h3><p>${lang?"Pending task from your routine.":"Tarefa pendente da sua rotina."}</p><button class="primary-button compact" data-action="toggle-tarefa" data-id="${pending[0].id}">${lang?"Complete":"Concluir"}</button></section>`:""}
    <section class="v5-ai-context-grid"><div><span>💧</span><strong>${lang?"Hydration":"Hidratação"}</strong><small>${water} ml</small></div><div><span>👥</span><strong>${lang?"Family":"Família"}</strong><small>${state.data.familia.length} ${lang?"members":"membros"}</small></div><div><span>🎯</span><strong>${lang?"Goals":"Objetivos"}</strong><small>${state.data.objetivos.length}</small></div></section>
    <div class="v5-assistant-chat"><div id="assistant-response" class="assistant-response"><strong>✦ LiDire ${false?"AI":"IA"}</strong><p>${lang?"Ask me to organize, prioritize, summarize or connect your routines.":"Peça para eu organizar, priorizar, resumir ou conectar sua rotina."}</p></div></div>
    <div class="v5-assistant-suggestions"><button data-action="recipe-coming-soon">🍳 ${lang?"Create recipe":"Criar receita"}</button><button data-action="assistant-question" data-question="${lang?"What should I prioritize today?":"O que devo priorizar hoje?"}">${lang?"Priorities":"Prioridades"}</button><button data-action="assistant-question" data-question="${lang?"Organize my week":"Organize minha semana"}">${lang?"Organize my week":"Organize minha semana"}</button><button data-action="assistant-question" data-question="${lang?"What can I improve?":"O que posso melhorar?"}">${lang?"Improve":"Melhorar"}</button></div>
    <form id="assistant-question-form" class="v5-assistant-input"><button type="button" data-action="assistant-voice" id="assistant-voice-button">🎙</button><input id="assistant-question-input" type="text" placeholder="${lang?"Talk to LiDire…":"Fale com a LiDire…"}" autocomplete="off"><button type="submit">➤</button></form>
    <label class="assistant-web-toggle"><input id="assistant-web-search" type="checkbox"> <span>🌐 Consultar a internet em tempo real</span><small>Usa a Pesquisa Google e mostra as fontes quando houver consulta.</small></label>
    <div id="assistant-voice-status" class="muted assistant-voice-status">${lang?"Tap the microphone to speak.":"Toque no microfone para falar."}</div>
  `);
}
let lastAssistantResponse = "";
let lastAssistantSources = [];
let lastAssistantLinks = [];
let voiceRecognition = null;

let assistantHistory = [];

function buildAIContext() {
  const limit = (arr, n) => Array.isArray(arr) ? arr.slice(0, n) : [];
  const today = todayISO();
  return {
    user: { name: state.user.name || "", age: state.user.age || "", sex: state.user.sex || "" , weight: state.user.weight || "" },
    homeAddress: String(state.user.address || "").trim(),
    hydrationProfile: state.settings.hydrationProfile,
    today,
    cycleAiContext: !!state.settings.cycleAiContext,
    agenda: limit(state.data.compromissos, 40).map(item => ({
      id: item.id || "", title: item.title || item.name || "Compromisso",
      date: item.date || "", time: item.time || "", location: item.location || "",
      address: item.address || "", notes: item.notes || "", status: item.status || ""
    })),
    tarefas: limit(state.data.tarefas, 60),
    compras: limit(state.data.compras, 30),
    estudos: limit(state.data.estudos, 40),
    treinos: limit(state.data.treinos, 40),
    hidratacao: limit(state.data.hidratacao, 30),
    alimentacao: limit(state.data.alimentacao, 30),
    financas: limit(state.data.financas, 40),
    objetivos: limit(state.data.objetivos, 30),
    familia: limit(state.data.familia, 20),
    lembretes: limit(state.data.lembretes, 30),
    notificacoesFamilia: limit(state.data.notificacoesFamilia, 10),
    lugares: limit(state.data.lugares, 40),
    ciclo: limit (state.settings.cycleAiContext ? state.data.cicloMenstrual : { periodos: [], sintomas: [] }),
    alimentos: limit(state.data.alimentos, 80),
    dietas: limit(state.data.dietas, 30),
    receitas: limit(state.data.receitas, 30)
  };
}

/*
 * Normaliza respostas da IA para que Markdown cru nunca apareça na tela
 * nem seja pronunciado pelo leitor de voz. O Gemini pode retornar **negrito**,
 * *itálico*, headings e listas mesmo quando o aplicativo não usa um renderer
 * de Markdown. A LiDire trabalha com texto simples na conversa.
 */
function cleanAssistantText(value) {
  let text = String(value ?? "").replace(/\r\n?/g, "\n");
  // Remove blocos de código/```, sem apagar o conteúdo útil.
  text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\s*/g, "").replace(/```/g, "");
  // Remove headings Markdown e separadores.
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "");
  // Remove marcadores de ênfase que estavam sendo falados pela voz.
  text = text.replace(/\*\*(.*?)\*\*/g, "$1");
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/(?<!\w)\*(.*?)\*(?!\w)/g, "$1");
  text = text.replace(/(?<!\w)_(.*?)_(?!\w)/g, "$1");
  // Normaliza listas para uma leitura natural.
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/^\s*\d+[.)]\s+/gm, (m) => m.trim() + " ");
  // Evita excesso de linhas em respostas geradas.
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function showAssistantResponse(text, speak = false, sources = [], links = []) {
  const cleanText = cleanAssistantText(text);
  lastAssistantResponse = cleanText;
  lastAssistantSources = Array.isArray(sources) ? sources : [];
  lastAssistantLinks = Array.isArray(links) ? links : [];
  const box = document.getElementById("assistant-response");
  if (box) {
    const linkHtml = lastAssistantLinks.length
      ? `<div class="assistant-result-links">${lastAssistantLinks.map(x => `<button type="button" class="ghost-button compact" data-action="assistant-open-module" data-page="${esc(x.page)}">${esc(x.label)}</button>`).join("")}</div>`
      : "";
    const sourceHtml = lastAssistantSources.length
      ? `<div class="assistant-sources"><strong>🌐 Fontes consultadas</strong>${lastAssistantSources.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title || x.url)}</a>`).join("")}</div>`
      : "";
    box.innerHTML = `<strong>✦ LiDire ${false?"AI":"IA"}</strong><p>${esc(cleanText).replaceAll("\n", "<br>")}</p>${linkHtml}${sourceHtml}`;
  }
  if (speak && cleanText && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = false ? "en-US" : "pt-BR";
    utterance.rate = 1.08;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}


function normalizeFoodName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function calculateFoodCaloriesFromAction(action) {
  const total = Number(action.totalCalories || 0);
  const qty = Number(action.forQuantity || 0);
  const unit = String(action.quantityUnit || action.unit || "g").toLowerCase();
  if (Number(action.caloriesPer100) > 0) {
    return Math.round(Number(action.caloriesPer100));
  }
  if (!(total > 0 && qty > 0)) return 0;
  if (unit === "kg") return Math.round((total / (qty * 1000)) * 100);
  if (unit === "l") return Math.round((total / (qty * 1000)) * 100);
  if (unit === "g" || unit === "ml") return Math.round((total / qty) * 100);
  return Math.round(total / qty);
}


function normalizeAssistantTargetText(value) {
  return normalizeFoodName(String(value || ""));
}

function resolveAssistantItem(action) {
  const type=String(action?.type||"").toLowerCase();
  const targetId=String(action?.targetId||action?.id||"").trim();
  const title=normalizeAssistantTargetText(action?.title||action?.name||"");
  if (type.includes("task")) {
    let item=targetId ? state.data.tarefas.find(x=>x.id===targetId) : null;
    if(!item && title) item=state.data.tarefas.find(x=>normalizeAssistantTargetText(x.title||x.name)===title);
    return item ? {collection:"tarefas",item} : null;
  }
  if (type.includes("reminder")) {
    let item=targetId ? state.data.lembretes.find(x=>x.id===targetId) : null;
    if(!item && title) item=state.data.lembretes.find(x=>normalizeAssistantTargetText(x.title||x.name)===title);
    return item ? {collection:"lembretes",item} : null;
  }
  return null;
}

function resolveAssistantGoal(action) {
  const targetId=String(action?.targetId||action?.goalId||action?.id||"").trim();
  const title=normalizeAssistantTargetText(action?.title||action?.name||action?.goalTitle||"");
  let goal=targetId ? (state.data.objetivos||[]).find(x=>x.id===targetId) : null;
  if(!goal && title) goal=(state.data.objetivos||[]).find(x=>normalizeAssistantTargetText(x.title||x.name)===title);
  if(!goal && title) goal=(state.data.objetivos||[]).find(x=>normalizeAssistantTargetText(x.title||x.name).includes(title) || title.includes(normalizeAssistantTargetText(x.title||x.name)));
  return goal || null;
}

function resolveSavedDestination(value) {
  const raw=String(value||"").trim();
  if(!raw) return "";
  const key=normalizeAssistantTargetText(raw);
  if (["casa", "minha casa", "endereco de casa", "endereco da minha casa", "meu endereco residencial", "residencia"].includes(key)) {
    const homeAddress = String(state.user?.address || "").trim();
    if (homeAddress) return homeAddress;
  }
  const place=(state.data.lugares||[]).find(p=>normalizeAssistantTargetText(p.name)===key || (p.aliases||[]).some(a=>normalizeAssistantTargetText(a)===key));
  if(place?.address) return place.address;
  const family=(state.data.familia||[]).find(p=>normalizeAssistantTargetText(p.name)===key || normalizeAssistantTargetText(`casa da ${p.name||""}`)===key);
  if(family?.address) return family.address;
  return raw;
}

function parseRouteDurationSeconds(value){
  const m=String(value||"").match(/([0-9]+(?:\.[0-9]+)?)s/); return m?Math.round(Number(m[1])):0;
}
function localDateTimeToISO(date,time){
  const d=new Date(`${date||todayISO()}T${time||"17:00"}:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
function subtractSecondsFromLocalDateTime(date,time,seconds){
  const d=new Date(`${date||todayISO()}T${time||"17:00"}:00`);
  if(Number.isNaN(d.getTime())) return "";
  d.setSeconds(d.getSeconds()-Number(seconds||0));
  return d;
}
function formatLocalTime(d){return d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}

function openAssistantChangeConfirmation(actions,speak=false){
  const items=actions.map(a=>{
    const type=String(a.type||"");
    const resolved=resolveAssistantItem(a);
    const item=resolved?.item;
    if(type==="delete_task" || type==="delete_reminder") return `<div class="assistant-confirm-item"><strong>🗑 Excluir ${type.endsWith("task")?"tarefa":"lembrete"}</strong><span>${esc(item?.title||item?.name||a.title||a.name||"Item")}</span><small>Esta ação removerá o registro.</small></div>`;
    if(type==="complete_task" || type==="complete_reminder") return `<div class="assistant-confirm-item"><strong>✓ Marcar como concluído</strong><span>${esc(item?.title||item?.name||a.title||a.name||"Item")}</span><small>A LiDire atualizará o status deste registro.</small></div>`;
    if(type==="create_task") return `<div class="assistant-confirm-item"><strong>✓ Tarefa</strong><span>${esc(a.title||a.name||"Tarefa")}</span><small>${dateBR(a.date||todayISO())}${a.time?` · ${esc(a.time)}`:""} · prioridade ${esc(a.priority||"normal")}</small></div>`;
    return `<div class="assistant-confirm-item"><strong>🔔 Lembrete</strong><span>${esc(a.title||a.name||"Lembrete")}</span><small>${dateBR(a.date||todayISO())} às ${esc(a.time||"08:00")}${a.repeat&&a.repeat!=="once"?` · ${esc(a.repeat)}`:""}</small></div>`;
  }).join("");
  openModal("Confirmar ação da IA",`<p>A LiDire preparou a seguinte alteração:</p>${items}<p class="muted">Nada será alterado até você tocar em <strong>Confirmar</strong>.</p>`,{submit:"Confirmar"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault(); const executed=[];
    for(const action of actions){
      const type=String(action.type||"");
      if(type==="create_task"){
        const title=String(action.title||action.name||"").trim(); if(!title) continue;
        state.data.tarefas.push({id:uid("t"),title,priority:String(action.priority||"normal").toLowerCase(),date:String(action.date||todayISO()),time:String(action.time||""),done:false});
        executed.push(`Tarefa “${title}” cadastrada.`);
      } else if(type==="create_reminder"){
        const title=String(action.title||action.name||"Lembrete").trim(); const date=String(action.date||todayISO()); const time=String(action.time||"08:00");
        state.settings.notifications.enabled=true; state.settings.notifications.sound=true;
        state.data.lembretes.unshift({id:uid("rem"),title,date,time,repeat:["once","daily","weekdays","weekly"].includes(String(action.repeat||"once"))?String(action.repeat||"once"):"once",endDate:"",mode:"beep",message:String(action.message||title),audioId:"",sourceType:"ai",sourceId:"",done:false,paused:false});
        executed.push(`Lembrete “${title}” cadastrado para ${dateBR(date)} às ${time}.`);
      } else if(["delete_task","delete_reminder","complete_task","complete_reminder"].includes(type)){
        const resolved=resolveAssistantItem(action);
        if(!resolved){ executed.push(`Não encontrei “${action.title||action.name||"esse item"}”.`); continue; }
        if(type.startsWith("delete_")){
          state.data[resolved.collection]=state.data[resolved.collection].filter(x=>x.id!==resolved.item.id);
          executed.push(`${resolved.collection==="tarefas"?"Tarefa":"Lembrete"} “${resolved.item.title||resolved.item.name}” excluído.`);
        } else {
          resolved.item.done=true;
          if(resolved.collection==="lembretes") resolved.item.paused=true;
          executed.push(`${resolved.collection==="tarefas"?"Tarefa":"Lembrete"} “${resolved.item.title||resolved.item.name}” marcado como concluído.`);
        }
      }
    }
    saveState(); closeModal(); render();
    const text=executed.join("\n"); assistantHistory.push({role:"model",text}); assistantHistory=assistantHistory.slice(-8); showAssistantResponse(text,speak);
    if("Notification" in window && Notification.permission!=="granted") requestNotificationPermission();
  };
}

function assistantModuleLinks(actions) {
  const map = new Map([
    ["create_appointment", ["Agenda", "compromissos"]],
    ["create_study", ["Ver em Estudos", "estudos"]],
    ["create_shopping_list", ["Ver em Compras", "compras"]],
    ["create_workout", ["Ver em Treinos", "treinos"]],
    ["log_hydration", ["Ver em Hidratação", "hidratacao"]],
    ["create_meal", ["Ver em Alimentação", "alimentacao"]],
    ["create_finance", ["Ver em Finanças", "financas"]],
    ["create_goal", ["Ver em Objetivos", "objetivos"]],
    ["update_goal_savings", ["Ver em Objetivos", "objetivos"]],
    ["upsert_food", ["Ver em Alimentação", "alimentacao"]],
    ["update_food", ["Ver em Alimentação", "alimentacao"]],
    ["create_recipe", ["Ver em Receitas", "receitas"]],
    ["add_family_member", ["Ver em Família", "familia"]],
    ["log_cycle_start", ["Ver ciclo menstrual", "cicloMenstrual"]],
    ["log_cycle_symptom", ["Ver ciclo menstrual", "cicloMenstrual"]],
    ["upsert_place", ["Ver lugares frequentes", "climaRotas"]]
  ]);
  const out = [];
  for (const action of Array.isArray(actions) ? actions : []) {
    const x = map.get(String(action?.type || "").toLowerCase());
    if (x && !out.some(y => y.page === x[1])) out.push({ label: x[0], page: x[1] });
  }
  return out;
}

async function executeAssistantActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return [];
  const done = [];
  let changed = false;

  for (const raw of actions.slice(0, 5)) {
    const action = raw && typeof raw === "object" ? raw : {};
    const type = String(action.type || "").toLowerCase().trim();

    if (["create_task","create_reminder","delete_task","delete_reminder","complete_task","complete_reminder","update_goal_savings"].includes(type)) {
      // A LiDire Quinto nunca grava uma tarefa/lembrete vindo da IA sem
      // confirmação explícita. answerAssistant abre o modal de confirmação.
      continue;
    }

    if (type === "create_appointment") {
      const title = String(action.title || action.name || "").trim();
      if (!title) continue;
      const item = {
        id: uid("c"),
        title,
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        location: String(action.location || ""),
        address: String(action.address || "")
      };
      state.data.compromissos.unshift(item);
      done.push(`Compromisso “${title}” registrado na Agenda.`);
      changed = true;
      continue;
    }

    if (type === "create_study") {
      const subject = String(action.subject || action.name || action.title || "").trim();
      if (!subject) continue;
      const item = {
        id: uid("e"),
        subject,
        topic: String(action.topic || ""),
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        duration: Number(action.duration || 0) || 0,
        effectiveDuration: "",
        notes: String(action.notes || ""),
        link: String(action.link || ""),
        done: false
      };
      state.data.estudos.unshift(item);
      done.push(`Estudo “${subject}” registrado em Estudos.`);
      changed = true;
      continue;
    }

    if (type === "create_shopping_list") {
      const name = String(action.name || action.title || "Lista de compras").trim();
      const rawItems = Array.isArray(action.items) ? action.items : [];
      const items = rawItems.map(item => {
        if (typeof item === "string") return { id: uid("item"), name: item.trim(), quantity: "", category: "Geral", done: false };
        return {
          id: uid("item"),
          name: String(item?.name || "").trim(),
          quantity: String(item?.quantity || ""),
          category: String(item?.category || "Geral"),
          done: false
        };
      }).filter(item => item.name);
      const list = { id: uid("lista"), name, items, createdAt: new Date().toISOString() };
      state.data.compras.unshift(list);
      done.push(`Lista “${name}” registrada em Compras${items.length ? ` com ${items.length} item(ns)` : ""}.`);
      changed = true;
      continue;
    }

    if (type === "create_workout") {
      const name = String(action.name || action.title || "").trim();
      if (!name) continue;
      state.data.treinos.unshift({
        id: uid("tr"),
        name,
        type: String(action.workoutType || ""),
        duration: String(action.duration || ""),
        distance: String(action.distance || ""),
        pace: String(action.pace || ""),
        observations: String(action.observations || action.notes || ""),
        date: String(action.date || todayISO()),
        time: String(action.time || ""),
        completed: false,
        completedAt: "",
        exercises: []
      });
      done.push(`Treino “${name}” registrado em Treinos.`);
      changed = true;
      continue;
    }

    if (type === "log_hydration") {
      const amount = Number(action.amount || 0);
      if (!(amount > 0)) continue;
      state.data.hidratacao.unshift({
        id: uid("h"),
        amount,
        date: String(action.date || todayISO()),
        createdAt: new Date().toISOString()
      });
      done.push(`${amount} ml de água registrados em Hidratação.`);
      changed = true;
      continue;
    }

    if (type === "create_meal") {
      const name = String(action.name || action.title || "Refeição").trim();
      const foods = Array.isArray(action.foods) ? action.foods.map(food => ({
        name: String(food?.name || "").trim(),
        quantity: String(food?.quantity || ""),
        unit: String(food?.unit || "g"),
        calories: Number(food?.calories || 0) || 0,
        calorieMode: "manual"
      })).filter(food => food.name) : [];
      state.data.alimentacao.unshift({
        id: uid("meal"),
        name,
        time: String(action.time || ""),
        date: String(action.date || todayISO()),
        foods
      });
      done.push(`Refeição “${name}” registrada em Alimentação.`);
      changed = true;
      continue;
    }

    if (type === "create_finance") {
      const title = String(action.title || action.name || "").trim();
      const value = Number(action.value || 0);
      if (!title || !Number.isFinite(value)) continue;
      state.data.financas.unshift({
        id: uid("f"),
        type: String(action.financeType || "despesa"),
        title,
        value,
        category: String(action.category || "Geral"),
        currency: String(action.currency || "BRL"),
        date: String(action.date || todayISO()),
        createdAt: new Date().toISOString()
      });
      done.push(`Lançamento “${title}” registrado em Finanças.`);
      changed = true;
      continue;
    }

    if (type === "create_goal") {
      const title = String(action.title || action.name || "").trim();
      if (!title) continue;
      const goal = {
        id: uid("o"),
        title,
        deadline: String(action.deadline || ""),
        progress: Number(action.progress || 0) || 0,
        moneyGoal: Number(action.moneyGoal || 0) || 0,
        moneyCurrency: String(action.moneyCurrency || "BRL"),
        financeCategory: String(action.financeCategory || ""),
        observations: String(action.observations || action.notes || ""),
        metas: []
      };
      updateGoalProgress(goal);
      state.data.objetivos.unshift(goal);
      done.push(`Objetivo “${title}” criado em Objetivos.`);
      changed = true;
      continue;
    }

    if (type === "upsert_food" || type === "update_food") {
      const name = String(action.name || action.title || "").trim();
      if (!name) continue;
      if (!Array.isArray(state.data.alimentos)) state.data.alimentos = [];
      const key = normalizeFoodName(name);
      let food = state.data.alimentos.find(item => normalizeFoodName(item.name) === key);
      const calories = calculateFoodCaloriesFromAction(action);
      const unit = String(action.quantityUnit || action.unit || food?.unit || "g").toLowerCase();
      if (!food) {
        food = { id: uid("food"), name, unit: ["g","kg","ml","L","unidade","porção"].includes(unit) ? unit : "g", calories: calories || 0 };
        state.data.alimentos.push(food);
        done.push(calories ? `Alimento “${name}” cadastrado com ${calories} kcal por 100 ${food.unit === "ml" ? "ml" : food.unit === "g" ? "g" : food.unit}.` : `Alimento “${name}” cadastrado.`);
      } else {
        food.name = name;
        if (["g","kg","ml","L","unidade","porção"].includes(unit)) food.unit = unit;
        if (calories > 0) food.calories = calories;
        done.push(calories ? `Calorias de “${name}” atualizadas para ${calories} kcal por 100 ${food.unit === "ml" ? "ml" : food.unit === "g" ? "g" : food.unit}.` : `Alimento “${name}” atualizado.`);
      }
      changed = true;
      continue;
    }

    if (type === "log_cycle_start") {
      if (!state.settings.cycleAiContext && !String(action.date||action.start||"").trim()) continue;
      const start=String(action.date||action.start||todayISO());
      const end=String(action.end||"");
      const record={id:uid("cycle"),start,end,flow:String(action.flow||"Moderado"),duration:start&&end?Math.max(1,daysBetween(start,end)+1):"",notes:String(action.notes||""),createdAt:new Date().toISOString(),source:"assistant"};
      if(!state.data.cicloMenstrual) state.data.cicloMenstrual={periodos:[],sintomas:[]};
      state.data.cicloMenstrual.periodos=[record,...(state.data.cicloMenstrual.periodos||[])];
      done.push(`Registro menstrual de ${dateBR(start)} salvo.`); changed=true; continue;
    }

    if (type === "log_cycle_symptom") {
      const info=cycleInfo();
      const record={id:uid("symptom"),date:String(action.date||todayISO()),phase:info.phase,mood:String(action.mood||"Neutro"),pain:String(action.pain||"Baixa"),cramps:String(action.cramps||"Baixa"),acne:String(action.acne||"Baixa"),physicalEnergy:String(action.physicalEnergy||"Moderada"),mentalEnergy:String(action.mentalEnergy||"Moderada"),notes:String(action.notes||""),createdAt:new Date().toISOString(),source:"assistant"};
      if(!state.data.cicloMenstrual) state.data.cicloMenstrual={periodos:[],sintomas:[]};
      state.data.cicloMenstrual.sintomas=[record,...(state.data.cicloMenstrual.sintomas||[])];
      done.push("Registro de humor, dor e sintomas salvo no ciclo."); changed=true; continue;
    }

    if (type === "add_family_member") {
      const name = String(action.name || action.title || "").trim();
      const email = String(action.email || "").trim();
      if (!name || !email) continue;
      const permissions = Array.isArray(action.permissions)
        ? Object.fromEntries(action.permissions.map(k => [k, true]))
        : (action.permissions && typeof action.permissions === "object" ? action.permissions : {});
      const person = {
        id: uid("family"),
        name,
        relation: String(action.relation || "Membro"),
        email,
        address: String(action.address || ""),
        // B2: o assistente não pode conceder compartilhamento; o titular confirma em Família > Editar.
        permissions: {agenda:false,tarefas:false,shareTasksData:false,compras:false,estudos:false,treinos:false,hidratacao:false,alimentacao:false,financas:false,objetivos:false,cicloMenstrual:false,lembretes:false},
        inviteStatus: "local"
      };
      const requestedPermissions = Object.keys(permissions).filter(k => permissions[k] === true);
      try {
        const check = await apiRequest(`/api/family/check-email?email=${encodeURIComponent(email)}`, { method: "GET" });
        if (check?.alreadyFamilyMember) {
          syncFamilyMemberFromServer(check.familyMember);
          changed = true;
          done.push(`O e-mail ${email} já estava cadastrado na sua família como ${check.familyMember?.name || "membro"}. O cadastro existente foi sincronizado e agora deve aparecer na lista.`);
          continue;
        }
        const saved = await apiRequest("/api/family/members", { method: "POST", body: JSON.stringify(person) });
        if (!saved?.member?.id) throw new Error("O servidor não confirmou o cadastro do familiar.");
        person.serverId = saved.member.id;
        person.inviteStatus = saved.member.status || (check?.accountExists ? "active" : "pending");
        state.data.familia.unshift(person);
        done.push(check?.accountExists
          ? `Membro ${name} cadastrado e vinculado à conta LiDire de ${email}.`
          : `Membro ${name} cadastrado. O e-mail ${email} ainda não possui uma conta LiDire.`);
        if (requestedPermissions.length) done.push(`Nenhum compartilhamento foi ativado para ${name}: abra Família > Editar e marque você mesmo o que deseja compartilhar.`);
        changed = true;
      } catch (e) {
        done.push(e?.message || `Não foi possível cadastrar ${name}.`);
      }
      continue;
    }

    if (type === "send_family_notification") {
      try{
        const data=await apiRequest("/api/family/notifications",{method:"POST",body:JSON.stringify({memberId:String(action.memberId||""),recipientEmail:String(action.recipientEmail||action.email||""),title:String(action.title||"LiDire — Família"),message:String(action.message||"")})});
        done.push(data?.notification?"Notificação enviada para o familiar.":"Notificação processada.");
      }catch(e){done.push(e?.message||"Não foi possível enviar a notificação.");}
      continue;
    }


    if (type === "upsert_place") {
      const name=String(action.name||action.title||"").trim(); const address=String(action.address||"").trim();
      if(!name||!address) continue;
      if(!Array.isArray(state.data.lugares)) state.data.lugares=[];
      const key=normalizeAssistantTargetText(name);
      let place=state.data.lugares.find(x=>normalizeAssistantTargetText(x.name)===key);
      if(!place){ place={id:uid("place"),name,address,aliases:Array.isArray(action.aliases)?action.aliases:[],notes:String(action.notes||"")}; state.data.lugares.unshift(place); done.push(`Lugar “${name}” cadastrado.`); }
      else { place.address=address; place.aliases=Array.isArray(action.aliases)?action.aliases:place.aliases||[]; place.notes=String(action.notes||place.notes||""); done.push(`Endereço de “${name}” atualizado.`); }
      changed=true; continue;
    }

    if (type === "weather_lookup") {
      try{const result=await fetchWeatherForLocation(String(action.location||""));const temp=Number(result.current?.temperature_2m);const label=weatherCodeLabel(result.current?.weather_code);done.push(`Em ${result.location}, agora faz ${Math.round(temp)}°C e está ${label.toLowerCase()}.`);}catch(e){done.push(e?.message||"Não foi possível consultar o clima.");}
      continue;
    }

    if (type === "route_lookup") {
      try{
        const originRaw=String(action.origin||"current_location");
        const originKey=normalizeAssistantTargetText(originRaw);
        const origin=["current_location","current","gps","daqui","de onde estou","minha localizacao"].includes(originKey) ? "current_location" : resolveSavedDestination(originRaw);
        const destination=resolveSavedDestination(String(action.destination||""));
        const date=String(action.date||todayISO());
        const arrivalTime=String(action.arrivalTime||"");
        const result=await calculateRouteFromAddresses(origin,destination,String(action.travelMode||"DRIVE"),{date,arrivalTime});
        const base=`A rota está estimada em ${Math.round(Number(result.distanceMeters||0)/100)/10} km e ${formatDurationSeconds(result.duration)}.`;
        done.push(arrivalTime && result.suggestedDepartureTime ? `${base} Para chegar por volta das ${arrivalTime}, a saída estimada é ${result.suggestedDepartureTime}. A estimativa considera o trânsito disponível no momento da consulta.` : base);
      }catch(e){done.push(e?.message||"Não foi possível calcular a rota.");}
      continue;
    }

    if (type === "create_recipe") {
      const name = String(action.name || action.title || "Receita").trim();
      const ingredients = Array.isArray(action.ingredients) ? action.ingredients.map(x => String(x || "").trim()).filter(Boolean) : [];
      const instructions = String(action.instructions || "").trim();
      if (!name || !ingredients.length || !instructions) continue;
      if (!Array.isArray(state.data.receitas)) state.data.receitas = [];
      const existing = state.data.receitas.find(r => normalizeFoodName(r.name) === normalizeFoodName(name));
      const recipe = {
        id: existing?.id || uid("recipe"),
        name,
        ingredients,
        instructions,
        servings: Number(action.servings || 0) || 0,
        calories: Number(action.calories || 0) || 0,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (existing) Object.assign(existing, recipe); else state.data.receitas.unshift(recipe);
      done.push(`Receita “${name}” salva na biblioteca.`);
      changed = true;
    }
  }

  if (changed) {
    saveState();
    render();
  }
  return done;
}

function openAssistantActionConfirmation(actions, speak=false){
  const items=actions.map(a=>{
    const type=String(a.type||"");
    if(type==="update_goal_savings"){
      const goal=resolveAssistantGoal(a); const amount=Math.max(0,Number(a.amount||0));
      const current=Math.max(0,Number(goal?.moneyAccumulated||0));
      const next=Math.min(Number(goal?.moneyGoal||0)||Infinity,current+amount);
      return `<div class="assistant-confirm-item"><strong>🎯 Valor arrecadado</strong><span>${esc(goal?.title||a.title||a.goalTitle||"Objetivo")}</span><small>Adicionar ${money(amount,a.currency||goal?.moneyCurrency||"BRL")} · total arrecadado: ${money(next,a.currency||goal?.moneyCurrency||"BRL")}</small></div>`;
    }
    if(type==="create_task") return `<div class="assistant-confirm-item"><strong>✓ Tarefa</strong><span>${esc(a.title||a.name||"Tarefa")}</span><small>${dateBR(a.date||todayISO())}${a.time?` · ${esc(a.time)}`:""} · prioridade ${esc(a.priority||"normal")}</small></div>`;
    return `<div class="assistant-confirm-item"><strong>🔔 Lembrete</strong><span>${esc(a.title||a.name||"Lembrete")}</span><small>${dateBR(a.date||todayISO())}${a.time?` às ${esc(a.time)}`:""}${a.repeat&&a.repeat!=="once"?` · ${esc(a.repeat)}`:""}</small></div>`;
  }).join("");
  openModal("Confirmar ação da IA",`<p>A LiDire preparou a seguinte alteração:</p>${items}<p class="muted">Nada será alterado até você tocar em <strong>Confirmar</strong>.</p>`,{submit:"Confirmar"});
  if(speak && "speechSynthesis" in window){
    const a=actions.find(x=>String(x?.type||"")==="update_goal_savings");
    if(a){
      const goal=resolveAssistantGoal(a); const amount=Math.max(0,Number(a.amount||0));
      const next=Math.min(Number(goal?.moneyGoal||0)||Infinity,(Number(goal?.moneyAccumulated||0)||0)+amount);
      const phrase=`Vou incluir ${money(amount,a.currency||goal?.moneyCurrency||"BRL")} arrecadados no objetivo ${goal?.title||a.title||""}. O valor arrecadado ficará em ${money(next,a.currency||goal?.moneyCurrency||"BRL")}. Confirma?`;
      window.speechSynthesis.cancel(); const utterance=new SpeechSynthesisUtterance(phrase); utterance.lang="pt-BR"; window.speechSynthesis.speak(utterance);
    }
  }
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault(); const executed=[];
    for(const action of actions){
      const type=String(action.type||"");
      if(type==="update_goal_savings"){
        const goal=resolveAssistantGoal(action); const amount=Math.max(0,Number(action.amount||0));
        if(!goal || !(amount>0)){ executed.push(`Não encontrei o objetivo “${action.title||action.goalTitle||"informado"}”.`); continue; }
        goal.moneyAccumulated=Math.max(0,Number(goal.moneyAccumulated)||0)+amount; updateGoalProgress(goal);
        executed.push(`Foram incluídos ${money(amount,goal.moneyCurrency||"BRL")} arrecadados no objetivo “${goal.title}”. Agora faltam ${money(goal.moneyRemaining,goal.moneyCurrency||"BRL")}.`);
      } else if(type==="create_task"){
        const title=String(action.title||action.name||"").trim(); if(!title) continue;
        state.data.tarefas.push({id:uid("t"),title,priority:String(action.priority||"normal").toLowerCase(),date:String(action.date||todayISO()),time:String(action.time||""),done:false});
        executed.push(`Tarefa “${title}” cadastrada.`);
      } else if(type==="create_reminder"){
        const title=String(action.title||action.name||"Lembrete").trim(); const date=String(action.date||todayISO()); const time=String(action.time||"");
        state.settings.notifications.enabled=true; state.settings.notifications.sound=true;
        state.data.lembretes.unshift({id:uid("rem"),title,date,time,repeat:["once","daily","weekdays","weekly"].includes(String(action.repeat||"once"))?String(action.repeat||"once"):"once",endDate:"",mode:"beep",message:String(action.message||title),audioId:"",sourceType:"ai",sourceId:"",done:false,paused:false});
        executed.push(`Lembrete “${title}” cadastrado para ${dateBR(date)}${time?` às ${time}`:""}.`);
      }
    }
    saveState(); closeModal(); render(); const text=executed.join("\n"); assistantHistory.push({role:"model",text}); assistantHistory=assistantHistory.slice(-8); showAssistantResponse(text,speak);
    if("Notification" in window && Notification.permission!=="granted") requestNotificationPermission();
  };
}

async function answerAssistant(question, speak = false) {
  const q = String(question || "").trim();
  if (!q) return;
  const box = document.getElementById("assistant-response");
  const input = document.getElementById("assistant-question-input");
  if (input) input.value = q;
  if (box) box.innerHTML = `<strong>✦ LiDire ${false?"AI":"IA"}</strong><p class="assistant-thinking">Pensando com base na sua rotina…</p>`;

  try {
    const data = await apiRequest("/api/ai/assistant", {
      method: "POST",
      body: JSON.stringify({
        question: q,
        language: false ? "en-US" : "pt-BR",
        useWeb: !!document.getElementById("assistant-web-search")?.checked,
        context: buildAIContext(),
        history: assistantHistory
      })
    });
    const response = String(data.text || "").trim();
    const allActions = Array.isArray(data.actions) ? data.actions : [];
    const webSources = Array.isArray(data.sources) ? data.sources : [];
    const confirmTypes=["create_task","create_reminder","delete_task","delete_reminder","complete_task","complete_reminder","update_goal_savings"];
    const confirmable = allActions.filter(a => confirmTypes.includes(String(a?.type||"").toLowerCase()));
    const immediate = allActions.filter(a => !confirmTypes.includes(String(a?.type||"").toLowerCase()));
    for(const a of confirmable){
      if(["delete_task","delete_reminder","complete_task","complete_reminder"].includes(String(a?.type||"").toLowerCase())){
        const resolved=resolveAssistantItem(a);
        if(resolved && !a.targetId) a.targetId=resolved.item.id;
      }
    }
    const executed = await executeAssistantActions(immediate);
    const resultLinks = assistantModuleLinks(immediate);
    let finalResponse = response;
    if (executed.length) {
      const executionSummary = executed.join("\n");
      if (!finalResponse) finalResponse = executionSummary;
      else if (!executed.every(item => finalResponse.includes(item))) finalResponse += `\n\n${executionSummary}`;
    }
    assistantHistory.push({ role: "user", text: q });
    if (confirmable.length) {
      finalResponse += (finalResponse?"\n\n":"") + "Preparei a tarefa/lembrete, mas preciso da sua confirmação antes de cadastrar.";
      showAssistantResponse(finalResponse, false, webSources, resultLinks);
      openAssistantActionConfirmation(confirmable, speak);
      return;
    }
    assistantHistory.push({ role: "model", text: finalResponse });
    assistantHistory = assistantHistory.slice(-8);
    showAssistantResponse(finalResponse, speak, webSources, resultLinks);
  } catch (error) {
    console.error("LiDire AI:", error);
    const message = error?.data?.message || "Não consegui conectar à IA agora. Verifique a configuração do Gemini no Worker.";
    showAssistantResponse(message, false);
  }
}

function startAssistantVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    toast("Seu navegador não oferece reconhecimento de voz. Tente usar o Chrome no celular.", "error");
    return;
  }
  if (voiceRecognition) {
    voiceRecognition.stop();
    voiceRecognition = null;
    return;
  }
  voiceRecognition = new Recognition();
  voiceRecognition.lang = "pt-BR";
  voiceRecognition.interimResults = false;
  voiceRecognition.continuous = false;
  const status = document.getElementById("assistant-voice-status");
  const button = document.getElementById("assistant-voice-button");
  if (status) status.textContent = "Ouvindo… fale agora.";
  if (button) { button.textContent = "⏹️"; button.setAttribute("aria-label", "Parar de ouvir"); }
  voiceRecognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    const input = document.getElementById("assistant-question-input");
    if (input) input.value = transcript;
    answerAssistant(transcript, true);
    if (status) status.textContent = `Você disse: “${transcript}”`;
  };
  voiceRecognition.onerror = () => {
    if (status) status.textContent = "Não consegui ouvir. Verifique a permissão do microfone e tente novamente.";
  };
  voiceRecognition.onend = () => {
    voiceRecognition = null;
    if (button) { button.textContent = "🎙️"; button.setAttribute("aria-label", "Falar com a LiDire"); }
  };
  voiceRecognition.start();
}

/* =========================================================
   EXPLORAR
   ========================================================= */

function explorar() {
  return appShell(`

    ${pageHeader(
      "LIDIRE",
      "Tudo em um só lugar",
      "Conheça os espaços que ajudam a transformar rotina em clareza."
    )}

    <div class="explore-grid">

      ${modules.map(moduleCard).join("")}

      <button
        class="module-card featured"
        data-page="assistente"
      >

        <span class="module-icon">
          ✦
        </span>

        <span class="module-content">

          <strong>
            Assistente LiDire
          </strong>

          <small>
            Seu copiloto para organizar a rotina.
          </small>

        </span>

        <span class="module-arrow">
          ${icon("arrow")}
        </span>

      </button>

    </div>

  `);
}

/* =========================================================
   CICLO MENSTRUAL
   ========================================================= */

function daysBetween(a, b) {
  if (!a || !b) return null;
  const start = new Date(a + "T12:00:00");
  const end = new Date(b + "T12:00:00");
  return Math.round((end - start) / 86400000);
}

function cycleInfo(date = todayISO()) {
  const periods = [...(state.data.cicloMenstrual?.periodos || [])].filter(x => x.start).sort((a,b) => String(b.start).localeCompare(String(a.start)));
  const last = periods[0];
  if (!last) return { hasData:false, day:null, phase:"Sem registro", next:null, start:null };
  const length = Math.max(21, Math.min(45, Number(state.settings.cycleLength) || 28));
  const diff = daysBetween(last.start, date);
  if (diff == null) return { hasData:false, day:null, phase:"Sem registro", next:null, start:last.start };
  const day = ((diff % length) + length) % length + 1;
  const ovulationDay = Math.max(10, length - 14);
  let phase = "Fase folicular";
  if (day <= Math.max(1, Number(state.settings.periodLength) || 5)) phase = "Menstrual";
  else if (day >= ovulationDay - 4 && day <= ovulationDay + 1) phase = "Ovulatória / fértil";
  else if (day > ovulationDay + 1) phase = "Fase lútea";
  const nextDate = new Date(last.start + "T12:00:00");
  nextDate.setDate(nextDate.getDate() + length);
  return { hasData:true, day, phase, next:nextDate.toISOString().slice(0,10), start:last.start, length };
}

function cycleTrendSummary() {
  const logs = state.data.cicloMenstrual?.sintomas || [];
  const current = cycleInfo();
  if (!current.hasData || !logs.length) return "Registre alguns dias para a LiDire começar a identificar seus próprios padrões.";
  const samePhase = logs.filter(x => x.phase === current.phase);
  if (!samePhase.length) return "Ainda não há registros suficientes nesta fase para identificar um padrão pessoal.";
  const avg = key => samePhase.reduce((sum,x)=>sum + ({Baixa:1,Moderada:2,Intensa:3}[x[key]] || 0),0) / samePhase.filter(x=>x[key]).length;
  const energy = avg("physicalEnergy");
  if (energy) {
    const label = energy < 1.5 ? "baixa" : energy < 2.5 ? "moderada" : "intensa";
    return `Nos seus registros anteriores nesta fase, a energia física apareceu predominantemente ${label}. Isso é um padrão dos seus registros, não uma regra geral.`;
  }
  return "Há registros nesta fase, mas ainda não existe um padrão claro de energia.";
}

function cicloMenstrual() {
  return appShell(`${pageHeader("SAÚDE","Ciclo Menstrual","Este módulo será disponibilizado em uma versão futura da LiDire.")}
    <section class="content-card" style="text-align:center;padding:28px 20px;">
      <div style="font-size:42px;margin-bottom:12px;" aria-hidden="true">🌸</div>
      <h2>Funcionalidade em desenvolvimento</h2>
      <p>O registro e o acompanhamento do ciclo menstrual estão temporariamente indisponíveis. Estamos trabalhando para preparar este módulo com os cuidados necessários de privacidade e proteção dos dados.</p>
    </section>`);
}


function configCicloMenstrual() {
  const last = state.data.cicloMenstrual?.periodos?.[0] || {}; const l=false;
  openModal(l?"Configure cycle":"Configurar ciclo",
    field(l?"Start of last period":"Início da última menstruação", "start", "date", last.start || "") +
    field(l?"End of last period":"Fim da última menstruação", "end", "date", last.end || "") +
    field(l?"Average cycle length (days)":"Duração média do ciclo (dias)", "cycleLength", "number", state.settings.cycleLength, 'min="21" max="45" required') +
    field(l?"Average period length (days)":"Duração média da menstruação (dias)", "periodLength", "number", state.settings.periodLength, 'min="1" max="10" required') +
    selectField(l?"Flow intensity":"Intensidade do fluxo", "flow", l?["Light","Moderate","Heavy"]:["Leve","Moderado","Intenso"], last.flow || (l?"Moderate":"Moderado")) +
    textareaField(l?"Notes":"Observações", "notes", last.notes || ""),
    { submit:l?"Save":"Salvar configuração" }
  );
  modal.querySelector("#lidire-form").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.settings.cycleLength = Number(f.get("cycleLength")) || 28;
    state.settings.periodLength = Number(f.get("periodLength")) || 5;
    if (f.get("start")) {
      const start = String(f.get("start") || ""), end = String(f.get("end") || "");
      if (end && end < start) { toast("A data de fim não pode ser anterior ao início.", "error"); return; }
      const record = { id: last.id || "", start, end, flow:String(f.get("flow") || "Moderado"), notes:String(f.get("notes") || "") };
      try { await saveCyclePeriodToD1(record); }
      catch (error) { toast(error?.message || "Não foi possível salvar o ciclo. Tente novamente.", "error"); return; }
    }
    saveState(); closeModal(); render(); toast("Configuração do ciclo atualizada.");
  };
}

// Grava (PUT) ou cria (POST) o período no D1 e atualiza o estado local,
// para que o registro não seja sobrescrito na próxima sincronização.
async function saveCyclePeriodToD1(record) {
  const payload = JSON.stringify({ start: record.start, end: record.end, flow: record.flow, notes: record.notes });
  let data = null;
  if (record.id) {
    try {
      data = await apiRequest(`/api/cycle/periods/${encodeURIComponent(record.id)}`, { method: "PUT", timeoutMs: 12000, body: payload });
    } catch (error) {
      if (error?.status !== 404 && error?.data?.error !== "not_found") throw error;
    }
  }
  if (!data) data = await apiRequest("/api/cycle/periods", { method: "POST", timeoutMs: 12000, body: payload });
  const saved = data?.period;
  if (!saved?.id) throw new Error("O servidor não retornou o registro do ciclo.");
  const normalized = { id: String(saved.id), start: String(saved.start || record.start), end: String(saved.end || ""), flow: String(saved.flow || record.flow), duration: saved.duration ?? "", notes: String(saved.notes || ""), createdAt: saved.createdAt || "", updatedAt: saved.updatedAt || "" };
  const periods = (state.data.cicloMenstrual.periodos || []).filter(x => x.id !== record.id && x.id !== normalized.id);
  state.data.cicloMenstrual.periodos = [normalized, ...periods].sort((a, b) => String(b.start).localeCompare(String(a.start)));
  cycleLoadedForUserId = String(authUser?.id || "");
  return normalized;
}

async function loadCyclePeriodsFromD1(force = false) {
  if (!authUser?.id || cycleLoading) return;
  if (!force && cycleLoadedForUserId === String(authUser.id)) return;
  cycleLoading = true;
  try {
    const data = await apiRequest("/api/cycle/periods", { method: "GET", timeoutMs: 12000 });
    const periods = Array.isArray(data.periods) ? data.periods : [];
    state.data.cicloMenstrual = state.data.cicloMenstrual || { periodos: [], sintomas: [] };
    state.data.cicloMenstrual.periodos = periods.map(x => ({
      id: String(x.id),
      start: String(x.start || ""),
      end: String(x.end || ""),
      flow: String(x.flow || "Moderado"),
      duration: x.duration ?? "",
      notes: String(x.notes || ""),
      createdAt: x.createdAt || "",
      updatedAt: x.updatedAt || ""
    }));
    cycleLoadedForUserId = String(authUser.id);
    saveState();
    if (currentPage === "cicloMenstrual") render();
  } catch (error) {
    console.warn("Ciclo menstrual não carregado do D1:", error);
  } finally {
    cycleLoading = false;
  }
}

function addPeriodoCiclo() {
  if (!authUser) { toast("Entre na sua conta para registrar um ciclo.", "error"); return; }
  openModal("Registrar ciclo",
    field("Início da menstruação", "start", "date", todayISO(), "required") +
    field("Fim da menstruação", "end", "date", "") +
    selectField("Intensidade do fluxo", "flow", ["Leve","Moderado","Intenso"], "Moderado") +
    textareaField("Observações", "notes", ""),
    { submit:"Registrar ciclo" }
  );
  modal.querySelector("#lidire-form").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    const flow = String(f.get("flow") || "Moderado");
    const notes = String(f.get("notes") || "");
    if (!start) { toast("Informe o início da menstruação.", "error"); return; }
    if (end && end < start) { toast("A data de fim não pode ser anterior ao início.", "error"); return; }

    const submit = modal.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = "Salvando…"; }

    try {
      const data = await apiRequest("/api/cycle/periods", {
        method: "POST",
        timeoutMs: 12000,
        body: JSON.stringify({ start, end, flow, notes })
      });
      const record = data.period;
      if (!record?.id) throw new Error("O servidor não retornou o registro do ciclo.");
      state.data.cicloMenstrual = state.data.cicloMenstrual || { periodos: [], sintomas: [] };
      state.data.cicloMenstrual.periodos = [
        {
          id: String(record.id),
          start: String(record.start || start),
          end: String(record.end || end),
          flow: String(record.flow || flow),
          duration: record.duration ?? (start && end ? Math.max(1, daysBetween(start, end) + 1) : ""),
          notes: String(record.notes || notes),
          createdAt: record.createdAt || new Date().toISOString(),
          updatedAt: record.updatedAt || ""
        },
        ...(state.data.cicloMenstrual.periodos || [])
      ];
      cycleLoadedForUserId = String(authUser?.id || "");
      saveState();
      closeModal();
      render();
      toast("Ciclo registrado com sucesso.");
    } catch (error) {
      if (submit) { submit.disabled = false; submit.textContent = "Registrar ciclo"; }
      toast(error?.message || "Não foi possível salvar o ciclo. Tente novamente.", "error");
    }
  };
}

function addSintomaCiclo(preset = "") {
  const l=false;
  // Atalhos "Como você se sente hoje?" pré-selecionam o campo correspondente.
  const notesPreset = preset === "Fluxo" ? "Fluxo: " : "";
  openModal(l?"Record how you feel today":"Registrar como você está hoje",
    selectField("Humor", "mood", ["Muito baixo","Baixo","Neutro","Bom","Muito bom"], preset === "Bom" ? "Bom" : "Neutro") +
    selectField("Dor", "pain", ["Baixa","Moderada","Intensa"], preset === "Dor" ? "Moderada" : "Baixa") +
    selectField("Cólicas", "cramps", ["Baixa","Moderada","Intensa"], "Baixa") +
    selectField("Acne", "acne", ["Baixa","Moderada","Intensa"], "Baixa") +
    selectField("Dor de cabeça", "headache", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Inchaço", "bloating", ["Nenhum","Baixo","Moderado","Intenso"], "Nenhum") +
    selectField("Sensibilidade nas mamas", "breastTenderness", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Náusea", "nausea", ["Nenhuma","Baixa","Moderada","Intensa"], "Nenhuma") +
    selectField("Energia física", "physicalEnergy", ["Baixa","Moderada","Intensa"], preset === "Energia" ? "Intensa" : "Moderada") +
    selectField("Energia mental", "mentalEnergy", ["Baixa","Moderada","Intensa"], preset === "Energia" ? "Intensa" : "Moderada") +
    textareaField("Observações", "notes", notesPreset),
    { submit:"Registrar" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const info = cycleInfo();
    const record = {id:uid("symptom"),date:todayISO(),phase:info.phase,mood:String(f.get("mood") || "Neutro"),pain:String(f.get("pain") || "Baixa"),cramps:String(f.get("cramps") || "Baixa"),acne:String(f.get("acne") || "Baixa"),headache:String(f.get("headache") || "Nenhuma"),bloating:String(f.get("bloating") || "Nenhum"),breastTenderness:String(f.get("breastTenderness") || "Nenhuma"),nausea:String(f.get("nausea") || "Nenhuma"),physicalEnergy:String(f.get("physicalEnergy") || "Moderada"),mentalEnergy:String(f.get("mentalEnergy") || "Moderada"),notes:String(f.get("notes") || ""),createdAt:new Date().toISOString()};
    state.data.cicloMenstrual.sintomas = [record, ...(state.data.cicloMenstrual.sintomas || [])];
    saveState(); closeModal(); render(); toast("Registro de sintomas salvo com sucesso.");
  };
}


function editPeriodoCiclo(id) {
  const record = state.data.cicloMenstrual.periodos.find(x => x.id === id);
  if (!record) return;
  openModal("Editar ciclo",
    field("Início da menstruação", "start", "date", record.start || "", "required") +
    field("Fim da menstruação", "end", "date", record.end || "") +
    selectField("Intensidade do fluxo", "flow", ["Leve","Moderado","Intenso"], record.flow || "Moderado") +
    textareaField("Observações", "notes", record.notes || ""),
    { submit:"Salvar alterações" }
  );
  modal.querySelector("#lidire-form").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const start = String(f.get("start") || "");
    const end = String(f.get("end") || "");
    if (!start) { toast("Informe o início da menstruação.", "error"); return; }
    if (end && end < start) { toast("A data de fim não pode ser anterior ao início.", "error"); return; }
    try {
      await saveCyclePeriodToD1({ id: record.id, start, end, flow: String(f.get("flow") || "Moderado"), notes: String(f.get("notes") || "") });
    } catch (error) {
      toast(error?.message || "Não foi possível salvar o ciclo. Tente novamente.", "error");
      return;
    }
    saveState(); closeModal(); render(); toast("Ciclo atualizado.");
  };
}

function editSintomaCiclo(id) {
  const record = state.data.cicloMenstrual.sintomas.find(x => x.id === id);
  if (!record) return;
  openModal("Editar registro do ciclo",
    field("Data", "date", "date", record.date || todayISO(), "required") +
    selectField("Humor", "mood", ["Muito baixo","Baixo","Neutro","Bom","Muito bom"], record.mood || "Neutro") +
    selectField("Dor", "pain", ["Baixa","Moderada","Intensa"], record.pain || "Baixa") +
    selectField("Cólicas", "cramps", ["Baixa","Moderada","Intensa"], record.cramps || "Baixa") +
    selectField("Acne", "acne", ["Baixa","Moderada","Intensa"], record.acne || "Baixa") +
    selectField("Dor de cabeça", "headache", ["Nenhuma","Baixa","Moderada","Intensa"], record.headache || "Nenhuma") +
    selectField("Inchaço", "bloating", ["Nenhum","Baixo","Moderado","Intenso"], record.bloating || "Nenhum") +
    selectField("Sensibilidade nas mamas", "breastTenderness", ["Nenhuma","Baixa","Moderada","Intensa"], record.breastTenderness || "Nenhuma") +
    selectField("Náusea", "nausea", ["Nenhuma","Baixa","Moderada","Intensa"], record.nausea || "Nenhuma") +
    selectField("Energia física", "physicalEnergy", ["Baixa","Moderada","Intensa"], record.physicalEnergy || "Moderada") +
    selectField("Energia mental", "mentalEnergy", ["Baixa","Moderada","Intensa"], record.mentalEnergy || "Moderada") +
    textareaField("Observações", "notes", record.notes || ""),
    { submit:"Salvar alterações" }
  );
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const date = String(f.get("date") || "");
    if (!date) { toast("Informe a data.", "error"); return; }
    const phaseInfo = cycleInfo(date);
    record.date = date;
    record.phase = phaseInfo.hasData ? phaseInfo.phase : record.phase;
    record.mood = String(f.get("mood") || "Neutro");
    record.pain = String(f.get("pain") || "Baixa");
    record.cramps = String(f.get("cramps") || "Baixa");
    record.acne = String(f.get("acne") || "Baixa");
    record.headache = String(f.get("headache") || "Nenhuma");
    record.bloating = String(f.get("bloating") || "Nenhum");
    record.breastTenderness = String(f.get("breastTenderness") || "Nenhuma");
    record.nausea = String(f.get("nausea") || "Nenhuma");
    record.physicalEnergy = String(f.get("physicalEnergy") || "Moderada");
    record.mentalEnergy = String(f.get("mentalEnergy") || "Moderada");
    record.notes = String(f.get("notes") || "");
    record.updatedAt = new Date().toISOString();
    saveState(); closeModal(); render(); toast("Registro atualizado.");
  };
}

let currentReminderAudio=null;
const reminderAudioInstances = new Set();
function findStudySubjectById(id){
  const target=String(id||"");
  for(const plan of (state.data.studyPlans||[])){
    const subject=(plan.subjects||[]).find(s=>String(s.id)===target);
    if(subject) return subject;
  }
  return null;
}
function sourceLabel(type,id){const map={tarefa:[state.data.tarefas,"Tarefa"],compromisso:[state.data.compromissos,"Compromisso"],estudo:[state.data.estudos,"Estudo"],treino:[state.data.treinos,"Treino"]};if(type==="estudo-materia"){const item=findStudySubjectById(id);return {label:"Matéria de estudo",item};}const [arr,label]=map[type]||[[],"Atividade"];const item=arr.find(x=>x.id===id);return {label,item};}
function createReminderFor(type,id){const {label,item}=sourceLabel(type,id);if(!item){toast("Item não encontrado.","error");return;}openReminderForm({sourceType:type,sourceId:id,sourceName:item.title||item.name||item.subject||label});}
function getBuiltinReminderAudios(){
  return [
    {id:"builtin-short",name:"LiDire padrão — curto",url:"/lidire-notificacao.wav",loop:false,builtin:true},
    {id:"builtin-alarm-30s",name:"Alarme LiDire — 30 segundos",url:"/lidire-alarme-30s.wav",loop:false,builtin:true},
    {id:"builtin-alarm-continuous",name:"Alarme LiDire — contínuo (até desligar)",url:"/lidire-alarme-continuo.wav",loop:true,builtin:true}
  ];
}
function getAllReminderAudios(){ return [...getBuiltinReminderAudios(), ...(Array.isArray(state.data.audios)?state.data.audios:[])]; }
function getReminderAudioById(audioId=""){
  return getAllReminderAudios().find(a=>String(a.id)===String(audioId)) || getBuiltinReminderAudios()[0];
}
function stopAudioElement(audio){
  if(!audio) return;
  try{ audio.pause(); }catch(_){}
  try{ audio.currentTime=0; }catch(_){}
  try{ audio.removeAttribute("src"); audio.load(); }catch(_){}
}
function stopAllReminderAudio(includeAlarm=true){
  try{
    reminderAudioInstances.forEach(audio=>stopAudioElement(audio));
    reminderAudioInstances.clear();
  }catch(_){}
  try{
    if(currentReminderAudio){stopAudioElement(currentReminderAudio);}
  }catch(_){}
  currentReminderAudio=null;
  if(includeAlarm){
    try{ if(window.__lidireAlarmAudio){stopAudioElement(window.__lidireAlarmAudio);} }catch(_){}
    window.__lidireAlarmAudio=null;
  }
}
function stopReminderAlarmAudio(){ stopAllReminderAudio(true); }
function playReminderAudio(audioId="", options={}){
  const selected=getReminderAudioById(audioId);
  // Toda nova prévia/alarme encerra qualquer reprodução anterior para evitar
  // dois objetos Audio tocando simultaneamente.
  stopAllReminderAudio(true);
  const audio=new Audio(selected.url || selected.dataUrl);
  audio.preload="auto"; audio.volume=0.78; audio.loop=!!selected.loop;
  reminderAudioInstances.add(audio);
  audio.addEventListener("ended",()=>{
    reminderAudioInstances.delete(audio);
    if(currentReminderAudio===audio) currentReminderAudio=null;
    if(window.__lidireAlarmAudio===audio) window.__lidireAlarmAudio=null;
  },{once:true});
  if(options.alarm) window.__lidireAlarmAudio=audio; else currentReminderAudio=audio;
  const p=audio.play();
  if(p&&typeof p.catch==="function") p.catch(()=>{
    reminderAudioInstances.delete(audio);
    if(currentReminderAudio===audio) currentReminderAudio=null;
    if(window.__lidireAlarmAudio===audio) window.__lidireAlarmAudio=null;
    toast("O navegador bloqueou a reprodução automática. Toque novamente para reproduzir.","error");
  });
  return audio;
}
function showReminderAlarm(r,title,message){
  const audioId=String(r.audioId||"builtin-alarm-30s");
  const selected=getReminderAudioById(audioId);
  playReminderAudio(audioId,{alarm:true});
  window.__lidireActiveAlarmId=String(r.id);
  openModal("🔔 Lembrete",`<div class="reminder-alarm-panel"><div class="reminder-alarm-icon">⏰</div><div class="reminder-alarm-title">${esc(title)}</div><p class="reminder-alarm-message">${esc(message)}</p><div class="reminder-alarm-audio">🔊 ${esc(selected.name)}</div><p class="muted">Escolha <strong>Soneca</strong> para adiar o lembrete ou desligue o alarme.</p><div class="reminder-snooze-actions"><button type="button" class="ghost-button" data-action="snooze-reminder" data-id="${esc(r.id)}" data-minutes="5">😴 5 min</button><button type="button" class="ghost-button" data-action="snooze-reminder" data-id="${esc(r.id)}" data-minutes="10">😴 10 min</button><button type="button" class="ghost-button" data-action="snooze-reminder" data-id="${esc(r.id)}" data-minutes="15">😴 15 min</button></div></div>`,{submit:"Desligar alarme"});
  const form=modal?.querySelector("#lidire-form");
  if(form) form.onsubmit=e=>{e.preventDefault();dismissReminderAlarm(r.id);};
}
function dismissReminderAlarm(reminderId){
  stopReminderAlarmAudio(); const r=(state.data.lembretes||[]).find(x=>String(x.id)===String(reminderId));
  if(r){r.snoozeUntil=0;if(r.repeat==="once")r.done=true;r.lastTriggeredKey=reminderOccurrenceKey(r,localDateISO(new Date()));saveState();}
  window.__lidireActiveAlarmId=""; closeModal(); toast("Alarme desligado.");
}
function snoozeReminder(reminderId,minutes){
  const r=(state.data.lembretes||[]).find(x=>String(x.id)===String(reminderId)); if(!r)return;
  stopReminderAlarmAudio(); r.snoozeUntil=Date.now()+Math.max(1,Number(minutes)||5)*60000; r.lastTriggeredKey=""; r.done=false; saveState(); window.__lidireActiveAlarmId=""; closeModal(); toast(`😴 Lembrete adiado por ${minutes} minutos.`);
}
function openReminderForm(existing=null){
  const r=existing||{}; const active=!r.id||!r.paused; const selectedAudio=r.audioId||"builtin-alarm-30s";
  const audioOptions=getAllReminderAudios().map(a=>`<option value="${esc(a.id)}" ${a.id===selectedAudio?"selected":""}>${esc(a.name)}</option>`).join("");
  openModal(r.id?"Editar lembrete":"Novo lembrete",field("Título","title","text",r.title||r.sourceName||"","required")+field("Data de início","date","date",r.date||todayISO(),"required")+field("Horário","time","time",r.time||"08:00","required")+selectField("Recorrência","repeat",[{value:"once",label:"Uma vez"},{value:"daily",label:"Todos os dias"},{value:"weekdays",label:"Dias úteis"},{value:"weekly",label:"Semanal"}],r.repeat||"once")+field("Data de término (opcional)","endDate","date",r.endDate||"")+textareaField("Mensagem","message",r.message||"Hora do seu lembrete.")+`<label class="form-field"><span>Ativar lembrete</span><span style="display:flex;align-items:center;gap:10px"><input type="checkbox" name="enabled" ${active?"checked":""}> <span>${active?"Ativado":"Desativado"}</span></span></label><div class="form-field"><span>Áudio do alarme</span><div class="reminder-audio-row" style="display:flex;align-items:center;gap:8px;flex:1"><select name="audioId">${audioOptions}</select><button type="button" class="ghost-button compact" data-preview-reminder-audio="1" title="Ouvir prévia" aria-label="Ouvir prévia">▶</button></div><small class="muted">A notificação será sempre enviada com áudio e texto. O alarme contínuo pode permanecer tocando até você desligá-lo ou usar a soneca.</small></div>`,{submit:r.id?"Salvar":"Criar lembrete"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const item={id:r.id||uid("rem"),title:String(f.get("title")||"Lembrete"),date:String(f.get("date")||todayISO()),time:String(f.get("time")||"08:00"),repeat:String(f.get("repeat")||"once"),endDate:String(f.get("endDate")||""),mode:"audio_text",message:String(f.get("message")||"Hora do seu lembrete."),audioId:String(f.get("audioId")||"builtin-alarm-30s"),sourceType:r.sourceType||"manual",sourceId:r.sourceId||"",done:false,paused:f.get("enabled")!=="on",snoozeUntil:0,lastTriggeredKey:r.lastTriggeredKey||""};const idx=state.data.lembretes.findIndex(x=>x.id===item.id);if(idx>=0)state.data.lembretes[idx]={...state.data.lembretes[idx],...item};else state.data.lembretes.unshift(item);state.settings.notifications.enabled=true;state.settings.notifications.mode="audio_text";state.settings.notifications.sound=true;saveState();stopReminderPreviewAudio();stopReminderAlarmAudio();closeModal();render();if("Notification" in window&&Notification.permission!=="granted")requestNotificationPermission();toast(r.id?"Lembrete atualizado.":"Lembrete criado.");};
}
function reminderRepeatLabel(r){return r.repeat==="daily"?"Todos os dias":r.repeat==="weekdays"?"Dias úteis":r.repeat==="weekly"?"Semanal":"Uma vez";}
function renderReminders(){const rs=state.data.lembretes||[];return `<div class="content-card"><div class="card-toolbar"><div><div class="toolbar-title">Meus lembretes</div><small>Vincule lembretes a tarefas, compromissos, estudos e treinos.</small></div><button class="ghost-button" data-action="new-reminder">+ Criar</button></div>${rs.length?`<div class="item-list">${rs.map(r=>`<div class="list-item ${r.paused?"completed":""}"><div class="module-icon small">🔔</div><div class="item-main"><strong>${esc(r.title)}</strong><span>${dateBR(r.date)} · ${esc(r.time)} · ${esc(reminderRepeatLabel(r))}${r.endDate?` · até ${dateBR(r.endDate)}`:""}</span><small>${esc(r.message||"")}${r.sourceType&&r.sourceType!=="manual"?` · Vinculado a ${esc(r.sourceType)}`:""}</small></div><div class="item-actions"><button data-action="toggle-reminder" data-id="${r.id}">${r.paused?"▶":"⏸"}</button><button data-action="edit-reminder" data-id="${r.id}">${icon("edit")}</button><button data-action="delete-reminder" data-id="${r.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum lembrete criado.</p>`}</div>`;}
let notificationRecorder = null;
let notificationChunks = [];

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    toast("Este navegador não oferece notificações.", "error");
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast("Notificações permitidas neste dispositivo.");
      return true;
    }
    toast("A permissão de notificações não foi concedida.", "error");
    return false;
  } catch (_) {
    toast("Não foi possível solicitar a permissão de notificações.", "error");
    return false;
  } finally {
    render();
  }
}

function ensureLiDireAudioContext() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!window.__lidireAudioContext) window.__lidireAudioContext = new Ctx();
    if (window.__lidireAudioContext.state === "suspended") window.__lidireAudioContext.resume().catch(() => {});
    return window.__lidireAudioContext;
  } catch (_) {
    return null;
  }
}

function unlockLiDireNotificationAudio() {
  try {
    const audio = window.__lidireNotificationAudio || (window.__lidireNotificationAudio = new Audio("/lidire-notificacao.wav"));
    audio.preload = "auto";
    audio.volume = 0.65;
    const p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  } catch (_) {}
  ensureLiDireAudioContext();
}

function playBrowserFallbackBeep() {
  try {
    const ctx = ensureLiDireAudioContext();
    if (!ctx) return false;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
    return true;
  } catch (_) {
    return false;
  }
}

function playLiDireNotificationSound() {
  try {
    if (!window.__lidireNotificationAudio) {
      window.__lidireNotificationAudio = new Audio("/lidire-notificacao.wav");
      window.__lidireNotificationAudio.preload = "auto";
      window.__lidireNotificationAudio.volume = 0.65;
    }
    const audio = window.__lidireNotificationAudio;
    audio.currentTime = 0;
    const promise = audio.play();
    if (promise && typeof promise.then === "function") {
      promise.catch(() => {
        playBrowserFallbackBeep();
      });
    }
    return true;
  } catch (_) {
    return playBrowserFallbackBeep();
  }
}

// Compatibilidade com chamadas antigas.
function playReminderBeep() { playLiDireNotificationSound(); }

function playSavedReminderVoice(audioId=""){
  const selected=getReminderAudioById(audioId || state.settings.notifications?.audioId || "builtin-alarm-30s");
  if(selected?.builtin || selected?.url){playReminderAudio(selected.id,{alarm:false});return;}
  if(currentReminderAudio){try{currentReminderAudio.pause();currentReminderAudio.currentTime=0;}catch(_){} currentReminderAudio=null;}
  const url=selected?.dataUrl || state.settings.notifications?.voiceDataUrl;
  if(!url){toast("Nenhum áudio disponível.","error");return;}
  const audio=new Audio(url); currentReminderAudio=audio; audio.play().catch(()=>toast("O navegador bloqueou a reprodução automática. Toque novamente para reproduzir.","error"));
}

function testReminderNotification(){
  const n=state.settings.notifications||defaultState.settings.notifications; const title=String(n.title||"LiDire — Lembrete"); const message=String(n.message||"Hora do seu lembrete."); const audioId=String(n.audioId||"builtin-alarm-30s");
  playReminderAudio(audioId,{alarm:false});
  if("Notification" in window&&Notification.permission==="granted"){try{new Notification(title,{body:message,icon:"/logo-lidire-oficial.png"});}catch(_){} } else toast(`🔔 ${title}: ${message}`);
}

function localDateISO(date=new Date()) {
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function reminderOccurrenceKey(r, dateISO) {
  return `${r.id}|${dateISO}|${String(r.time||"00:00")}`;
}
function reminderAppliesToday(r, now, dateISO) {
  const start=String(r.date||"");
  if(!start || dateISO < start) return false;
  if(r.endDate && dateISO > String(r.endDate)) return false;
  if(r.repeat === "weekdays" && [0,6].includes(now.getDay())) return false;
  if(r.repeat === "weekly") {
    const startDate=new Date(`${start}T12:00:00`);
    if(Number.isNaN(startDate.getTime()) || startDate.getDay() !== now.getDay()) return false;
  }
  return true;
}
function notifyReminder(r, occurrenceKey){
  const n=state.settings.notifications||defaultState.settings.notifications; if(r.paused||r.done)return;
  n.enabled=true; r.lastTriggeredKey=occurrenceKey; r.mode="audio_text"; saveState();
  const title=String(r.title||n.title||"LiDire — Lembrete"); const message=String(r.message||n.message||"Hora do seu lembrete."); const audioId=String(r.audioId||n.audioId||"builtin-alarm-30s");
  if("Notification" in window&&Notification.permission==="granted"){try{new Notification(title,{body:message,icon:"/logo-lidire-oficial.png"});}catch(_){} } else toast(`🔔 ${title}: ${message}`);
  showReminderAlarm(r,title,message);
}
function checkDueReminders(){
  const now=new Date(); const dateISO=localDateISO(now); const timeNow=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`; const reminders=Array.isArray(state.data.lembretes)?state.data.lembretes:[]; let changed=false;
  reminders.forEach(r=>{
    if(r.paused||r.done||!r.date||!r.time)return;
    if(r.snoozeUntil){if(Date.now()<Number(r.snoozeUntil))return;r.snoozeUntil=0;r.lastTriggeredKey="";changed=true;}
    if(!reminderAppliesToday(r,now,dateISO))return;
    if(String(r.time)>timeNow&&!r.snoozeUntil)return;
    const key=reminderOccurrenceKey(r,dateISO); if(r.lastTriggeredKey===key)return;
    notifyReminder(r,key); changed=true;
  });
  if(changed)saveState();
}
let reminderSchedulerStarted=false;
function startReminderScheduler() {
  if(reminderSchedulerStarted) return;
  reminderSchedulerStarted=true;
  checkDueReminders();
  window.__lidireReminderScheduler=setInterval(checkDueReminders,1000);
}

function startReminderVoiceRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast("Seu navegador não permite gravação de voz aqui.", "error"); return; }
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
    notificationChunks = [];
    notificationRecorder = new MediaRecorder(stream);
    notificationRecorder.ondataavailable = e => { if (e.data.size) notificationChunks.push(e.data); };
    notificationRecorder.onstop = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const blob = new Blob(notificationChunks, { type: notificationRecorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => { const name = prompt("Nome do áudio gravado:", "Meu áudio") || "Meu áudio"; const audio={id:uid("audio"),name:name.trim()||"Meu áudio",dataUrl:reader.result,createdAt:new Date().toISOString()}; state.data.audios.unshift(audio); state.settings.notifications.voiceDataUrl=reader.result; state.settings.notifications.audioId=audio.id; saveState(); render(); requestAnimationFrame(() => window.scrollTo({top:scrollY,behavior:"auto"})); toast("Áudio salvo na biblioteca."); };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
      notificationRecorder = null;
    };
    notificationRecorder.start();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    toast("Gravando… toque novamente em 'Parar gravação' quando terminar.");
    render();
    requestAnimationFrame(() => window.scrollTo({top:scrollY,behavior:"auto"}));
  }).catch(() => toast("Permita o acesso ao microfone para gravar sua mensagem.", "error"));
}

function stopReminderVoiceRecording() {
  if (notificationRecorder && notificationRecorder.state !== "inactive") notificationRecorder.stop();
}

function audioLibrary(){const audios=state.data.audios||[];return appShell(`${pageHeader("LEMBRETES","Biblioteca de áudios","Guarde várias mensagens de voz e escolha qual usar em cada lembrete.", "")}<div class="content-card">${audios.length?`<div class="item-list">${audios.map(a=>`<div class="list-item"><div class="module-icon small">🎙</div><div class="item-main"><strong>${esc(a.name)}</strong><span>Áudio gravado</span></div><div class="item-actions"><button data-action="play-audio" data-id="${a.id}">▶</button><button data-action="pause-audio">⏸</button><button data-action="stop-audio">⏹</button><button data-action="rename-audio" data-id="${a.id}">✎</button><button data-action="delete-audio" data-id="${a.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<p class="muted">Nenhum áudio gravado ainda.</p>`}</div>`);}
function configuracoesNotificacoes() {
  const n = state.settings.notifications;
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  const recording = !!notificationRecorder && notificationRecorder.state === "recording";
  return appShell(`${pageHeader("LEMBRETES", "Notificações e lembretes", "Escolha como a LiDire deve avisar você.", `<button type="button" class="primary-button compact" data-action="test-reminder">🔔 Testar</button>`)}
    <div class="content-card">
      <div class="card-toolbar"><div><div class="toolbar-title">Notificações</div><small>Status: ${permission === "granted" ? "permitidas" : permission === "denied" ? "bloqueadas" : permission === "unsupported" ? "não suportadas" : "ainda não configuradas"}</small></div><label class="switch"><input type="checkbox" data-action="toggle-notifications" ${n.enabled ? "checked" : ""}><span></span></label></div>
      ${permission !== "granted" && permission !== "unsupported" ? `<button class="secondary-button" data-action="request-notification-permission">Permitir notificações</button>` : ""}
      <p class="muted">A permissão do aparelho é necessária para notificações do navegador. O funcionamento em segundo plano pode variar conforme navegador e dispositivo.</p>
    </div>
    <div class="content-card">
      <h3>Como a LiDire avisa</h3>
      <div class="reminder-fixed-mode"><strong>🔊 Áudio + texto</strong><span>A notificação dos lembretes será sempre enviada com áudio e texto.</span></div>
      <label class="form-field"><span>Áudio padrão</span><select name="notificationAudio">${getAllReminderAudios().map(a=>`<option value="${esc(a.id)}" ${a.id===String(n.audioId||"builtin-alarm-30s")?"selected":""}>${esc(a.name)}</option>`).join("")}</select><small class="muted">Escolha um alarme curto, de 30 segundos ou contínuo.</small></label>
      ${field("Título do lembrete", "notificationTitle", "text", n.title || "LiDire — Lembrete")}
      ${textareaField("Mensagem padrão", "notificationMessage", n.message || "Hora do seu lembrete.")}
      <button class="primary-button" data-action="save-notification-settings">Salvar configurações</button>
    </div>
    <div class="content-card">
      <h3>Áudios personalizados</h3><button class="ghost-button" data-action="audio-library">🎙 Biblioteca de áudios</button>
      <p class="muted">Você também pode gravar uma mensagem de voz e selecioná-la em um lembrete.</p>
      ${recording ? `<button class="secondary-button" data-action="stop-reminder-recording">⏹ Parar gravação</button>` : `<button class="secondary-button" data-action="start-reminder-recording">🎙 Gravar minha voz</button>`}
      ${n.voiceDataUrl && !recording ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="muted">Mensagem gravada.</span><button class="text-button" data-action="play-reminder-voice">▶ Reproduzir</button><button class="text-button" data-action="pause-reminder-voice">⏸ Pausar</button><button class="text-button" data-action="stop-reminder-voice">⏹ Parar</button><button class="text-button" data-action="audio-library">🎙 Biblioteca</button><button class="text-button" data-action="delete-reminder-voice">Excluir</button></div>` : ""}
    </div>${renderReminders()}</div>`);
}

/* =========================================================
   PERFIL
   ========================================================= */

function perfil() {
  const lang=false; const hasPhoto=!!state.user.photo; const name=state.user.name||"LiDire User";
  const plan = state.settings.subscriptionPlan || "free";
  const planLabel = plan === "premium" ? (lang?"PREMIUM MEMBER":"MEMBRO PREMIUM") : (lang?"FREE MEMBER":"MEMBRO GRATUITO");
  return appShell(`
    ${pageHeader("PROFILE", "Perfil", lang?"Your account, preferences and connections.":"Sua conta, preferências e conexões.", `<button class="ghost-button compact" data-page="configuracoes">⚙ ${lang?"Settings":"Configurações"}</button>`)}
    <section class="v5-profile-hero"><div class="v5-profile-avatar" data-action="profile-photo">${hasPhoto?`<img src="${esc(state.user.photo)}" alt="">`:esc(name.charAt(0).toUpperCase())}</div><h2>${esc(name)}</h2><span class="v5-premium">${planLabel}</span></section>
    <section class="v5-settings-card"><h3>♙ ${lang?"Personal Info":"Informações pessoais"}</h3><label>${lang?"Full Name":"Nome completo"}<input value="${esc(name)}" readonly></label><label>${lang?"Email Address":"E-mail"}<input value="${esc(state.user.email||"")}" readonly></label><label>Data de nascimento<input value="${esc(state.user.birth_date ? dateBR(state.user.birth_date) : "")}" placeholder="Cadastre sua data de nascimento" readonly></label><label>Endereço de casa<input value="${esc(state.user.address||"")}" placeholder="Cadastre seu endereço residencial" readonly></label><small class="muted">A IA poderá usar este endereço quando você pedir uma rota mencionando “casa”.</small><button class="primary-button compact" data-action="edit-profile">${lang?"Edit Profile":"Editar Perfil"}</button></section>
    <section class="v5-settings-card"><h3>☆ ${lang?"Subscription":"Assinatura"}</h3><div class="v5-plan-row"><div><strong>${plan === "premium" ? (lang?"Premium Plan":"Plano Premium") : (lang?"Free Plan":"Plano Gratuito")}</strong><small>${plan === "premium" ? (lang?"LiDire + AI + Family":"LiDire + IA + Família") : (lang?"Explore LiDire before subscribing":"Conheça a LiDire antes de assinar")}</small></div><span>✦</span></div><button data-page="assinatura">${lang?"Manage subscription":"Gerenciar assinatura"} →</button><button data-page="assinaturaBeneficios">${lang?"View plan benefits":"Ver benefícios"} →</button></section>
    <section class="v5-settings-card"><h3>⚙ ${lang?"Preferences":"Preferências"}</h3><button data-action="open-notifications">🔔 <span>${lang?"Notifications":"Notificações"}</span><b>${state.settings.notifications.enabled?"ON":"OFF"}</b></button><button data-action="preference-theme">◐ <span>${lang?"Appearance":"Aparência"}</span><b>${state.settings.theme==="dark"?(lang?"Dark":"Escuro"):(lang?"Light":"Claro")}</b></button></section>
    <section class="v5-settings-card"><h3>🛡 ${lang?"Privacy":"Privacidade"}</h3><button data-page="privacidade">${lang?"Data Management":"Gerenciamento de dados"} →</button><button data-page="alterarSenha">${lang?"Change Password":"Alterar senha"} →</button></section>
    <section class="v5-settings-card"><h3>ⓘ ${lang?"Support":"Suporte"}</h3><button data-page="suporte">${lang?"Help Center":"Central de ajuda"} →</button><button data-page="sobre">${lang?"About LiDire":"Sobre a LiDire"} →</button><button data-page="privacidade">${lang?"Privacy Policy":"Política de Privacidade"} →</button><button data-page="termos">${lang?"Terms of Service":"Termos de Serviço"} →</button></section>
    <button class="v5-signout" data-action="logout">↪ ${lang?"Sign Out":"Sair da conta"}</button>
  `);
}
/* =========================================================
   LiDire — idioma oficial: Português (Brasil)
   =========================================================
   LiDire 4.4 — idioma e aparência
   Português e English são aplicados à interface inteira.
   Aparência possui somente Claro e Escuro.
   ========================================================= */
function translateText(value){ return value; }
function applyLanguage(){
  document.documentElement.lang="pt-BR";
  document.body.dataset.language="pt-BR";
}

function applyTheme(){
  const theme=["light","dark"].includes(state.settings.theme)?state.settings.theme:"dark";
  state.settings.theme=theme;
  document.documentElement.dataset.theme=theme;
  document.body.dataset.theme=theme;
}
function preferencias(){return appShell(`${pageHeader("PREFERÊNCIAS","Idioma e preferências","Personalize a experiência da LiDire.")}<div class="content-card"><div class="settings-card"><button data-action="preference-theme"><span>🎨</span><div><strong>Aparência</strong><small>${state.settings.theme==="light"?"☀️ Claro":"🌙 Escuro"}</small></div>${icon("arrow")}</button></div></div>`);}
function dados(){return appShell(`${pageHeader("DADOS","Seus dados","Gerencie exportação e exclusão da sua conta.")}<div class="content-card"><div class="settings-card"><button data-action="export-data"><span>📤</span><div><strong>Exportar meus dados</strong><small>Gerar relatório e salvar em PDF</small></div>${icon("arrow")}</button><button data-action="delete-account"><span>🗑</span><div><strong>Excluir minha conta</strong><small>Solicitar a exclusão da conta e dos dados</small></div>${icon("arrow")}</button></div></div>`);}
function explorarHub(){const items=[["✓","Tarefas","Organize o que precisa ser feito.","tarefas"],["🛒","Compras","Listas e itens de compras.","compras"],["📚","Estudos","Planejamento e desempenho.","estudos"],["🏋️","Treinos","Exercícios e evolução.","treinos"],["💧","Hidratação","Meta diária de água.","hidratacao"],["🍽️","Alimentação","Dietas e refeições.","alimentacao"],["💰","Finanças","Receitas, despesas e limites.","financas"],["🎯","Objetivos","Metas e progresso.","objetivos"],["👥","Família","Funcionalidade em desenvolvimento.","familia"],["🌸","Ciclo menstrual","Em desenvolvimento.","cicloMenstrual"],["🤰","Gestação","Em desenvolvimento.","gestacao"],["🌦️","Clima e rotas","Temperatura, previsão e deslocamento.","climaRotas"],["📝","Anotações","Notas e informações importantes.","anotacoes"]];return appShell(`${pageHeader("MÓDULOS","Explorar","Tudo o que a LiDire pode organizar em um só lugar.")}<div class="content-card"><div class="settings-card">${items.map(x=>hubButton(...x)).join("")}</div></div>`);}



/* RESTORED CORE FUNCTIONS FROM MVP 4.9 — required by v5 pages map */
async function suggestDepartureForCommitment(commitmentId) {
  const item = (state.data.compromissos || []).find(x => String(x.id) === String(commitmentId));
  if (!item) { toast("Compromisso não encontrado.", "error"); return; }
  if (!item.address || !item.date || !item.time) { toast("Informe data, horário e endereço no compromisso.", "error"); return; }
  const places = Array.isArray(state.data.lugares) ? state.data.lugares : [];
  const defaultOrigin = String(state.settings?.route?.defaultOrigin || state.user?.address || "");
  const originOptions = places.filter(x => x.address).map(x => `<option value="${esc(x.address)}">${esc(x.name || x.address)}</option>`).join("");
  openModal("Sugerir horário de saída", `<p>Vou calcular o tempo de deslocamento até <strong>${esc(item.title || "seu compromisso")}</strong> e sugerir quando sair.</p>${field("Origem","origin","text",defaultOrigin,'placeholder="Endereço de saída ou Minha localização" required')}${selectField("Transporte","travelMode",[{value:"DRIVE",label:"Carro"},{value:"TWO_WHEELER",label:"Moto"},{value:"TRANSIT",label:"Transporte público"},{value:"WALK",label:"A pé"},{value:"BICYCLE",label:"Bicicleta"}],"DRIVE")}${selectField("Chegar com antecedência", "margin", [{value:"0",label:"No horário do compromisso"},{value:"5",label:"5 minutos antes"},{value:"10",label:"10 minutos antes"},{value:"15",label:"15 minutos antes"},{value:"20",label:"20 minutos antes"},{value:"30",label:"30 minutos antes"}],"15")}<small class="muted">A estimativa depende dos dados de trânsito disponíveis no momento. A origem “Minha localização” solicitará acesso ao GPS.</small>`, {submit:"Calcular sugestão"});
  const form = modal?.querySelector("#lidire-form");
  if (!form) return;
  form.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(form);
    const origin = String(f.get("origin") || "").trim();
    const travelMode = String(f.get("travelMode") || "DRIVE");
    const margin = Math.max(0, Number(f.get("margin") || 15));
    if (!origin) { toast("Informe de onde você sairá.", "error"); return; }
    const target = new Date(`${item.date}T${item.time}:00`);
    if (Number.isNaN(target.getTime())) { toast("Data ou horário do compromisso inválido.", "error"); return; }
    target.setMinutes(target.getMinutes() - margin);
    const targetDate = `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,"0")}-${String(target.getDate()).padStart(2,"0")}`;
    const targetTime = `${String(target.getHours()).padStart(2,"0")}:${String(target.getMinutes()).padStart(2,"0")}`;
    const submit = form.querySelector('[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = "Calculando rota…"; }
    try {
      const result = await calculateRouteFromAddresses(origin, item.address, travelMode, {date:targetDate, arrivalTime:targetTime});
      const departure = result.suggestedDepartureTime || "";
      if (!departure) throw new Error("A rota foi calculada, mas não foi possível estimar o horário de saída para esse meio de transporte. Tente carro ou moto.");
      const duration = formatDurationSeconds(result.duration);
      const routeOrigin = origin;
      const departureDateObj = result.departureTime ? new Date(result.departureTime) : target;
      const departureDate = `${departureDateObj.getFullYear()}-${String(departureDateObj.getMonth()+1).padStart(2,"0")}-${String(departureDateObj.getDate()).padStart(2,"0")}`;
      state.settings.pendingDepartureReminder = {commitmentId:item.id, title:item.title || "Compromisso", date:departureDate, time:departure, origin:routeOrigin, destination:item.address, travelMode, duration, margin};
      saveState();
      closeModal();
      openModal("Horário recomendado", `<div class="content-card" style="margin:0"><p>Para chegar a <strong>${esc(item.title || "seu compromisso")}</strong> às ${esc(item.time)}, com ${margin} min de antecedência:</p><h2 style="margin:10px 0">🕒 Saia às ${esc(departure)}</h2><p>Deslocamento estimado: <strong>${esc(duration)}</strong></p><p class="muted">Origem: ${esc(routeOrigin)}<br>Destino: ${esc(item.address)}</p><small class="muted">A estimativa pode mudar conforme o trânsito. Confirme o lembrete se quiser que a LiDire avise você.</small></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="primary-button" data-action="create-departure-reminder">🔔 Criar lembrete para sair</button><button type="button" class="ghost-button" data-action="route-open-google-maps">Abrir Google Maps</button><button type="button" class="ghost-button" data-action="route-open-waze">Abrir Waze</button></div>`, {submit:"Fechar"});
      const resultForm = modal?.querySelector("#lidire-form");
      if (resultForm) resultForm.onsubmit = ev => { ev.preventDefault(); closeModal(); };
    } catch (error) {
      toast(error?.message || "Não foi possível calcular a sugestão.", "error");
      if (submit) { submit.disabled = false; submit.textContent = "Calcular sugestão"; }
    }
  };
}

function agenda() {
  const items = [...state.data.compromissos].sort(
    (a, b) => {
      const da = `${a.date || ""} ${a.time || ""}`;
      const db = `${b.date || ""} ${b.time || ""}`;
      return da.localeCompare(db);
    }
  );

  return listPage({
    key: "compromissos",

    title: "Agenda",

    subtitle:
      "Seus compromissos organizados em um só lugar.",

    eyebrow: "SUA ROTINA",

    emptyTitle: "Sua agenda está livre",

    emptyText:
      "Cadastre compromissos, consultas, reuniões e outros horários.",

    render: (x) => `
      <div class="list-item">

        <div class="date-badge">
          <strong>
            ${x.date ? x.date.slice(8, 10) : "--"}
          </strong>

          <small>
            ${
              x.date
                ? new Date(
                    `${x.date}T12:00:00`
                  )
                    .toLocaleDateString(
                      "pt-BR",
                      { month: "short" }
                    )
                    .replace(".", "")
                : ""
            }
          </small>
        </div>

        <div class="item-main">

          <strong>${esc(x.title)}</strong>

          <span>
            ${x.time ? `◷ ${esc(x.time)}` : "Sem horário"}

            ${
              x.location
                ? ` · ${esc(x.location)}`
                : ""
            }
          </span>
          ${x.address && x.time && x.date ? `<small class="muted">📍 ${esc(x.address)}</small>` : ""}

        </div>

        <div class="item-actions">
          ${x.address && x.time && x.date ? `<button type="button" data-action="suggest-departure" data-id="${esc(x.id)}" title="Calcular horário recomendado para sair">🧭</button>` : ""}

          <button
            data-action="edit-compromisso"
            data-id="${x.id}"
          >
            ${icon("edit")}
          </button>

          <button
            data-action="delete-compromisso"
            data-id="${x.id}"
          >
            ${icon("trash")}
          </button>

        </div>

      </div>
    `
  });
}

function anotacoes(){
  const notes=Array.isArray(state.data.anotacoes)?state.data.anotacoes:[];
  const categories=[...new Set(notes.map(n=>String(n.category||"Geral").trim()).filter(Boolean))];
  const cards=notes.map(note=>`
    <article class="note-card ${note.is_favorite?"is-favorite":""}">
      <div class="note-card-top">
        <div>
          <span class="note-category">${esc(note.category||"Geral")}</span>
          <h3>${esc(note.title||"Sem título")}</h3>
        </div>
        <button class="note-favorite" type="button" data-action="toggle-note-favorite" data-id="${esc(note.id)}" title="${note.is_favorite?"Remover dos favoritos":"Adicionar aos favoritos"}">${note.is_favorite?"★":"☆"}</button>
      </div>
      <p class="note-content">${esc(note.content||"").replaceAll("\n","<br>")}</p>
      ${note.tags?`<div class="note-tags">${String(note.tags).split(",").map(t=>t.trim()).filter(Boolean).map(t=>`<span>#${esc(t)}</span>`).join("")}</div>`:""}
      <div class="note-card-footer">
        <small>${esc(formatNoteDate(note.updated_at||note.created_at))}</small>
        <div class="item-actions">
          <button type="button" data-action="edit-note" data-id="${esc(note.id)}">${icon("edit")}</button>
          <button type="button" data-action="delete-note" data-id="${esc(note.id)}">${icon("trash")}</button>
        </div>
      </div>
    </article>`).join("");
  const filters=categories.length?`<select id="notes-category-filter" class="notes-filter"><option value="">Todas as categorias</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>`:"";
  const body=notes.length?`
    <div class="notes-toolbar">
      <input id="notes-search" class="notes-search" type="search" placeholder="🔎 Buscar nas anotações...">
      ${filters}
      <button class="ghost-button" type="button" data-action="show-favorite-notes">★ Favoritos</button>
      <button class="primary-button" type="button" data-action="new-note">+ Nova anotação</button>
    </div>
    <div id="notes-grid" class="notes-grid">${cards}</div>`:
    `<div class="empty-state">
      <div class="empty-orb">📝</div>
      <h3>Suas anotações</h3>
      <p>Crie notas para guardar ideias, informações importantes, listas rápidas e referências da sua rotina. Tudo fica associado à sua conta LiDire.</p>
      <button class="primary-button" data-action="new-note">+ Nova anotação</button>
    </div>`;
  return appShell(`${pageHeader("ORGANIZAÇÃO","Anotações","Registre ideias, informações importantes e anotações da sua rotina.")}<div class="content-card notes-page">${body}</div>`);
}

function formatNoteDate(value){
  if(!value) return "Agora";
  const d=new Date(String(value).includes("T")?value:String(value).replace(" ","T")+"Z");
  if(Number.isNaN(d.getTime())) return "Agora";
  return d.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

async function loadNotesFromD1(){
  if(!authUser?.id || notesLoading || notesLoadedForUserId===authUser.id) return;
  notesLoading=true;
  try{
    const data=await apiRequest("/api/notes",{method:"GET"});
    state.data.anotacoes=Array.isArray(data.notes)?data.notes:[];
    notesLoadedForUserId=authUser.id;
    saveState();
    if(currentPage==="anotacoes") render();
  }catch(error){
    console.warn("Anotações D1:",error);
    if(currentPage==="anotacoes") toast(error.message||"Não foi possível carregar as anotações.","error");
  }finally{notesLoading=false;}
}

function openNoteForm(existing=null){
  const note=existing||{id:uid("note"),title:"",content:"",category:"Geral",tags:"",is_favorite:false};
  openModal(existing?"Editar anotação":"Nova anotação",
    field("Título","title","text",note.title||"","required maxlength=120")+
    textareaField("Anotação","content",note.content||"",'rows="9" required maxlength="12000" placeholder="Escreva sua anotação aqui..."')+
    field("Categoria","category","text",note.category||"Geral",'maxlength="60" placeholder="Ex.: Pessoal, Estudos, Trabalho"')+
    field("Tags","tags","text",note.tags||"",'maxlength="300" placeholder="Ex.: ideias, compras, projeto"')+
    `<label class="form-field note-checkbox"><span>Opções</span><label><input type="checkbox" name="is_favorite" ${note.is_favorite?"checked":""}> ⭐ Marcar como favorita</label></label>`,
    {submit:existing?"Salvar alterações":"Salvar anotação"});
  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const payload={title:String(f.get("title")||"").trim(),content:String(f.get("content")||"").trim(),category:String(f.get("category")||"Geral").trim()||"Geral",tags:String(f.get("tags")||"").trim(),is_favorite:f.get("is_favorite")==="on"};
    if(payload.title.length<1||payload.content.length<1){toast("Informe um título e escreva a anotação.","error");return;}
    const submit=e.target.querySelector('button[type="submit"]');
    if(submit){submit.disabled=true;submit.textContent="Salvando…";}
    try{
      const data=await apiRequest(existing?`/api/notes/${encodeURIComponent(note.id)}`:"/api/notes",{method:existing?"PUT":"POST",body:JSON.stringify(payload)});
      const saved=data.note;
      const idx=state.data.anotacoes.findIndex(x=>x.id===saved.id);
      if(idx>=0) state.data.anotacoes[idx]=saved; else state.data.anotacoes.unshift(saved);
      notesLoadedForUserId=authUser?.id||notesLoadedForUserId;
      saveState();closeModal();render();toast(existing?"Anotação atualizada.":"Anotação salva.");
    }catch(error){
      toast(error.message||"Não foi possível salvar a anotação.","error");
      if(submit){submit.disabled=false;submit.textContent=existing?"Salvar alterações":"Salvar anotação";}
    }
  };
}

async function toggleNoteFavorite(id){
  const note=state.data.anotacoes.find(x=>x.id===id);
  if(!note) return;
  try{
    const data=await apiRequest(`/api/notes/${encodeURIComponent(id)}`,{method:"PUT",body:JSON.stringify({title:note.title,content:note.content,category:note.category||"Geral",tags:note.tags||"",is_favorite:!note.is_favorite})});
    const idx=state.data.anotacoes.findIndex(x=>x.id===id);
    if(idx>=0) state.data.anotacoes[idx]=data.note;
    saveState();render();toast(data.note.is_favorite?"Adicionada aos favoritos.":"Removida dos favoritos.");
  }catch(error){toast(error.message||"Não foi possível atualizar a anotação.","error");}
}

async function deleteNote(id){
  const note=state.data.anotacoes.find(x=>x.id===id);
  if(!note) return;
  if(!confirm(`Excluir a anotação “${note.title||"Sem título"}”?`)) return;
  try{
    await apiRequest(`/api/notes/${encodeURIComponent(id)}`,{method:"DELETE"});
    state.data.anotacoes=state.data.anotacoes.filter(x=>x.id!==id);
    saveState();render();toast("Anotação excluída.");
  }catch(error){toast(error.message||"Não foi possível excluir a anotação.","error");}
}

function bindNotesFilters(){
  const search=document.getElementById("notes-search");
  const category=document.getElementById("notes-category-filter");
  const favButton=document.querySelector('[data-action="show-favorite-notes"]');
  let favoritesOnly=false;
  const apply=()=>{
    const q=String(search?.value||"").trim().toLowerCase();
    const c=String(category?.value||"");
    document.querySelectorAll("#notes-grid .note-card").forEach(card=>{
      const title=card.querySelector("h3")?.textContent?.toLowerCase()||"";
      const content=card.querySelector(".note-content")?.textContent?.toLowerCase()||"";
      const cat=card.querySelector(".note-category")?.textContent||"";
      const fav=card.classList.contains("is-favorite");
      card.style.display=(!q||title.includes(q)||content.includes(q))&&(!c||cat===c)&&(!favoritesOnly||fav)?"":"none";
    });
    if(favButton) favButton.textContent=favoritesOnly?"★ Todas":"★ Favoritos";
  };
  search?.addEventListener("input",apply);
  category?.addEventListener("change",apply);
  favButton?.addEventListener("click",()=>{favoritesOnly=!favoritesOnly;apply();});
}


function configuracoes(){return appShell(`${pageHeader("APLICATIVO","Configurações","Controle sua conta, preferências, segurança, privacidade e dados.")}<div class="content-card"><div class="settings-card">${hubButton("👤","Conta","Perfil e informações da sua conta","perfil")}${hubButton("🔒","Segurança","PIN, biometria e bloqueio do aplicativo","seguranca")}${hubButton("🌐","Preferências","Configurações gerais da LiDire","preferencias")}${hubButton("🤖","Assistente LiDire","Permissões e preferências da inteligência artificial","assistente")}${hubButton("🔔","Notificações e lembretes","Escolha texto, bip ou texto + voz","configuracoesNotificacoes")}${hubButton("🔐","Privacidade e permissões","Controle quais dados podem ser utilizados","privacidade")}${hubButton("📦","Dados","Exportação e gerenciamento dos seus dados","dados")}${hubButton("⚖️","Termos e políticas","Consulte os documentos legais da LiDire","termos")}${hubButton("🆘","Suporte","Ajuda, bugs e contato","suporte")}</div></div>`);}

function countFor(id) {
  if (id === "tarefas") {
    return state.data.tarefas.filter(
      (x) => !x.done
    ).length;
  }

  if (id === "agenda") {
    return state.data.compromissos.length;
  }

  if (id === "compras") {
    return state.data.compras.reduce(
      (total, lista) =>
        total +
        (lista.items || []).filter(
          (item) => !item.done
        ).length,
      0
    );
  }

  if (id === "cicloMenstrual") {
    return state.data.cicloMenstrual?.sintomas?.filter(x => x.date === todayISO()).length || 0;
  }

  if (id === "anotacoes") {
    return Array.isArray(state.data.anotacoes) ? state.data.anotacoes.length : 0;
  }

  return state.data[id]?.length || 0;
}

function hubButton(iconText, title, subtitle, target) {
  return `<button class="settings-card explore-hub-card" data-page="${esc(target)}"><span class="explore-hub-icon">${iconText}</span><span class="hub-button-copy"><strong>${esc(title)}</strong><small class="muted">${esc(subtitle)}</small></span><span class="explore-hub-arrow">${icon("arrow")}</span></button>`;
}

function listPage(config) {
  const items = state.data[config.key] || [];

  return appShell(`

    ${pageHeader(
      config.eyebrow || "ORGANIZAÇÃO",
      config.title,
      config.subtitle,
      `
        <button
          class="primary-button compact"
          data-action="add-${config.key}"
        >
          ${icon("plus")} Adicionar
        </button>
      `
    )}

    ${
      config.stats
        ? `
          <div class="stats-grid mini">
            ${config.stats()}
          </div>
        `
        : ""
    }

    <div class="content-card">

      <div class="card-toolbar">

        <div class="toolbar-title">
          ${items.length}
          ${items.length === 1 ? "item" : "itens"}
        </div>

        <div class="toolbar-filter">
          ${config.filter || ""}
        </div>

      </div>

      ${
        items.length
          ? `
            <div class="item-list">
              ${items.map(config.render).join("")}
            </div>
          `
          : emptyState(
              config.emptyTitle || "Nada por aqui ainda",
              config.emptyText ||
                "Adicione seu primeiro item para começar.",
              "Adicionar",
              `add-${config.key}`
            )
      }

    </div>

  `);
}

function moduleCard([id, title, desc, ico, page]) {
  const count = countFor(id);

  return `
    <button
      class="module-card"
      data-page="${page}"
    >

      <span class="module-icon">
        ${icon(ico)}
      </span>

      <span class="module-content">

        <strong>${esc(title)}</strong>

        <small>${esc(desc)}</small>

      </span>

      <span class="module-count">
        ${count}
      </span>

      <span class="module-arrow">
        ${icon("arrow")}
      </span>

    </button>
  `;
}

function openThemeSettings(){
  openModal("Aparência", `<p class="muted">Escolha a aparência da interface da LiDire.</p>${selectField("Aparência", "theme", [{value:"dark",label:"🌙 Escuro"},{value:"light",label:"☀️ Claro"}], state.settings.theme||"dark")}`, {submit:"Aplicar"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.settings.theme=f.get("theme")||"dark";saveState();closeModal();applyTheme();render();toast(state.settings.theme==="light"?"Aparência clara aplicada.":"Aparência escura aplicada.");};
}

function politicaCookies(){const l=false;return appShell(`${pageHeader("POLICY",l?"Cookies & storage":"Cookies e armazenamento",l?"How LiDire uses local storage and session data.":"Como o aplicativo utiliza armazenamento local e dados de sessão.")}<div class="content-card"><p>${l?"The MVP uses local storage for some preferences and transition data. Authentication sessions are managed by the Worker. The final architecture will be consolidated during the D1 migration.":"O MVP utiliza armazenamento local para algumas preferências e dados de transição. A sessão de autenticação é administrada pelo Worker. A arquitetura definitiva será consolidada durante a migração para o D1."}</p></div>`);}

function politicaIA(){const l=false;return appShell(`${pageHeader("POLICY",l?"AI Policy":"Política de IA",l?"Rules for LiDire intelligent features.":"Regras para recursos inteligentes da LiDire.")}<div class="content-card"><p>${l?"AI features must respect user permissions. Actions that change or delete data may require confirmation. AI provider keys must remain on the server and never in public application code.":"Recursos de IA deverão respeitar as permissões do usuário. Ações que alterem ou excluam dados poderão exigir confirmação. Chaves de provedores de IA deverão permanecer no servidor e não no código público do aplicativo."}</p></div>`);}

function politicas(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Policies":"Políticas",l?"Review the policies that apply to LiDire.":"Consulte as políticas aplicáveis ao uso da LiDire.")}<div class="content-card"><div class="settings-card">${hubButton("🔒",l?"Privacy Policy":"Política de Privacidade",l?"How personal data is handled":"Como os dados pessoais são tratados","privacidade")}${hubButton("🍪",l?"Cookies & storage":"Cookies e armazenamento",l?"Local storage and technologies used":"Armazenamento local e tecnologias utilizadas","politicaCookies")}${hubButton("🤖",l?"AI Policy":"Política de IA",l?"How AI features may use authorized data":"Como recursos de IA poderão utilizar dados autorizados","politicaIA")}</div></div>`);}

function priorityClass(priority) {
  const map = {
    Baixa: "priority-baixa",
    Normal: "priority-normal",
    "Média": "priority-média",
    Alta: "priority-alta"
  };

  return map[priority || "Normal"];
}

function privacidade(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Privacy":"Privacidade",l?"Understand and control how your data is handled.":"Entenda e controle o tratamento dos seus dados.")}
<div class="content-card" style="display:grid;gap:14px;">
  <section class="content-card" style="margin:0;">
    <h3>${l?"Privacy Policy":"Política de Privacidade"}</h3>
    <p>${l?"LiDire processes only the data needed to provide the features chosen by the user and respects the permissions granted.":"A LiDire trata apenas os dados necessários para fornecer as funcionalidades escolhidas pelo usuário e respeita as permissões concedidas."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"1. What data we collect":"1. Quais dados coletamos"}</h3>
    <p>${l?"Account data, information entered in tasks, agenda, studies, workouts, hydration, nutrition, finances, goals and family features, plus information provided when you authorize specific resources.":"Dados da conta e informações inseridas nos módulos disponíveis, como tarefas, agenda, estudos, treinos, hidratação, alimentação, finanças e objetivos, além de dados técnicos necessários à segurança e ao funcionamento do serviço. Os módulos de compartilhamento familiar, Ciclo Menstrual e Gestação estão em desenvolvimento e não estão ativos nesta versão."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"2. How we use your data":"2. Para que usamos seus dados"}</h3>
    <p>${l?"Your data is used to provide, personalize and improve the LiDire features you choose to use.":"Seus dados são utilizados para fornecer, personalizar e melhorar as funcionalidades da LiDire que você escolhe utilizar."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"3. Sensitive data":"3. Dados sensíveis"}</h3>
    <p>${l?"Health, menstrual-cycle and location information receive additional protection and are used only by features with the necessary authorization.":"Informações de saúde, ciclo menstrual e localização recebem proteção adicional e são utilizadas somente por recursos que tenham a autorização necessária."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"4. Family sharing":"4. Compartilhamento familiar"}</h3>
    <p>${l?"Each shared module requires explicit permission for each contact. Shared records are stored on LiDire servers and can be viewed but not edited. Revoking a module permission blocks future access to that module and removes the stored copy when no other authorized contact uses it.":"O compartilhamento familiar está em desenvolvimento e desativado nesta versão. Não é possível enviar convites ou compartilhar registros por meio do aplicativo. Essa funcionalidade somente será disponibilizada após implementação e validação dos controles de autorização e privacidade."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"5. LiDire AI":"5. IA LiDire"}</h3>
    <p>${l?"AI features must respect the permissions granted by the user. Actions that change or delete data may require confirmation.":"Os recursos de IA devem respeitar as permissões concedidas pelo usuário. Ações que alterem ou excluam dados poderão exigir confirmação."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"6. Your controls":"6. Seus controles"}</h3>
    <p>${l?"You can manage your data and request the available account controls.":"Você pode consultar e gerenciar seus dados e utilizar os controles disponíveis para sua conta."}</p>
    <p class="muted" style="margin-bottom:0;">Use as opções de gerenciamento de dados disponíveis nas configurações da sua conta.</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"7. Security":"7. Segurança"}</h3>
    <p>${l?"LiDire applies security measures appropriate to the services offered and keeps access credentials protected.":"A LiDire aplica medidas de segurança compatíveis com os serviços oferecidos e mantém as credenciais de acesso protegidas."}</p>
  </section>
  <section class="content-card" style="margin:0;">
    <h3>${l?"8. Policy updates":"8. Atualizações da política"}</h3>
    <p>${l?"This policy may be updated when LiDire features or legal requirements change.":"Esta política poderá ser atualizada quando houver mudanças nas funcionalidades da LiDire ou nas exigências aplicáveis."}</p>
    <p class="muted" style="margin-bottom:0;">Última atualização: outubro de 2026</p>
  </section>
</div>`);}
function profilePhotoModal() {
  const hasPhoto = !!state.user.photo;

  openModal(
    hasPhoto ? "Foto de perfil" : "Adicionar foto",
    `
      ${
        hasPhoto
          ? `
            <div class="profile-photo-preview">
              <img
                src="${esc(state.user.photo)}"
                alt="Foto de perfil"
              >
            </div>
          `
          : ""
      }

      <div class="profile-photo-actions">

        <label class="primary-button" style="cursor:pointer;">
          📷 Tirar foto com a câmera
          <input id="profile-camera-input" type="file" accept="image/*" capture="user" style="display:none;">
        </label>

        <label class="ghost-button" style="cursor:pointer;">
          🖼️ ${hasPhoto ? "Escolher outra foto" : "Escolher da galeria"}
          <input id="profile-photo-input" type="file" accept="image/*" style="display:none;">
        </label>

        ${
          hasPhoto
            ? `
              <button
                type="button"
                class="ghost-button"
                data-action="delete-profile-photo"
              >
                🗑 Excluir foto
              </button>
            `
            : ""
        }

      </div>

      <div class="profile-crop-controls" style="display:none" id="profile-crop-controls"><label for="profile-crop-zoom">Ajustar enquadramento</label><input id="profile-crop-zoom" type="range" min="1" max="3" step="0.05" value="1"><small class="muted">Arraste a imagem para centralizar e use o controle para aproximar ou afastar.</small><div class="profile-crop-preview" id="profile-crop-preview"><img id="profile-crop-image" alt="Prévia do enquadramento"></div><button type="button" class="primary-button" id="profile-crop-save">Salvar enquadramento</button></div>
      <p class="muted">Escolha uma imagem. Você poderá ajustar o zoom e a posição antes de salvar.</p>
    `,
    {
      submit: "Fechar"
    }
  );

  const form = modal.querySelector("#lidire-form");

  /*
   * Não precisamos salvar o formulário.
   * A foto é processada diretamente no input.
   */
  form.onsubmit = (e) => {
    e.preventDefault();
    closeModal();
  };

  const inputs = [
    modal.querySelector("#profile-photo-input"),
    modal.querySelector("#profile-camera-input")
  ].filter(Boolean);

  inputs.forEach(input => {
    input.addEventListener("change", () => {

      const file = input.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast("Selecione uma imagem válida.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const cropWrap = modal.querySelector("#profile-crop-controls");
        const preview = modal.querySelector("#profile-crop-preview");
        const image = modal.querySelector("#profile-crop-image");
        const zoom = modal.querySelector("#profile-crop-zoom");
        const saveCrop = modal.querySelector("#profile-crop-save");
        if (!cropWrap || !image || !zoom || !saveCrop) { toast("Não foi possível abrir o ajuste da foto.", "error"); return; }
        cropWrap.style.display = "grid"; cropWrap.style.gap = "8px";
        image.src = String(reader.result); image.style.transformOrigin = "center";
        image.style.width = "100%"; image.style.height = "100%"; image.style.objectFit = "cover";
        let scale = 1, dx = 0, dy = 0, dragging = false, sx = 0, sy = 0;
        const apply = () => { image.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`; };
        zoom.oninput = () => { scale = Number(zoom.value); apply(); };
        preview.style.cssText = "width:220px;height:220px;max-width:70vw;border-radius:50%;overflow:hidden;position:relative;margin:auto;background:#151a2e;touch-action:none";
        image.style.cssText += ";position:absolute;inset:0;user-select:none;pointer-events:none";
        preview.onpointerdown = e => { dragging=true; sx=e.clientX-dx; sy=e.clientY-dy; preview.setPointerCapture(e.pointerId); };
        preview.onpointermove = e => { if(!dragging)return; dx=e.clientX-sx; dy=e.clientY-sy; apply(); };
        preview.onpointerup = () => { dragging=false; };
        saveCrop.onclick = () => {
          const srcImg = new Image(); srcImg.onload = () => {
            const canvas=document.createElement("canvas"); canvas.width=512; canvas.height=512; const ctx=canvas.getContext("2d");
            const side=Math.min(srcImg.naturalWidth,srcImg.naturalHeight), baseScale=512/side;
            const scaledW=srcImg.naturalWidth*baseScale*scale, scaledH=srcImg.naturalHeight*baseScale*scale;
            const offsetX=(512-scaledW)/2 + dx*(512/220), offsetY=(512-scaledH)/2 + dy*(512/220);
            ctx.drawImage(srcImg,offsetX,offsetY,scaledW,scaledH);
            const cropped=canvas.toDataURL("image/jpeg",0.88); state.user.photo=cropped; saveState();
            apiRequest("/api/profile",{method:"PUT",body:JSON.stringify({name:state.user.name,email:state.user.email,age:state.user.age,birth_date:state.user.birth_date||"",phone:state.user.phone,address:state.user.address,profile_photo:cropped})})
              .then(response=>{if(response.user)syncUserToState(response.user);})
              .catch(error=>toast(error.message||"Não foi possível salvar a foto no servidor.","error"))
              .finally(()=>{closeModal();render();});
            toast("Foto ajustada e salva.");
          }; srcImg.src=String(reader.result);
        };
      };
      reader.readAsDataURL(file);
    });
  });
}

function receitas(){
  const list = Array.isArray(state.data.receitas) ? state.data.receitas : [];
  return appShell(`${pageHeader("ALIMENTAÇÃO","Receitas","Guarde suas receitas favoritas e organize ingredientes, preparo e observações.", `<button class="primary-button compact" data-action="recipe-coming-soon">+ Nova receita</button>`)}
  <div class="content-card">${list.length ? `<div class="item-list">${list.map(r=>`<div class="list-item"><div class="module-icon small">🍳</div><div class="item-main"><strong>${esc(r.name||"Receita")}</strong><span>${(r.ingredients||[]).length} ingredientes${r.calories?` · ${Number(r.calories)} kcal`:""}${r.servings?` · ${Number(r.servings)} porções`:""}</span><small>${esc(r.instructions||"")}</small></div></div>`).join("")}</div>` : `<div class="empty-state"><div class="empty-orb">🍳</div><h3>Suas receitas</h3><p>Peça à LiDire para salvar uma receita e ela aparecerá aqui.</p></div>`}</div>`);
}

function alterarSenha(){return appShell(`${pageHeader("SEGURANÇA","Alterar senha","Altere a senha usada para entrar na sua conta LiDire.")}<div class="content-card"><form id="change-account-password-form" class="form-grid">
  ${field("Senha atual","currentPassword","password","Digite sua senha atual","required minlength=8 autocomplete=current-password")}
  ${field("Nova senha","newPassword","password","Mínimo de 8 caracteres","required minlength=8 autocomplete=new-password")}
  ${field("Confirmar nova senha","newPasswordConfirm","password","Repita a nova senha","required minlength=8 autocomplete=new-password")}
  <button class="primary-button" type="submit">Salvar nova senha</button>
</form></div>`);} 

function seguranca(){return appShell(`${pageHeader("SEGURANÇA","Segurança","Proteja o acesso ao aplicativo.")}<div class="content-card"><div class="settings-card">${hubButton("🔢","PIN / senha do aplicativo","Configurar bloqueio de acesso","segurancaPIN")}${hubButton("👆","Biometria","Usar a biometria do aparelho quando disponível","segurancaBiometria")}</div></div>`);}

const LIDIRE_BIOMETRIC_KEY = "lidire-biometric-credential-v1";

function biometricBase64Url(bytes){
  let binary="";
  const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  for(const b of arr) binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function biometricBase64UrlToBytes(value){
  const normalized=String(value||"").replace(/-/g,"+").replace(/_/g,"/");
  const padded=normalized+"=".repeat((4-normalized.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function biometricRandomChallenge(){
  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}
function biometricStoredCredential(){
  try{return JSON.parse(localStorage.getItem(LIDIRE_BIOMETRIC_KEY)||"null");}catch(_){return null;}
}
function biometricIsSupported(){
  return !!(window.PublicKeyCredential && navigator.credentials && typeof navigator.credentials.create==="function" && typeof navigator.credentials.get==="function");
}
async function biometricPlatformAvailable(){
  if(!biometricIsSupported()) return false;
  try{
    if(typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable==="function"){
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  }catch(_){return false;}
}
async function biometricRegister(){
  if(!authUser){toast("Entre na sua conta para ativar a biometria.","error");return;}
  if(!window.isSecureContext){toast("A biometria precisa de uma conexão segura (HTTPS).","error");return;}
  if(!(await biometricPlatformAvailable())){toast("Este aparelho ou navegador não disponibiliza biometria do sistema.","error");return;}
  const button=document.querySelector('[data-action="biometric-enable"]');
  if(button) button.disabled=true;
  try{
    const userId=crypto.getRandomValues(new Uint8Array(16));
    const credential=await navigator.credentials.create({publicKey:{
      challenge:biometricRandomChallenge(),
      rp:{name:"LiDire",id:location.hostname},
      user:{id:userId,name:String(authUser.email||"lidire@local"),displayName:String(authUser.name||"Usuário LiDire")},
      pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],
      authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"preferred"},
      timeout:60000,
      attestation:"none"
    }});
    if(!credential) throw new Error("Não foi possível criar a credencial biométrica.");
    const rawId=biometricBase64Url(credential.rawId);
    localStorage.setItem(LIDIRE_BIOMETRIC_KEY,JSON.stringify({credentialId:rawId,rpId:location.hostname,createdAt:new Date().toISOString()}));
    await biometricAuthenticate(true);
    render();
    toast("Biometria ativada neste dispositivo.");
  }catch(error){
    console.warn("Biometria LiDire:",error);
    if(error?.name==="NotAllowedError") toast("A autenticação biométrica foi cancelada.","error");
    else toast(error?.message||"Não foi possível ativar a biometria.","error");
  }finally{if(button) button.disabled=false;}
}
async function biometricAuthenticate(silent=false){
  const stored=biometricStoredCredential();
  if(!stored?.credentialId){if(!silent) toast("Nenhuma biometria está configurada neste dispositivo.","error");return false;}
  if(!(await biometricPlatformAvailable())){if(!silent) toast("A biometria do sistema não está disponível.","error");return false;}
  try{
    const credential=await navigator.credentials.get({publicKey:{
      challenge:biometricRandomChallenge(),
      rpId:stored.rpId||location.hostname,
      allowCredentials:[{type:"public-key",id:biometricBase64UrlToBytes(stored.credentialId)}],
      userVerification:"required",
      timeout:60000
    }});
    if(!credential) throw new Error("A autenticação biométrica não foi concluída.");
    return true;
  }catch(error){
    console.warn("Biometria LiDire:",error);
    if(!silent){
      if(error?.name==="NotAllowedError") toast("A autenticação biométrica foi cancelada.","error");
      else toast(error?.message||"Não foi possível autenticar com a biometria.","error");
    }
    return false;
  }
}
function biometricDisable(){
  localStorage.removeItem(LIDIRE_BIOMETRIC_KEY);
  render();
  toast("Biometria desativada neste dispositivo.");
}
function segurancaBiometria(){
  const configured=!!biometricStoredCredential()?.credentialId;
  const action=configured?`<button class="danger-button" type="button" data-action="biometric-disable">Desativar biometria</button><button class="ghost-button" type="button" data-action="biometric-test">Testar biometria</button>`:`<button class="primary-button" type="button" data-action="biometric-enable">Ativar biometria</button>`;
  return appShell(`${pageHeader("SEGURANÇA","Biometria","Use a biometria do próprio sistema operacional.")}<div class="content-card"><div class="app-lock-status ${configured?"active":"inactive"}"><div><strong>Biometria do aparelho</strong><small>${configured?"Ativada neste dispositivo":"Desativada"}</small></div><span>${configured?"🔐":"🔓"}</span></div><p class="muted">A LiDire não armazena sua impressão digital, rosto ou qualquer outro dado biométrico. A autenticação é realizada pelo próprio sistema operacional.</p><div class="app-lock-actions">${action}</div></div>`);
}

function segurancaPIN(){
  const configured = appLock.configured;
  const enabled = appLock.enabled;
  return appShell(`${pageHeader("SEGURANÇA","PIN / senha","Configure o bloqueio de acesso ao aplicativo.")}
    <div class="content-card app-lock-settings-card">
      <div class="app-lock-status ${enabled ? "active" : "inactive"}">
        <div><strong>Bloqueio do aplicativo</strong><small>${enabled ? "Ativado" : "Desativado"}</small></div>
        <span>${enabled ? "🔒" : "🔓"}</span>
      </div>
      <form id="app-lock-settings-form" class="form-grid">
        ${configured ? field("PIN atual", "currentSecret", "password", "Digite o PIN atual", "required") : ""}
        ${field(configured ? "Novo PIN (opcional)" : "Novo PIN", "secret", "password", configured ? "Deixe em branco para manter o atual" : "4 a 6 dígitos", configured ? "" : "required")}
        ${field(configured ? "Confirmar novo PIN" : "Confirmar PIN", "secretConfirm", "password", "Repita o PIN", configured ? "" : "required")}
        <div class="app-lock-actions">
          <button class="primary-button" type="submit">${configured ? "Salvar configuração" : "Ativar bloqueio"}</button>
          ${enabled ? `<button class="ghost-button" type="button" data-action="app-lock-now">🔒 Bloquear agora</button>` : ""}
          ${configured && enabled ? `<button class="danger-button" type="button" data-action="app-lock-disable">Desativar bloqueio</button>` : ""}
        </div>
      </form>
    </div>`);
}

const priorityOrder = { Alta: 1, "Média": 2, Normal: 3, Baixa: 4 };

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {

    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    const pa =
      priorityOrder[a.priority || "Normal"] || 3;

    const pb =
      priorityOrder[b.priority || "Normal"] || 3;

    if (pa !== pb) {
      return pa - pb;
    }

    const da = `${a.date || "9999-12-31"} ${a.time || "23:59"}`;
    const db = `${b.date || "9999-12-31"} ${b.time || "23:59"}`;

    return da.localeCompare(db);
  });
}

function suporte() {
  return appShell(`
    ${pageHeader("AJUDA", "Suporte", "Encontre ajuda, informe bugs ou entre em contato com a equipe LiDire.")}
    <div class="content-card"><div class="settings-card">
      <button data-action="report-bug"><span>🐞</span><div><strong>Informar bug</strong><small>Relate um problema encontrado no aplicativo.</small></div>${icon("arrow")}</button>
      <button data-action="support-email"><span>✉</span><div><strong>Contatar por e-mail</strong><small>contato@lidire.online</small></div>${icon("arrow")}</button>
    </div></div>
    <div class="content-card"><span class="eyebrow">EM BREVE</span><h3>Novas formas de suporte</h3><p class="muted">A estrutura está preparada para FAQ, central de ajuda, acompanhamento de chamados e outros canais futuramente.</p></div>
  `);
}

function tarefas() {
  const sorted = sortTasks(state.data.tarefas);

  return appShell(`

    ${pageHeader(
      "FAZER",
      "Tarefas",
      "Tire as coisas da cabeça e coloque em movimento.",
      `
        <button
          class="primary-button compact"
          data-action="add-tarefas"
        >
          ${icon("plus")} Adicionar
        </button>
      `
    )}

    <div class="stats-grid mini">

      ${statCard(
        state.data.tarefas.filter(x => x.done).length,
        "Concluídas",
        "cyan"
      )}

      ${statCard(
        state.data.tarefas.filter(x => !x.done).length,
        "Pendentes",
        "purple"
      )}

      ${statCard(
        state.data.tarefas.length
          ? Math.round(
              state.data.tarefas.filter(x => x.done).length /
              state.data.tarefas.length *
              100
            ) + "%"
          : "0%",
        "Progresso",
        "pink"
      )}

    </div>

    <div class="content-card">

      <div class="card-toolbar">
        <div class="toolbar-title">
          Ordenadas por prioridade, data e horário
        </div>
      </div>

      ${
        sorted.length
          ? `
            <div class="item-list">

              ${sorted.map((x) => `

                <div
                  class="list-item ${x.done ? "completed" : ""}"
                >

                  <div
                    class="task-priority ${priorityClass(
                      x.priority
                    )}"
                  ></div>

                  <button
                    class="check-button ${x.done ? "checked" : ""}"
                    data-action="toggle-tarefa"
                    data-id="${x.id}"
                  >
                    ${x.done ? "✓" : ""}
                  </button>

                  <div class="item-main">

                    <strong>
                      ${esc(x.title)}
                    </strong>

                    <span>

                      ${
                        x.priority
                          ? `Prioridade: ${esc(x.priority)}`
                          : "Prioridade: Normal"
                      }

                      ${
                        x.date
                          ? ` · ${dateBR(x.date)}`
                          : ""
                      }

                      ${
                        x.time
                          ? ` · ◷ ${esc(x.time)}`
                          : ""
                      }

                    </span>

                  </div>

                  <div class="item-actions">

                    <button
                      data-action="edit-tarefa"
                      data-id="${x.id}"
                    >
                      ${icon("edit")}
                    </button>

                    <button
                      data-action="delete-tarefa"
                      data-id="${x.id}"
                    >
                      ${icon("trash")}
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : emptyState(
              "Nenhuma tarefa criada",
              "Crie uma tarefa para começar a organizar seu dia.",
              "Adicionar tarefa",
              "add-tarefas"
            )
      }

    </div>


  `);
}

function sobre(){const l=false;return appShell(`${pageHeader("LIDIRE",l?"About LiDire":"Sobre a LiDire",l?"Your life organization copilot.":"Seu Copiloto para a Vida")}<div class="content-card"><h3>LiDire — Seu Copiloto para a Vida</h3><p>A vida é uma jornada repleta de responsabilidades, compromissos, sonhos e planos. Entre trabalho, estudos, família, saúde e finanças, encontrar o equilíbrio e manter tudo organizado pode ser um desafio diário.</p><p>Foi para tornar essa jornada mais leve que nasceu a LiDire.</p><p>Mais do que uma ferramenta de organização, a LiDire é uma plataforma desenvolvida para acompanhar você em diferentes áreas da vida, ajudando a planejar a rotina, gerenciar responsabilidades, acompanhar metas e dedicar mais atenção ao que realmente importa.</p><p>Em um só lugar, você pode organizar tarefas, compromissos, estudos, treinos, hidratação, finanças e objetivos pessoais, conectando diferentes aspectos do seu dia a dia de forma prática e integrada.</p><p>Com o auxílio de um assistente inteligente, a LiDire busca tornar a organização ainda mais simples e intuitiva, permitindo que você interaja naturalmente com a plataforma e encontre apoio para planejar atividades, administrar compromissos e conduzir sua rotina com mais eficiência.</p><p>Porque a vida também acontece em família, a LiDire oferece recursos para compartilhar informações e organizar responsabilidades entre seus membros, facilitando a colaboração e contribuindo para uma rotina familiar mais alinhada.</p><p>Acreditamos que a tecnologia deve estar a serviço das pessoas, simplificando tarefas, reduzindo a sobrecarga da organização cotidiana e criando espaço para aquilo que realmente tem valor. Afinal, organizar a vida não significa apenas cumprir compromissos, mas conquistar mais clareza, equilíbrio e liberdade para fazer escolhas conscientes.</p><p>Nosso propósito é ajudar você a transformar planos em atitudes, desafios em possibilidades e sonhos em objetivos concretos, construindo, um dia de cada vez, a vida que deseja viver.</p><p>Organize sua rotina. Cuide do que importa. Construa o futuro que deseja.</p></div>`);}
function assinatura(){const l=false;const plan=state.settings.subscriptionPlan||"free";return appShell(`${pageHeader("ASSINATURA",l?"Subscription":"Assinatura",l?"Choose when and how you want to upgrade LiDire.":"Escolha quando e como deseja evoluir sua experiência na LiDire.")}<div class="content-card"><div class="v5-plan-row"><div><strong>${plan==="premium"?(l?"Premium Plan":"Plano Premium"):(l?"Free Plan":"Plano Gratuito")}</strong><small>${plan==="premium"?(l?"LiDire + AI + Family":"LiDire + IA + Família"):(l?"Core organization features":"Recursos essenciais de organização")}</small></div><span>${plan==="premium"?"✦":"◯"}</span></div><div class="content-card"><h3>Escolha seu próximo plano</h3><p class="muted">Compare as opções disponíveis e escolha a experiência que melhor combina com sua rotina.</p><button class="primary-button" data-page="assinaturaUpgrade">Ver opções de upgrade</button><button class="secondary-button" data-page="assinaturaBeneficios" style="margin-top:10px;">Ver benefícios</button></div></div>`);}
function assinaturaUpgrade(){const plan=state.settings.subscriptionPlan||"free";return appShell(`${pageHeader("ASSINATURA","Opções de upgrade","Escolha o plano que deseja ter na LiDire.")}<div class="content-card" style="display:grid;gap:14px;"><section class="content-card" style="margin:0;"><h3>Plano Gratuito</h3><p>Recursos essenciais para organizar sua rotina.</p><ul class="muted" style="line-height:1.8;padding-left:20px;"><li>Tarefas e agenda</li><li>Listas e lembretes</li><li>Organização pessoal</li><li>Recursos básicos da LiDire</li></ul><button class="secondary-button" disabled>${plan==="free"?"Plano atual":"Plano Gratuito"}</button></section><section class="content-card" style="margin:0;border:1px solid rgba(130,91,255,.45);"><h3>✦ Plano Premium</h3><p>Uma experiência ampliada para quem deseja aproveitar mais recursos da LiDire.</p><ul class="muted" style="line-height:1.8;padding-left:20px;"><li>Maior uso de IA</li><li>Planejamento avançado</li><li>Recursos familiares ampliados</li><li>Prioridade para novos recursos Premium</li></ul><button class="primary-button" data-action="choose-premium">${plan==="premium"?"Plano Premium ativo":"Assinar Premium"}</button><p class="muted" style="margin-bottom:0;font-size:12px;">A cobrança e o pagamento serão conectados quando o provedor de assinaturas for integrado.</p></section></div>`);}
function assinaturaBeneficios(){return appShell(`${pageHeader("ASSINATURA","Benefícios","Veja o que muda ao evoluir sua experiência na LiDire.")}<div class="content-card" style="display:grid;gap:12px;"><section class="content-card" style="margin:0;"><h3>✦ Mais IA</h3><p>Mais espaço para utilizar a assistente LiDire em planejamento, organização e consultas.</p></section><section class="content-card" style="margin:0;"><h3>▦ Planejamento avançado</h3><p>Recursos ampliados para organizar objetivos, rotina e planos de forma mais completa.</p></section><section class="content-card" style="margin:0;"><h3>👥 Recursos familiares ampliados</h3><p>Mais possibilidades para utilizar o compartilhamento familiar conforme as permissões concedidas.</p></section><section class="content-card" style="margin:0;"><h3>🚀 Evolução Premium</h3><p>Novos recursos Premium poderão ser adicionados à experiência ao longo da evolução da LiDire.</p></section><button class="primary-button" data-page="assinaturaUpgrade">Ver opções de upgrade</button></div>`);}
function termos(){const l=false;return appShell(`${pageHeader("LEGAL",l?"Terms of Use":"Termos de Uso",l?"Review the rules for using LiDire.":"Conheça as regras para utilizar a LiDire.")}<div class="content-card" style="display:grid;gap:14px;">
  <section class="content-card" style="margin:0;"><h3>Termos de Uso da LiDire</h3><p>A LiDire é uma plataforma de organização pessoal destinada a ajudar o usuário a gerenciar rotina, compromissos, tarefas, estudos, alimentação, treinos, hidratação, finanças, objetivos, lembretes e outros conteúdos disponíveis escolhidos pelo próprio usuário. Compartilhamento familiar, Ciclo Menstrual e Gestação estão em desenvolvimento e não estão disponíveis nesta versão.</p></section>
  <section class="content-card" style="margin:0;"><h3>1. Conta e acesso</h3><p>Para utilizar recursos que dependem de uma conta, o usuário deve fornecer informações verdadeiras e manter suas credenciais de acesso protegidas. A conta é pessoal e o usuário é responsável pelas atividades realizadas com suas credenciais.</p></section>
  <section class="content-card" style="margin:0;"><h3>2. Uso da LiDire</h3><p>O usuário deve utilizar a LiDire de forma lícita, responsável e compatível com a finalidade do serviço. Não é permitido utilizar a plataforma para tentar obter acesso não autorizado, interferir no funcionamento do serviço ou praticar atividades ilícitas.</p></section>
  <section class="content-card" style="margin:0;"><h3>3. Conteúdo do usuário</h3><p>As informações inseridas na LiDire permanecem sob responsabilidade do usuário. O usuário deve revisar os dados cadastrados e utilizar os recursos de exportação ou exclusão disponibilizados pela plataforma quando desejar exercer esses controles.</p></section>
  <section class="content-card" style="margin:0;"><h3>4. Compartilhamento familiar</h3><p>O compartilhamento familiar está em desenvolvimento e não está disponível nesta versão. Convites, compartilhamentos e notificações entre familiares estão desativados. Os módulos Gestação e Ciclo Menstrual também estão em desenvolvimento e não permitem registrar ou consultar dados nesta versão.</p></section>
  <section class="content-card" style="margin:0;"><h3>5. Grupos e conteúdos compartilhados</h3><p>Ao participar de um grupo, cada pessoa deve respeitar os demais participantes e as permissões de compartilhamento. É proibido publicar ou incentivar mensagens discriminatórias, racistas, preconceituosas, de assédio, ameaças, intimidação ou violência. Também é proibido divulgar sem autorização informações pessoais, fotografias, dados sensíveis, mensagens privadas ou outros conteúdos de membros, inclusive fora do grupo. A participação em um grupo não representa autorização para divulgar dados publicamente ou repassá-los a terceiros.</p><p>Cada participante é responsável pelo conteúdo que envia e deve respeitar a legislação aplicável e a privacidade dos demais. Conteúdos abusivos podem ser denunciados pelos mecanismos disponibilizados. Conforme a gravidade e as circunstâncias, a LiDire poderá remover conteúdos, restringir funcionalidades, suspender convites ou contas e adotar outras medidas cabíveis, observadas as regras aplicáveis. A disponibilidade de ferramentas de denúncia e moderação depende dos recursos implementados no serviço.</p><p>O criador do grupo define os recursos propostos para compartilhamento, mas cada convidado deve poder aceitar todos, alguns ou nenhum deles. As permissões devem ser individuais e podem ser alteradas conforme os controles disponíveis.</p></section>
  <section class="content-card" style="margin:0;"><h3>6. Inteligência artificial</h3><p>Os recursos de IA da LiDire são ferramentas de apoio à organização. As respostas podem exigir conferência pelo usuário e não substituem avaliação profissional quando a situação exigir orientação especializada. Ações que alterem ou excluam dados poderão exigir confirmação.</p></section>
  <section class="content-card" style="margin:0;"><h3>7. Integrações e serviços externos</h3><p>Algumas funcionalidades podem depender de permissões, dispositivos, integrações ou serviços de terceiros. A disponibilidade dessas funcionalidades pode variar conforme o serviço utilizado e suas respectivas condições.</p></section>
  <section class="content-card" style="margin:0;"><h3>8. Segurança e privacidade</h3><p>A LiDire adota medidas de segurança compatíveis com os serviços oferecidos. O tratamento de dados é apresentado na Política de Privacidade, que integra as regras de utilização da plataforma.</p></section>
  <section class="content-card" style="margin:0;"><h3>9. Disponibilidade e alterações</h3><p>A LiDire poderá atualizar, aprimorar, suspender ou substituir funcionalidades para evolução do serviço, segurança ou manutenção. Os termos poderão ser atualizados quando houver mudanças relevantes no serviço ou nas exigências aplicáveis.</p></section>
  <section class="content-card" style="margin:0;"><h3>10. Encerramento da conta</h3><p>O usuário poderá solicitar a exclusão da conta pelos mecanismos disponibilizados pela LiDire. A exclusão poderá afetar o acesso aos dados e funcionalidades associados à conta.</p></section>
  <section class="content-card" style="margin:0;"><h3>11. Aceite</h3><p>Ao criar uma conta e utilizar a LiDire, o usuário declara que leu e concorda com estes Termos de Uso e com a Política de Privacidade.</p><p class="muted" style="margin-bottom:0;">Última atualização: outubro de 2026</p></section>
</div>`);}

async function openGroupForm(existing=null){
  const current=existing||{};
  const name=prompt("Nome do grupo:",current.name||""); if(name===null)return; if(!name.trim()){toast("Informe o nome do grupo.","error");return;}
  const resourceChoices=["Agenda","Tarefas","Compras","Estudos","Treinos","Hidratação","Alimentação","Objetivos","Lembretes"];
  const resourcesRaw=prompt("Quais recursos deseja propor para compartilhamento?\nDigite os nomes separados por vírgula.\nOpções: "+resourceChoices.join(", "),(current.resources||[]).join(", ")); if(resourcesRaw===null)return;
  const resources=resourcesRaw.split(",").map(x=>x.trim()).filter(x=>resourceChoices.some(r=>r.toLowerCase()===x.toLowerCase())).map(x=>resourceChoices.find(r=>r.toLowerCase()===x.toLowerCase()));
  const inviteRaw=prompt("E-mails dos participantes para convidar (separados por vírgula). Podem ser familiares ou outras pessoas:",(current.invitations||[]).map(i=>i.email).join(", ")); if(inviteRaw===null)return;
  const emails=[...new Set(inviteRaw.split(",").map(x=>x.trim().toLowerCase()).filter(x=>/^\S+@\S+\.\S+$/.test(x)))];
  const group={...current,id:current.id||uid("grupo"),name:name.trim(),resources,updatedAt:new Date().toISOString(),invitations:[],members:current.members||[]};
  if(!Array.isArray(state.data.grupos))state.data.grupos=[];
  const idx=state.data.grupos.findIndex(g=>g.id===group.id); if(idx>=0)state.data.grupos[idx]={...state.data.grupos[idx],...group};else state.data.grupos.unshift(group);
  let sent=0, failed=[];
  if(authUser && emails.length){
    for(const email of emails){
      try{
        const result=await apiRequest("/api/groups/invitations",{method:"POST",body:JSON.stringify({groupId:group.id,groupName:group.name,recipientEmail:email,resources}),timeoutMs:15000});
        sent++; group.invitations.push({id:result.invitation?.id||uid("convite"),serverInvitationId:result.invitation?.id,email,status:"pending",proposedResources:[...resources],acceptedResources:[]});
      }catch(error){failed.push(`${email}: ${error.message||"falha no envio"}`);group.invitations.push({email,status:"failed",message:error.message||"Falha no envio",proposedResources:[...resources],acceptedResources:[]});}
    }
  } else if(emails.length){ emails.forEach(email=>group.invitations.push({email,status:"pending",proposedResources:[...resources],acceptedResources:[]})); }
  saveState();
  if(authUser) await loadGroupInvitationsFromD1();
  render();
  if(failed.length) toast(`Grupo salvo. ${sent} convite(s) enviado(s); ${failed.length} falharam. ${failed.slice(0,2).join("; ")}`,"error");
  else toast(emails.length?`Grupo salvo. ${sent} convite(s) enviado(s) para contas cadastradas.`:"Grupo salvo.","success");
}
function gestacao(){
  return appShell(`${pageHeader("SAÚDE","Gestação","Este módulo será disponibilizado em uma versão futura da LiDire.")}
    <section class="content-card" style="text-align:center;padding:24px 20px;">
      <div style="font-size:42px;margin-bottom:12px;" aria-hidden="true">🤰</div>
      <h2>Funcionalidade em desenvolvimento</h2>
      <p>O registro e o acompanhamento da gestação estão temporariamente indisponíveis. Estamos trabalhando para preparar este módulo com os cuidados necessários de privacidade e proteção dos dados.</p>
    </section>
    <section class="content-card" style="border:1px solid rgba(139,92,246,.35);background:rgba(139,92,246,.08);"><strong style="display:block;margin-bottom:8px;color:#a78bfa">IMPORTANTE</strong><p style="margin:0">A LiDire te ajudará a registrar e organizar dados sobre sua gestação. As informações que vierem a ser registradas não substituirão o acompanhamento médico. Fique atenta aos sintomas. Para esclarecimentos de dúvidas e recomendações, procure um profissional habilitado.</p></section>`);
}


const pages = {
  inicio: home,
  agenda,
  tarefas,
  compras,
  "compras-salvas": comprasSalvas,
  estudos,
  treinos,
  hidratacao,
  alimentacao,
  financas,
  objetivos,
  familia,
  "familia-lixeira": familiaLixeira,
  "familia-settings": familySettings,
  cicloMenstrual,
  gestacao,
  climaRotas,
  assistente,
  explorar: explorarHub,
  perfil,
  suporte,
  configuracoes,
  configuracoesNotificacoes,
  audioLibrary,
  dietLibrary,
  termos,
  politicas,
  privacidade,
  politicaCookies,
  politicaIA,
  seguranca,
  segurancaPIN,
  segurancaBiometria,
  alterarSenha,
  preferencias,
  dados,
  receitas,
  assinatura,
  assinaturaUpgrade,
  assinaturaBeneficios,
  sobre,
  anotacoes
};

function navigateTo(page, replace = false) {
  currentPage = page || "inicio";
  currentShoppingList = null;
  const url = `#${encodeURIComponent(currentPage)}`;
  const stateObj = { page: currentPage, lidire: true, shoppingList: null };
  if (replace) history.replaceState(stateObj, "", url);
  else history.pushState(stateObj, "", url);
  render();
}

function navigateToShoppingList(listId, replace = false) {
  currentPage = "compras";
  currentShoppingList = String(listId || "");
  const url = `#compras/${encodeURIComponent(currentShoppingList)}`;
  const stateObj = { page: "compras", lidire: true, shoppingList: currentShoppingList };
  if (replace) history.replaceState(stateObj, "", url);
  else history.pushState(stateObj, "", url);
  render();
}

function goBack() {
  if (history.length > 1 && history.state?.lidire !== false) {
    history.back();
  } else {
    navigateTo("inicio");
  }
}

function enhanceReminderLinks(){if(!authUser)return;const sourceMap={tarefas:"tarefa",agenda:"compromisso",estudos:"estudo"};const src=sourceMap[currentPage];if(src){document.querySelectorAll('[data-action^="edit-"]').forEach(btn=>{const id=btn.dataset.id;const row=btn.closest(".list-item");if(row&&!row.querySelector("[data-action=\"create-reminder\"]")){const b=document.createElement("button");b.className="text-button";b.dataset.action="create-reminder";b.dataset.source=src;b.dataset.id=id;b.textContent="🔔";b.title="Criar lembrete";row.querySelector(".item-actions")?.prepend(b);}});}}
function bindDirectPageNavigation() {
  document.querySelectorAll("[data-page]").forEach(function(el) {
    el.onclick = function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const page = el.getAttribute("data-page");
      if (page) navigateTo(page);
      return false;
    };
  });
}

function render(preserveScroll = false) {
  const preservedScrollY = window.scrollY;
  const openDetails = Array.from(document.querySelectorAll('#app details.sharing-section')).map((node, index) => ({index, open:node.open}));
  const root =
    document.getElementById("app");

  if (!root) return;

  if (!authChecked) {
    root.innerHTML = authLoadingScreen();
    return;
  }

  if (!authUser) {
    renderAuth();
    return;
  }

  if (appLock.enabled && !appLock.unlocked) {
    root.innerHTML = appLockScreen();
    applyTheme();
    applyLanguage();
    bindAppLockScreen();
    return;
  }

  if (
    currentPage === "compras" &&
    currentShoppingList
  ) {
    root.innerHTML =
      listaCompras(
        currentShoppingList
      );
  } else {
    root.innerHTML =
      (
        pages[currentPage] ||
        home
      )();
  }

  openDetails.forEach(item=>{const node=document.querySelectorAll('#app details.sharing-section')[item.index];if(node) node.open=item.open;});
  enhanceReminderLinks();
  bindDirectPageNavigation();
  applyTheme();
  applyLanguage();
  if (currentPage === "inicio" && providerConnections.gmail) loadGmailDailySummary();
  window.scrollTo({top:preservedScrollY,behavior:"auto"});
  if(currentPage==="inicio") loadRealWeather();
  if(currentPage==="climaRotas") bindClimateRouteForms();
  if(currentPage==="cicloMenstrual") loadCyclePeriodsFromD1();
  if(currentPage==="anotacoes"){
    bindNotesFilters();
    loadNotesFromD1();
  }
}

/* =========================================================
   MODAIS
   ========================================================= */

function openModal(
  title,
  body,
  options = {}
) {
  closeModal();

  modal =
    document.createElement("div");

  modal.className =
    "modal-backdrop";

  modal.innerHTML = `

    <div
      class="modal"
      role="dialog"
      aria-modal="true"
    >

      <div class="modal-header">

        <div>

          <span class="eyebrow">
            ${esc(
              options.eyebrow ||
              "LIDIRE"
            )}
          </span>

          <h2>
            ${esc(title)}
          </h2>

        </div>

        <button
          class="modal-close"
          data-action="close-modal"
        >
          ×
        </button>

      </div>

      <form
        id="lidire-form"
        class="form-grid"
      >

        ${body}

        <div class="modal-footer">

          <button
            type="button"
            class="ghost-button"
            data-action="close-modal"
          >
            Cancelar
          </button>

          <button
            class="primary-button"
            type="submit"
          >
            ${esc(
              options.submit ||
              "Salvar"
            )}
          </button>

        </div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);
  applyLanguage();
  applyTheme();

  modal
    .querySelector(
      "input, select, textarea"
    )
    ?.focus();
}

function stopReminderPreviewAudio() {
  // O cadastro de lembrete nunca deve deixar uma prévia tocando depois de salvar,
  // cancelar ou fechar o modal. Inclui instâncias antigas que já não estejam
  // apontadas por currentReminderAudio.
  try {
    reminderAudioInstances.forEach(audio=>stopAudioElement(audio));
    reminderAudioInstances.clear();
  } catch (_) {}
  try {
    if (currentReminderAudio) stopAudioElement(currentReminderAudio);
  } catch (_) {}
  currentReminderAudio = null;
}

function closeModal() {
  // Prévia/teste de áudio deve parar ao fechar o cadastro.
  // O alarme real (window.__lidireAlarmAudio) é controlado separadamente
  // por Desligar alarme/Soneca.
  stopReminderPreviewAudio();
  document
    .querySelector(
      ".modal-backdrop"
    )
    ?.remove();

  modal = null;
}

function field(
  label,
  name,
  type = "text",
  value = "",
  extra = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <input
        name="${esc(name)}"
        type="${type}"
        value="${esc(value)}"
        ${extra}
      >

    </label>
  `;
}

function textareaField(
  label,
  name,
  value = "",
  extra = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <textarea
        name="${esc(name)}"
        ${extra}
      >${esc(value)}</textarea>

    </label>
  `;
}

function selectField(
  label,
  name,
  options,
  selected = ""
) {
  return `
    <label class="form-field">

      <span>
        ${esc(label)}
      </span>

      <select name="${esc(name)}">

        ${options.map(option => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          return `
            <option
              value="${esc(value)}"
              ${value === selected ? "selected" : ""}
            >
              ${esc(label)}
            </option>
          `;
        }).join("")}

      </select>

    </label>
  `;
          }

/* =========================================================
   FORMULÁRIOS DE ADIÇÃO
   ========================================================= */

function addForm(key) {

  /* ---------------- AGENDA ---------------- */

  if (key === "compromissos") {

    openModal(
      "Novo compromisso",

      field(
        "Título",
        "title",
        "text",
        "",
        "required"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO(),
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time",
        nowTime()
      ) +

      field(
        "Local",
        "location"
      ) +

      selectField(
        "Lugar frequente (opcional)",
        "frequentPlaceId",
        [{ value: "", label: "Selecione um lugar cadastrado" }, ...(state.data.lugares || []).map(place => ({ value: String(place.id), label: place.name || place.address }))],
        ""
      ) +

      field(
        "Endereço",
        "address",
        "text",
        "",
        'placeholder="Digite ou cole o endereço do compromisso"'
      ),

      {
        submit: "Adicionar"
      }
    );

    const appointmentForm = modal.querySelector("#lidire-form");
    const frequentPlaceSelect = appointmentForm.querySelector('[name="frequentPlaceId"]');
    frequentPlaceSelect?.addEventListener("change", () => {
      const selectedPlace = (state.data.lugares || []).find(place => String(place.id) === String(frequentPlaceSelect.value));
      const addressInput = appointmentForm.querySelector('[name="address"]');
      const locationInput = appointmentForm.querySelector('[name="location"]');
      if (selectedPlace && addressInput) {
        addressInput.value = selectedPlace.address || "";
        if (locationInput && !locationInput.value.trim()) locationInput.value = selectedPlace.name || "";
      }
    });

    appointmentForm.onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.compromissos.push({
        id: uid("c"),
        title: f.get("title"),
        date: f.get("date"),
        time: f.get("time"),
        location: f.get("location"),
        address: f.get("address") || ""
      });

      saveState();
      closeModal();
      render();

      toast(
        "Compromisso adicionado."
      );
    };

    return;
  }

  /* ---------------- TAREFAS ---------------- */

  if (key === "tarefas") {

    openModal(
      "Nova tarefa",

      field(
        "Tarefa",
        "title",
        "text",
        "",
        "required"
      ) +

      selectField(
        "Prioridade",
        "priority",
        [
          "Baixa",
          "Normal",
          "Média",
          "Alta"
        ],
        "Normal"
      ) +

      field(
        "Data",
        "date",
        "date"
      ) +

      field(
        "Horário",
        "time",
        "time"
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.tarefas.push({
        id: uid("t"),
        title: f.get("title"),
        priority:
          f.get("priority") ||
          "Normal",
        date: f.get("date"),
        time: f.get("time"),
        done: false
      });

      saveState();
      closeModal();
      render();

      toast(
        "Tarefa adicionada."
      );
    };

    return;
  }

  /* ---------------- COMPRAS ---------------- */

  if (key === "compras") {

    openModal(
      "Nova lista de compras",

      field(
        "Nome da lista",
        "name",
        "text",
        "",
        "required"
      ),

      {
        submit: "Criar lista"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      if (!state.data.compras) {
        state.data.compras = [];
      }

      const lista = {
        id: uid("lista"),
        name:
          String(
            f.get("name") || ""
          ).trim(),
        items: []
      };

      if (!lista.name) {
        toast(
          "Digite o nome da lista.",
          "error"
        );
        return;
      }

      state.data.compras.push(
        lista
      );

      saveState();

      closeModal();

      currentPage = "compras";
      currentShoppingList = null;

      render();

      toast(
        "Lista criada com sucesso."
      );
    };

    return;
  }

  /* ---------------- ESTUDOS ---------------- */

  if (key === "estudos") {

    openModal(
      "Novo estudo",

      field(
        "Matéria",
        "subject",
        "text",
        "",
        "required"
      ) +

      field(
        "Assunto",
        "topic"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO(),
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time"
      ) +

      field(
        "Tempo planejado (min)",
        "duration",
        "number",
        "",
        "min=\"0\""
      ) +

      field(
        "Tempo realizado (min)",
        "effectiveDuration",
        "number",
        "",
        "min=\"0\""
      ) +

      textareaField(
        "Bloco de anotações",
        "notes",
        "",
        'class="notes-box" placeholder="Anote de onde parou e informações importantes sobre o assunto."'
      ) +

      field(
        "Link da bibliografia",
        "link",
        "url",
        "",
        'placeholder="https://..."'
      ),

      {
        submit: "Registrar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.estudos.push({
        id: uid("e"),
        subject:
          f.get("subject"),
        topic:
          f.get("topic"),
        date:
          f.get("date") || todayISO(),
        time:
          f.get("time") || "",
        duration:
          f.get("duration"),
        effectiveDuration:
          f.get("effectiveDuration") || "",
        notes:
          f.get("notes"),
        link:
          f.get("link"),
        done: false
      });

      const createdStudy = state.data.estudos[state.data.estudos.length - 1];
      syncManualStudyHistory(createdStudy.id, createdStudy.effectiveDuration, createdStudy.date);
      saveState();
      closeModal();
      render();

      toast(
        "Estudo registrado."
      );
    };

    return;
  }

  /* ---------------- TREINOS ---------------- */

  if (key === "treinos") {

    openModal(
      "Novo treino",

      field(
        "Nome",
        "name",
        "text",
        "",
        "required"
      ) +

      field("Tipo", "type", "text", "", 'placeholder="Toque para escolher um tipo" readonly') +
      `<div class="workout-type-suggestions is-hidden"><small>Sugestões de tipo</small><div>${["Força","Cardio","Flexibilidade","Mobilidade","Resistência muscular","HIIT","Funcional","Equilíbrio","Recuperação ativa","Esporte","Misto","Digitar"].map(v=>`<button type="button" class="workout-type-chip" data-action="workout-type-pick" data-type="${v}">${v}</button>`).join("")}</div></div>` +
      field("Data planejada", "date", "date", workoutPrefillDate || todayISO(), "required") +
      field("Horário do treino", "time", "time", "") +

      field(
        "Duração (min)",
        "duration",
        "number",
        "",
        "min=\"0\""
      ) +

      field(
        "Distância (km)",
        "distance",
        "number",
        "",
        'step="0.01" min="0"'
      ) +

      field(
        "Pace",
        "pace",
        "text",
        "",
        'placeholder="Ex.: 6:30 min/km"'
      ) +

      textareaField(
        "Observações",
        "observations"
      ),

      {
        submit: "Criar treino"
      }
    );

    const workoutForm = modal.querySelector("#lidire-form");
    const typeInput = workoutForm.querySelector('[name="type"]');
    const typeSuggestions = modal.querySelector(".workout-type-suggestions");
    if (typeInput) typeInput.addEventListener("click", () => typeSuggestions?.classList.toggle("is-hidden"));
    const durationInput = workoutForm.querySelector('[name="duration"]');
    const distanceInput = workoutForm.querySelector('[name="distance"]');
    const paceInput = workoutForm.querySelector('[name="pace"]');
    const updatePace = () => { const mins=Number(durationInput?.value), km=Number(distanceInput?.value); if(mins>0&&km>0&&Number.isFinite(mins/km)){const total=Math.round(mins*60/km);paceInput.value=`${Math.floor(total/60)}:${String(total%60).padStart(2,"0")} min/km`;} else if(paceInput) paceInput.value=""; };
    durationInput?.addEventListener("input",updatePace); distanceInput?.addEventListener("input",updatePace);
    workoutForm.onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.treinos.push({
        id: uid("tr"),
        name: f.get("name"),
        type: f.get("type"),
        duration:
          f.get("duration"),
        distance:
          f.get("distance"),
        pace:
          f.get("pace"),
        observations: f.get("observations"),
        date: f.get("date") || todayISO(),
        time: f.get("time") || "",
        completed: false,
        completedAt: "",
        exercises: []
      });

      saveState();
      closeModal();
      render();

      toast(
        "Treino criado."
      );
    };

    return;
  }

  /* ---------------- HIDRATAÇÃO ---------------- */

  if (key === "hidratacao") {

    openModal(
      "Registrar água",

      field(
        "Quantidade (ml)",
        "amount",
        "number",
        "300",
        "required min=\"1\""
      ),

      {
        submit: "Registrar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.hidratacao.push({
        id: uid("h"),
        amount:
          Number(f.get("amount")),
        date:
          todayISO(),
        createdAt:
          new Date().toISOString()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Hidratação registrada."
      );
    };

    return;
  }

  /* ---------------- ALIMENTAÇÃO ---------------- */

  if (key === "alimentacao") {
    addMealForm();
    return;
  }

  /* ---------------- FINANÇAS ---------------- */

  if (key === "financas") {

    openModal(
      "Novo lançamento",

      selectField(
        "Tipo",
        "type",
        [
          { value: "expense", label: "Despesa" },
          { value: "income", label: "Receita" }
        ],
        "expense"
      ) +

      field(
        "Descrição",
        "title",
        "text",
        "",
        "required"
      ) +

      field(
        "Valor",
        "value",
        "number",
        "",
        'step="0.01" min="0" required'
      ) +

      field(
        "Categoria",
        "category"
      ) +

      selectField(
        "Moeda",
        "currency",
        [
          { value: "BRL", label: "Real brasileiro (R$)" },
          { value: "USD", label: "Dólar americano (US$)" }
        ],
        "BRL"
      ) +

      field(
        "Data",
        "date",
        "date",
        todayISO()
      ),

      {
        submit: "Salvar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      state.data.financas.push({
        id: uid("f"),
        type: f.get("type"),
        title: f.get("title"),
        value:
          Number(f.get("value")),
        category:
          f.get("category") ||
          "Geral",
        currency:
          f.get("currency") || "BRL",
        date:
          f.get("date"),
        createdAt: new Date().toISOString()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Lançamento salvo."
      );
    };

    return;
  }

  /* ---------------- OBJETIVOS ---------------- */

  if (key === "objetivos") {

    openGoalForm();
    return;
  }

  /* ---------------- FAMÍLIA ---------------- */

  if (key === "familia") {

    openModal(
      "Adicionar pessoa",

      field(
        "Nome",
        "name",
        "text",
        "",
        "required"
      ) +

      field(
        "Relação",
        "relation"
      ) +

      field(
        "E-mail",
        "email",
        "email",
        "",
        "required"
      ),

      {
        submit: "Adicionar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);
      const familyName = String(f.get("name") || "").trim();
      const familyEmail = String(f.get("email") || "").trim();
      if (!familyName) { toast("Informe o nome.", "error"); return; }
      if (!familyEmail) { toast("Informe o e-mail.", "error"); return; }

      state.data.familia.push({
        id: uid("m"),
        name:
          String(f.get("name") || "").trim(),
        relation:
          f.get("relation"),
        email:
          String(f.get("email") || "").trim()
      });

      saveState();
      closeModal();
      render();

      toast(
        "Pessoa adicionada."
      );
    };
  }
}

/* =========================================================
   REFEIÇÃO
   ========================================================= */

function openFoodCatalog() {
  const foods = state.data.alimentos || [];
  openModal("Cadastro de alimentos", `
    <p class="muted">Cadastre e gerencie seus alimentos. A unidade de medida fica vinculada ao cadastro.</p>
    <div class="content-card">
      <div class="item-list">
        ${foods.length ? foods.map(f => `
          <div class="list-item">
            <div class="item-main">
              <strong>${esc(f.name)}</strong>
              <span>${Number(f.calories || 0)} kcal · ${esc(f.unit || "g")}</span>
            </div>
            <div class="item-actions">
              <button type="button" data-food-edit="${f.id}" title="Editar alimento">${icon("edit")}</button>
              <button type="button" data-food-delete="${f.id}" title="Excluir alimento">${icon("trash")}</button>
            </div>
          </div>
        `).join("") : `<p class="muted">Nenhum alimento cadastrado.</p>`}
      </div>
    </div>
    <div class="form-field"><span>Novo alimento</span><input name="foodName" placeholder="Nome do alimento"></div>
    <label class="form-field"><span>Unidade de medida</span><select name="foodUnit"><option>g</option><option>kg</option><option>ml</option><option>L</option><option>unidade</option><option>porção</option></select></label>
    <label class="form-field"><span>Calorias</span><input name="foodCalories" type="number" min="0" step="1" placeholder="kcal por 100 g/ml ou por unidade"></label>
  `,{submit:"Cadastrar alimento"});

  modal.querySelectorAll("[data-food-delete]").forEach(btn => btn.onclick = () => {
    state.data.alimentos = state.data.alimentos.filter(x => x.id !== btn.dataset.foodDelete);
    saveState(); openFoodCatalog(); toast("Alimento excluído.");
  });

  modal.querySelectorAll("[data-food-edit]").forEach(btn => btn.onclick = () => {
    const food = state.data.alimentos.find(x => x.id === btn.dataset.foodEdit);
    if (!food) return;
    openModal("Editar alimento",
      field("Nome do alimento", "name", "text", food.name || "", "required") +
      selectField("Unidade de medida", "unit", ["g","kg","ml","L","unidade","porção"], food.unit || "g") +
      field("Calorias", "calories", "number", food.calories || 0, 'min="0" step="1" required'),
      { submit: "Salvar alterações" }
    );
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      food.name = String(f.get("name") || "").trim();
      food.unit = f.get("unit") || "g";
      food.calories = Number(f.get("calories") || 0);
      if (!food.name) { toast("Informe o nome do alimento.", "error"); return; }
      saveState(); openFoodCatalog(); toast("Alimento atualizado.");
    };
  });

  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get("foodName") || "").trim();
    if (!name) { toast("Digite o nome do alimento.", "error"); return; }
    state.data.alimentos.push({ id: uid("food"), name, unit: f.get("foodUnit") || "g", calories: Number(f.get("foodCalories") || 0) });
    saveState(); openFoodCatalog(); toast("Alimento cadastrado.");
  };
}

function addMealForm(existing = null) {

  let foods =
    existing?.foods
      ? clone(existing.foods)
      : [];

  function renderFoodFields() {

    const container =
      modal.querySelector(
        "#food-fields"
      );

    if (!container) return;

    container.innerHTML =
      foods.map((food, index) => `

        <div class="diet-food-row">

          <input
            name="food-name-${index}"
            placeholder="Alimento"
            value="${esc(food.name || "")}"
          >

          <input name="food-qty-${index}" type="number" min="0" step="0.01" placeholder="Quantidade" value="${esc(food.quantity||"")}">
          <select name="food-unit-${index}"><option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option><option value="porção">porção</option></select>
          <input name="food-cal-${index}" type="number" min="0" placeholder="kcal" value="${Number(food.calories||0)}">
          <select name="food-cal-mode-${index}"><option value="auto">Calcular automaticamente</option><option value="manual" ${food.calorieMode==="manual"?"selected":""}>Inserir manualmente</option></select>
          <button type="button" class="danger-button diet-remove-button" data-remove-food="${index}">Excluir</button>

        </div>

      `).join("");

    container
      .querySelectorAll(
        "[data-remove-food]"
      )
      .forEach(button => {

        button.onclick = () => {

          foods.splice(
            Number(
              button.dataset.removeFood
            ),
            1
          );

          renderFoodFields();
        };
      });
  }

  openModal(
    existing
      ? "Editar refeição"
      : "Nova refeição",

    field(
      "Nome da refeição",
      "name",
      "text",
      existing?.name || "",
      "required"
    ) +

    field(
      "Horário",
      "time",
      "time",
      existing?.time ||
      nowTime(),
      "required"
    ) +

    `
      <div class="form-field">

        <span>
          Alimentos e calorias
        </span>

        <div id="food-fields"></div>

        <button
          type="button"
          class="ghost-button"
          id="add-food-button"
        >
          + Adicionar alimento
        </button>

      </div>
    `,

    {
      submit:
        existing
          ? "Salvar"
          : "Adicionar"
    }
  );

  renderFoodFields();

  modal.querySelector(
    "#add-food-button"
  ).onclick = () => {

    foods.push({ name: "", quantity: "", unit: "g", calories: 0, calorieMode: "manual" });

    renderFoodFields();
  };

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    foods =
      foods.map((food, index) => ({
        name: f.get(`food-name-${index}`) || "",
        quantity: f.get(`food-qty-${index}`) || "",
        unit: f.get(`food-unit-${index}`) || "g",
        calorieMode: f.get(`food-cal-mode-${index}`) || "manual",
        calories: Number(f.get(`food-cal-${index}`) || 0)
      }))
      .filter(
        food => food.name.trim()
      );

    if (!foods.length) {
      toast(
        "Adicione pelo menos um alimento.",
        "error"
      );
      return;
    }

    const meal = {
      id:
        existing?.id ||
        uid("meal"),
      name:
        f.get("name"),
      time:
        f.get("time"),
      date:
        existing?.date ||
        todayISO(),
      foods
    };

    if (existing) {

      const index =
        state.data.alimentacao
          .findIndex(
            x => x.id === existing.id
          );

      if (index >= 0) {
        state.data.alimentacao[index] =
          meal;
      }

    } else {
      state.data.alimentacao.push(
        meal
      );
    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Refeição atualizada."
        : "Refeição adicionada."
    );
  };
}

/* =========================================================
   DIETA
   ========================================================= */

function dietLibrary(){
  const diets=state.data.dietas||[];
  return appShell(`${pageHeader("ALIMENTAÇÃO","Biblioteca de dietas","Salve diferentes planos alimentares e reutilize quando precisar.", `<button class="primary-button compact" data-action="add-dieta">${icon("plus")} Nova dieta</button>`)}<div class="content-card">${diets.length?`<div class="item-list">${diets.map(d=>`<div class="list-item"><div class="module-icon small">🥗</div><div class="item-main"><strong>${esc(d.name||"Dieta")}</strong><span>${d.foods?.length||0} alimentos · salva em ${dateBR((d.createdAt||todayISO()).slice(0,10))}</span></div><div class="item-actions"><button data-action="use-diet" data-id="${d.id}" title="Usar">▶</button><button data-action="edit-diet" data-id="${d.id}">${icon("edit")}</button><button data-action="delete-diet" data-id="${d.id}">${icon("trash")}</button></div></div>`).join("")}</div>`:`<div class="empty-state"><div class="empty-orb">🥗</div><h3>Nenhuma dieta salva</h3><p>Crie sua primeira dieta para começar sua biblioteca.</p></div>`}</div>`);
}
function saveDietToLibrary(diet){if(!diet?.name)return; if(!Array.isArray(state.data.dietas))state.data.dietas=[]; const copy=clone(diet); copy.id=uid("diet");copy.createdAt=new Date().toISOString();state.data.dietas.unshift(copy);}
function editDiet(id){const d=state.data.dietas.find(x=>x.id===id);if(d){state.settings.diet=clone(d);addDietForm(d);}}
function addDietForm(existingDiet = null) {
  const current = existingDiet || state.settings.diet || { name: "", foods: [] };
  let foods = clone(current.foods || []);

  function estimateCalories(name, quantity, unit) {
    const key = String(name || "").trim().toLowerCase();
    const catalog = (state.data.alimentos || []).find(f => String(f.name||"").trim().toLowerCase() === key);
    if (catalog && Number(catalog.calories) > 0) {
      const q = Number(String(quantity||"").replace(",", "."));
      if (!q) return Number(catalog.calories);
      const base = String(catalog.unit || unit || "g").toLowerCase();
      const u = String(unit || base).toLowerCase();
      if (base === u) {
        if (["g","ml"].includes(u)) return Math.round(Number(catalog.calories) * q / 100);
        return Math.round(Number(catalog.calories) * q);
      }
    }
    const common = {
      "arroz": 130, "arroz cozido": 130, "feijão": 76, "feijao": 76,
      "frango": 165, "peito de frango": 165, "ovo": 155, "banana": 89,
      "maçã": 52, "maca": 52, "batata": 87, "aveia": 389,
      "leite": 61, "pão": 265, "pao": 265
    };
    const kcal100 = common[key];
    const q = Number(String(quantity||"").replace(",", "."));
    if (!kcal100 || !q) return 0;
    return Math.round(kcal100 * q / 100);
  }

  function renderFoods() {
    const container = modal.querySelector("#diet-foods");
    if (!container) return;
    container.innerHTML = foods.map((food,index)=>`
      <div class="diet-food-row diet-food-row-complete">
        <label class="inline-field"><span>Alimento</span><input name="diet-food-${index}" placeholder="Ex.: arroz" value="${esc(food.name||"")}"></label>
        <label class="inline-field"><span>Quantidade</span><input name="diet-qty-${index}" type="number" min="0" step="0.01" placeholder="Qtd." value="${esc(food.quantity||"")}"></label>
        <label class="inline-field"><span>Unidade de medida</span><select name="diet-unit-${index}">${["g","kg","ml","L","unidade","porção"].map(u=>`<option value="${u}" ${String(food.unit||"g")===u?"selected":""}>${u}</option>`).join("")}</select></label>
        <label class="inline-field"><span>Parte/refeição</span><input name="diet-meal-${index}" placeholder="Ex.: Almoço" value="${esc(food.meal||"")}"></label>
        <label class="inline-field"><span>Calorias</span><input name="diet-cal-${index}" type="number" min="0" step="1" placeholder="kcal" value="${Number(food.calories||0)}"></label>
        <label class="inline-field"><span>Cálculo</span><select name="diet-cal-mode-${index}"><option value="auto" ${food.calorieMode!=="manual"?"selected":""}>Calcular automaticamente</option><option value="manual" ${food.calorieMode==="manual"?"selected":""}>Inserir manualmente</option></select></label>
        <button type="button" class="danger-button diet-remove-button" data-remove-diet="${index}">Excluir</button>
      </div>
    `).join("");
    container.querySelectorAll("[data-remove-diet]").forEach(btn=>btn.onclick=()=>{ foods.splice(Number(btn.dataset.removeDiet),1); renderFoods(); });
    const refreshAutoCalories = (idx) => {
      const mode = container.querySelector(`[name="diet-cal-mode-${idx}"]`);
      if (!mode || mode.value !== "auto") return;
      const q = container.querySelector(`[name="diet-qty-${idx}"]`).value;
      const u = container.querySelector(`[name="diet-unit-${idx}"]`).value;
      const n = container.querySelector(`[name="diet-food-${idx}"]`).value;
      const cal = container.querySelector(`[name="diet-cal-${idx}"]`);
      if (cal) cal.value = estimateCalories(n,q,u);
    };
    container.querySelectorAll('select[name^="diet-cal-mode-"]').forEach(sel=>sel.addEventListener("change",()=>refreshAutoCalories(Number(sel.name.split("-").pop()))));
    container.querySelectorAll('input[name^="diet-food-"],input[name^="diet-qty-"] ,select[name^="diet-unit-"]').forEach(input=>{
      const idx = Number(input.name.split("-").pop());
      input.addEventListener("input",()=>refreshAutoCalories(idx));
      input.addEventListener("change",()=>refreshAutoCalories(idx));
    });
    foods.forEach((_,idx)=>refreshAutoCalories(idx));
  }

  openModal("Inserir dieta", field("Nome da dieta","dietName","text",current.name||"")+`<div class="form-field"><span>Alimentos da dieta</span><small class="muted">Você pode adicionar vários alimentos sem apagar os anteriores.</small><div id="diet-foods"></div><button type="button" class="ghost-button" id="add-diet-food">+ Adicionar outro alimento</button></div>`,{submit:"Salvar dieta"});
  renderFoods();
  modal.querySelector("#add-diet-food").onclick=()=>{
    const form = modal.querySelector("#lidire-form");
    if (form) {
      const f = new FormData(form);
      const savedDraft = [];
      foods.forEach((food,index)=>{
        const name = f.get(`diet-food-${index}`) || "";
        const quantity = f.get(`diet-qty-${index}`) || "";
        const unit = f.get(`diet-unit-${index}`) || "g";
        const meal = f.get(`diet-meal-${index}`) || "";
        const mode = f.get(`diet-cal-mode-${index}`) || "auto";
        let calories = Number(f.get(`diet-cal-${index}`) || 0);
        if (mode === "auto") calories = estimateCalories(name, quantity, unit);
        savedDraft.push({name, quantity, unit, meal, calories, calorieMode: mode});
      });
      foods = savedDraft;
    }
    foods.push({name:"",quantity:"",unit:"g",meal:"",calories:0,calorieMode:"auto"});
    renderFoods();
  };
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);foods=foods.map((food,index)=>{const mode=f.get(`diet-cal-mode-${index}`)||"auto";let cal=Number(f.get(`diet-cal-${index}`)||0);if(mode==="auto")cal=estimateCalories(f.get(`diet-food-${index}`),f.get(`diet-qty-${index}`),f.get(`diet-unit-${index}`));return {name:f.get(`diet-food-${index}`)||"",quantity:f.get(`diet-qty-${index}`)||"",unit:f.get(`diet-unit-${index}`)||"g",meal:f.get(`diet-meal-${index}`)||"",calories:cal,calorieMode:mode};}).filter(food=>food.name.trim());const diet={id:current.id||uid("diet"),name:f.get("dietName")||"",foods,createdAt:current.createdAt||new Date().toISOString()};
    state.settings.diet=diet;
    if(!Array.isArray(state.data.dietas)) state.data.dietas=[];
    const idx=state.data.dietas.findIndex(x=>x.id===diet.id);
    if(idx>=0) state.data.dietas[idx]=diet; else state.data.dietas.unshift(diet);
    saveState();closeModal();render();toast("Dieta salva.");};
}

/* =========================================================
   DIETA → LISTA DE COMPRAS
   ========================================================= */

function createShoppingListFromDiet() {

  const diet =
    state.settings.diet;

  if (
    !diet ||
    !diet.foods ||
    !diet.foods.length
  ) {
    toast(
      "Cadastre os alimentos da dieta primeiro.",
      "error"
    );
    return;
  }

  const list = {
    id: uid("lista"),
    name:
      diet.name
        ? `Compras - ${diet.name}`
        : "Compras da dieta",
    items:
      diet.foods.map(food => ({
        id: uid("item"),
        name: food.name,
        quantity:
          food.quantity || "",
        category: "Dieta",
        done: false
      }))
  };

  state.data.compras.push(
    list
  );

  saveState();

  currentPage = "compras";
  currentShoppingList = list.id;

  render();

  toast(
    "Lista criada a partir da dieta."
  );
}

/* =========================================================
   TREINO → EXERCÍCIO
   ========================================================= */

function copyWorkoutForm(workoutId) {
  const source = (state.data.treinos || []).find(t => String(t.id) === String(workoutId));
  if (!source) return;
  const suggested = new Date(`${source.date || todayISO()}T12:00:00`); suggested.setDate(suggested.getDate()+1);
  const suggestedDate = workoutISODate(suggested);
  openModal("Copiar treino para outro dia", `<p class="muted">Será criada uma cópia de “${esc(source.name || "Treino")}”, incluindo os exercícios. O treino original não será alterado.</p>${field("Nome do novo treino", "copyName", "text", source.name || "", "required")}${field("Dia de destino", "copyDate", "date", suggestedDate, "required")}${field("Horário (opcional)", "copyTime", "time", source.time || "")}`, {submit:"Criar cópia"});
  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target); const date = String(f.get("copyDate") || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Escolha uma data válida.", "error"); return; }
    const copy = clone(source); copy.id = uid("treino"); copy.name = String(f.get("copyName") || source.name || "Treino").trim(); copy.date = date; copy.time = String(f.get("copyTime") || ""); copy.completed = false; copy.completedAt = ""; copy.exercises = (source.exercises || []).map(ex => ({...clone(ex), id: uid("exercicio")}));
    state.data.treinos.push(copy); saveState(); closeModal(); workoutWeekOffset = Math.floor((new Date(`${date}T12:00:00`) - workoutWeekStart(0)) / (7*24*60*60*1000));
    render(); toast("Treino copiado para o dia escolhido.");
  };
}

function editWorkoutForm(t){openModal("Editar treino",field("Nome","name","text",t.name||"","required")+field("Tipo","type","text",t.type||"")+field("Data planejada","date","date",t.date||todayISO(),"required")+field("Horário do treino","time","time",t.time||"")+field("Duração (min)","duration","number",t.duration||"","min=\"0\"")+field("Distância (km)","distance","number",t.distance||"",'step="0.01" min="0"')+field("Pace","pace","text",t.pace||"")+textareaField("Observações","observations",t.observations||""),{submit:"Salvar"});modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);Object.assign(t,{name:f.get("name"),type:f.get("type"),date:f.get("date")||todayISO(),time:f.get("time")||"",duration:f.get("duration"),distance:f.get("distance"),pace:f.get("pace"),observations:f.get("observations")});saveState();closeModal();render();toast("Treino atualizado.");};}
function addExerciseForm(treinoId, existing = null) {

  openModal(
    existing
      ? "Editar exercício"
      : "Adicionar exercício",

    field(
      "Exercício",
      "name",
      "text",
      existing?.name || "",
      "required"
    ) +

    field(
      "Carga meta",
      "loadGoal",
      "text",
      existing?.loadGoal || "",
      'placeholder="Ex.: 20 kg"'
    ) +

    field(
      "Carga efetivada",
      "loadDone",
      "text",
      existing?.loadDone || "",
      'placeholder="Ex.: 18 kg"'
    ) +

    field(
      "Repetições meta",
      "repsGoal",
      "number",
      existing?.repsGoal || "",
      "min=\"0\""
    ) +

    field(
      "Repetições efetivadas",
      "repsDone",
      "number",
      existing?.repsDone || "",
      "min=\"0\""
    ) +
    field("Número de séries", "sets", "number", existing?.sets || "", 'min="1" step="1"') +
    field("Tempo de descanso (segundos)", "restSeconds", "number", existing?.restSeconds || "", 'min="0" step="5"'),

    {
      submit:
        existing
          ? "Salvar"
          : "Adicionar"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const treino =
      state.data.treinos.find(
        x => x.id === treinoId
      );

    if (!treino) return;

    if (!treino.exercises) {
      treino.exercises = [];
    }

    const exercise = {
      id:
        existing?.id ||
        uid("exercise"),
      name:
        f.get("name"),
      loadGoal:
        f.get("loadGoal"),
      loadDone:
        f.get("loadDone"),
      repsGoal:
        f.get("repsGoal"),
      repsDone:
        f.get("repsDone"),
      sets: f.get("sets"),
      restSeconds: f.get("restSeconds"),
      completed: existing?.completed || false
    };

    if (existing) {

      const index =
        treino.exercises.findIndex(
          x => x.id === existing.id
        );

      if (index >= 0) {
        treino.exercises[index] =
          exercise;
      }

    } else {

      treino.exercises.push(
        exercise
      );

    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Exercício atualizado."
        : "Exercício adicionado."
    );
  };
}

/* =========================================================
   ANIMAÇÃO DE EXERCÍCIO
   ========================================================= */

function exerciseVisual(name){const n=String(name||"").toLowerCase();if(/corrida|correr|run|esteira/.test(n))return "🏃‍♀️";if(/remada|row/.test(n))return "🚣";if(/puxada|pulldown|barra/.test(n))return "💪";if(/agachamento|squat/.test(n))return "🧎";if(/supino|bench|peito/.test(n))return "🏋️";if(/bicicleta|bike|ciclismo/.test(n))return "🚴";if(/abdominal|crunch|abd/.test(n))return "🤸";if(/alongamento|stretch/.test(n))return "🧘";return "🏋️";}
function animateExercise(id){const all=state.data.treinos.flatMap(t=>t.exercises||[]);const ex=all.find(x=>x.id===id);if(!ex)return;openModal(ex.name,`<div class="exercise-animation exercise-specific">${exerciseVisual(ex.name)}</div><p style="text-align:center"><strong>${esc(ex.name)}</strong><br><span class="muted">Demonstração visual específica para este exercício. Quando houver uma mídia cadastrada, ela será exibida aqui.</span></p>`,{submit:"Fechar"});}

/* =========================================================
   CONFIGURAÇÃO DE HIDRATAÇÃO
   ========================================================= */

function configHidratacao() {

  const goal =
    Number(state.settings.hydrationGoal) || 2000;

  const start =
    state.settings.hydrationStart || "08:00";

  const end =
    state.settings.hydrationEnd || "21:00";

  const intervalMinutes =
    Number(state.settings.hydrationIntervalMinutes) ||
    (Number(state.settings.hydrationInterval) || 2) * 60;

  openModal(
    "Meta de hidratação",

    field(
      "Meta diária (ml)",
      "goal",
      "number",
      goal,
      "min=\"1\" required"
    ) +

    field(
      "Início do período",
      "start",
      "time",
      start,
      "required"
    ) +

    field(
      "Fim do período",
      "end",
      "time",
      end,
      "required"
    ) +

    `<label class="form-field">
      <span>Intervalo de consumo</span>
      <select name="intervalMinutes" required>
        ${Array.from({ length: 24 }, (_, i) => {
          const minutes = (i + 1) * 30;
          const selected = minutes === intervalMinutes ? "selected" : "";
          return `<option value="${minutes}" ${selected}>${formatHydrationInterval(minutes)}</option>`;
        }).join("")}
      </select>
    </label>` +

    `<div class="hydration-profile-fields"><h4>Personalização da meta</h4>
      ${field("Sexo", "profileSex", "text", state.settings.hydrationProfile?.sex || state.user.sex || "")}
      ${field("Idade", "profileAge", "number", state.settings.hydrationProfile?.age || state.user.age || "", 'min="14" max="120"')}
      ${field("Peso (kg)", "profileWeight", "number", state.settings.hydrationProfile?.weight || state.user.weight || "", 'min="30" max="300" step="0.1"')}
      ${selectField("Atividade", "profileActivity", [{value:"moderate",label:"Moderada"},{value:"active",label:"Ativa"},{value:"very-active",label:"Muito ativa"},{value:"hot",label:"Ambiente quente"}], state.settings.hydrationProfile?.activity || "moderate")}
      ${selectField("Objetivo", "profileGoal", [{value:"health",label:"Saúde geral"},{value:"performance",label:"Performance"},{value:"weight-loss",label:"Controle de peso"}], state.settings.hydrationProfile?.goal || "health")}
    </div>` +

    `<div class="form-help hydration-calculation" id="hydration-calculation">
      A quantidade por intervalo será calculada automaticamente.
    </div>`,

    {
      submit: "Salvar meta"
    }
  );

  const form = modal.querySelector("#lidire-form");
  const calculation = modal.querySelector("#hydration-calculation");

  function updateHydrationCalculation() {
    const formData = new FormData(form);
    const currentGoal = Number(formData.get("goal")) || 0;
    const currentStart = formData.get("start") || "08:00";
    const currentEnd = formData.get("end") || "21:00";
    const currentIntervalMinutes = Number(formData.get("intervalMinutes")) || 30;

    const [sh, sm] = currentStart.split(":").map(Number);
    const [eh, em] = currentEnd.split(":").map(Number);

    let minutes =
      (eh * 60 + em) -
      (sh * 60 + sm);

    if (minutes <= 0) minutes += 24 * 60;

    const count = Math.max(1, Math.ceil(minutes / currentIntervalMinutes));
    const amount = currentGoal > 0 ? Math.round(currentGoal / count) : 0;

    calculation.innerHTML = `
      <strong>${amount.toLocaleString("pt-BR")} ml por consumo</strong>
      <span>(${count} consumos previstos entre ${esc(currentStart)} e ${esc(currentEnd)})</span>
    `;
  }

  form.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("input", updateHydrationCalculation);
    input.addEventListener("change", updateHydrationCalculation);
  });

  updateHydrationCalculation();

  form.onsubmit = e => {
    e.preventDefault();

    const f = new FormData(e.target);

    state.settings.hydrationGoal = Number(f.get("goal"));
    state.settings.hydrationProfile = {
      sex: String(f.get("profileSex") || ""),
      age: Number(f.get("profileAge") || 0),
      weight: Number(f.get("profileWeight") || 0),
      activity: String(f.get("profileActivity") || "moderate"),
      goal: String(f.get("profileGoal") || "health")
    };
    state.user.age = state.settings.hydrationProfile.age || state.user.age;
    state.user.weight = state.settings.hydrationProfile.weight || state.user.weight;
    state.user.sex = state.settings.hydrationProfile.sex || state.user.sex;
    state.settings.hydrationGoal = calculateHydrationRecommendation().ml;
    state.settings.hydrationStart = f.get("start");
    state.settings.hydrationEnd = f.get("end");
    state.settings.hydrationIntervalMinutes = Number(f.get("intervalMinutes"));
    delete state.settings.hydrationInterval;

    saveState();
    closeModal();
    render();

    toast("Meta de hidratação atualizada.");
  };
}

/* =========================================================
   META DE CALORIAS
   ========================================================= */

function configCalorias() {

  openModal(
    "Meta diária de calorias",

    field(
      "Calorias por dia",
      "goal",
      "number",
      state.settings.calorieGoal,
      "min=\"1\" required"
    ),

    {
      submit: "Salvar meta"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    state.settings.calorieGoal =
      Number(f.get("goal"));

    saveState();
    closeModal();
    render();

    toast(
      "Meta de calorias atualizada."
    );
  };
}

/* =========================================================
   TETOS DE FINANÇAS
   ========================================================= */

function openFinanceEditModal(item){
  openModal("Editar lançamento",selectField("Tipo","type",[{value:"expense",label:"Despesa"},{value:"income",label:"Receita"}],item.type||"expense")+field("Descrição","title","text",item.title||"","required")+field("Valor","value","number",item.value||"",'step="0.01" min="0" required')+field("Categoria","category","text",item.category||"Geral")+selectField("Moeda","currency",[{value:"BRL",label:"Real brasileiro (R$)"},{value:"USD",label:"Dólar americano (US$)"}],item.currency||"BRL")+field("Data","date","date",item.date||todayISO()),{submit:"Salvar alterações"});
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);Object.assign(item,{type:f.get("type"),title:f.get("title"),value:Number(f.get("value")),category:f.get("category")||"Geral",currency:f.get("currency")||"BRL",date:f.get("date")||todayISO()});saveState();closeModal();render();toast("Lançamento atualizado.");};
}
function financeMonthlyReport(){
  const month=todayISO().slice(0,7);openModal("Relatório mensal",field("Mês","month","month",month,"required")+'<div id="finance-monthly-preview" class="content-card" style="margin-top:12px"></div>',{submit:"Fechar"});
  const update=()=>{const selected=modal.querySelector('[name="month"]').value||month;const rows=state.data.financas.filter(x=>String(x.date||"").startsWith(selected));const sum=(type,cur)=>rows.filter(x=>x.type===type&&(x.currency||"BRL")===cur).reduce((s,x)=>s+Number(x.value||0),0);const cats={};rows.filter(x=>x.type==="expense").forEach(x=>{const k=`${x.currency||"BRL"}::${x.category||"Geral"}`;cats[k]=(cats[k]||0)+Number(x.value||0);});modal.querySelector("#finance-monthly-preview").innerHTML=`<strong>Receitas</strong><p>${money(sum("income","BRL"),"BRL")} · ${money(sum("income","USD"),"USD")}</p><strong>Despesas</strong><p>${money(sum("expense","BRL"),"BRL")} · ${money(sum("expense","USD"),"USD")}</p><strong>Saldo</strong><p>${money(sum("income","BRL")-sum("expense","BRL"),"BRL")} · ${money(sum("income","USD")-sum("expense","USD"),"USD")}</p><strong>Despesas por categoria</strong>${Object.keys(cats).length?`<ul>${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{const [cur,cat]=k.split("::");return `<li>${esc(cat)}: ${money(v,cur)}</li>`}).join("")}</ul>`:`<p class="muted">Nenhuma despesa no mês.</p>`}`;};modal.querySelector('[name="month"]').addEventListener("change",update);update();modal.querySelector(".modal-footer .primary-button").onclick=e=>{e.preventDefault();closeModal();};
}
function financeHistory(){
  openModal("Histórico financeiro",field("Data inicial","from","date",todayISO(),"required")+field("Data final","to","date",todayISO(),"required")+'<div id="finance-history-preview" class="content-card" style="margin-top:12px"></div>',{submit:"Fechar"});
  const update=()=>{const f=new FormData(modal.querySelector("#lidire-form"));const from=f.get("from"),to=f.get("to");const rows=state.data.financas.filter(x=>(!from||(x.date||"")>=from)&&(!to||(x.date||"")<=to));modal.querySelector("#finance-history-preview").innerHTML=rows.length?`<div class="item-list">${rows.map(x=>`<div class="list-item"><div class="item-main"><strong>${esc(x.title)}</strong><span>${dateBR(x.date)} · ${esc(x.category||"Geral")}</span></div><strong class="finance-value ${x.type}">${x.type==="income"?"+":"-"} ${money(x.value,x.currency||"BRL")}</strong></div>`).join("")}</div>`:`<p class="muted">Nenhum lançamento encontrado no período.</p>`;};modal.querySelectorAll('[name="from"],[name="to"]').forEach(x=>x.addEventListener("change",update));update();modal.querySelector(".modal-footer .primary-button").onclick=e=>{e.preventDefault();closeModal();};
}
const SHOPPING_UNITS=["KG","G","SACO","PCT","CX","L","ML","GARRAFA","UNI","DZ","PACOTE","LATA","DOSE","PORÇÃO"];
function normalizeShoppingUnit(unit){const u=String(unit||"").trim().toUpperCase();return u==="UNIDADE"||u==="UNIDADES"?"UNI":u;}
function parseQuantity(value,unit){
  const raw=String(value??"").trim().replace(",",".");
  const m=raw.match(/^(\d+(?:\.\d+)?)\s*([a-zA-ZÀ-ÿ]+)?$/);
  if(!m)return null;
  return {value:Number(m[1]),unit:normalizeShoppingUnit(unit||m[2]||"")};
}
function formatShoppingNumber(n){return Number.isInteger(n)?String(n):String(Number(n.toFixed(3))).replace(".",",");}
function formatShoppingQuantity(item){
  if(!item)return "";
  const q=item.quantityValue!==undefined&&item.quantityValue!==null&&item.quantityValue!==""?Number(String(item.quantityValue).replace(",",".")):null;
  const unit=normalizeShoppingUnit(item.unit);
  if(Number.isFinite(q)) return `${formatShoppingNumber(q)}${unit?" "+unit:""}`;
  return String(item.quantity||item.qty||"");
}
function combineShoppingQuantities(a,b){
  const x=parseQuantity(a?.quantity,a?.unit), y=parseQuantity(b?.quantity,b?.unit);
  if(!x||!y)return null;
  const conversions={KG:{G:0.001},G:{KG:1000},L:{ML:0.001},ML:{L:1000}};
  let total=null, unit=x.unit||y.unit;
  if(x.unit===y.unit){total=x.value+y.value;unit=x.unit;}
  else if(conversions[x.unit]?.[y.unit]!==undefined){total=x.value+y.value*conversions[x.unit][y.unit];unit=x.unit;}
  else if(conversions[y.unit]?.[x.unit]!==undefined){total=y.value+x.value*conversions[y.unit][x.unit];unit=y.unit;}
  if(total===null)return null;
  return {quantity:String(formatShoppingNumber(total)),quantityValue:total,unit};
}
function openMergeShoppingModal(lists){
  if(!Array.isArray(lists)||lists.length<2){toast("Selecione pelo menos duas listas.","error");return;}
  openModal(
    "Juntar listas de compras",
    field("Nome da nova lista","name","text","Lista de compras combinada","required")+
    `<label class="form-field"><span>Listas selecionadas</span><div class="muted">${lists.map(x=>`${esc(x.name)} (${(x.items||[]).length} ${(x.items||[]).length===1?"item":"itens"})`).join(" · ")}</div></label>`+
    `<label class="form-field"><span><input type="checkbox" name="sumDuplicates" checked> Somar quantidades de itens iguais quando as unidades forem compatíveis</span><small class="muted">Ex.: 1 KG + 1 KG = 2 KG · 1 KG + 500 G = 1,5 KG.</small></label>`+
    `<label class="form-field"><span><input type="checkbox" name="replaceOriginals" checked> Substituir as listas selecionadas pela nova lista</span></label>`,
    {submit:"Juntar listas"}
  );
  modal.querySelector("#lidire-form").onsubmit=e=>{
    e.preventDefault();
    const f=new FormData(e.target),name=String(f.get("name")||"").trim();
    if(!name){toast("Digite o nome da nova lista.","error");return;}
    const sumDup=f.get("sumDuplicates")==="on";
    const replaceOriginals=f.get("replaceOriginals")==="on";
    const selectedIds=new Set(lists.map(x=>x.id));
    const items=[];
    lists.flatMap(x=>x.items||[]).forEach(item=>{
      const itemName=String(item.name||item.title||"Item").trim();
      const existing=items.find(y=>y.name.toLowerCase()===itemName.toLowerCase());
      if(existing&&sumDup){
        const combined=combineShoppingQuantities(existing,item);
        if(combined){
          existing.quantity=combined.quantity;
          existing.quantityValue=combined.quantityValue;
          existing.unit=combined.unit;
        }else if(formatShoppingQuantity(item)&&formatShoppingQuantity(existing)!==formatShoppingQuantity(item)){
          existing.quantity=`${formatShoppingQuantity(existing)} + ${formatShoppingQuantity(item)}`;
          existing.quantityValue="";
          existing.unit="";
        }
        existing.done=existing.done && Boolean(item.done);
      }else if(!existing){
        const parsed=parseQuantity(item.quantity,item.unit);
        items.push({
          id:uid("item"),name:itemName,
          quantity:parsed?String(parsed.value):String(item.quantity||""),
          quantityValue:parsed?parsed.value:(item.quantityValue??""),
          unit:parsed?.unit||normalizeShoppingUnit(item.unit)||"",
          category:item.category||"",done:Boolean(item.done)
        });
      }
    });
    const list={id:uid("lista"),name,items};
    if(replaceOriginals) state.data.compras=state.data.compras.filter(x=>!selectedIds.has(x.id));
    state.data.compras.push(list);
    saveState();closeModal();currentPage="compras";currentShoppingList=list.id;render();
    toast(replaceOriginals?"Listas juntadas com sucesso.":"Nova lista criada a partir das listas selecionadas.");
  };
}

function configFinanceLimits() {

  const categories =
    new Set();

  state.data.financas.forEach(x => {
    if (x.category) {
      categories.add(
        x.category
      );
    }
  });

  Object.keys(
    state.settings.financeLimits || {}
  ).forEach(cat =>
    categories.add(cat)
  );

  const list =
    [...categories];

  openModal(
    "Tetos mensais por categoria",

    `
      ${
        list.length
          ? list.map(cat => `
              ${field(
                cat,
                `limit-${encodeURIComponent(cat)}`,
                "number",
                state.settings
                  .financeLimits?.[cat] || 0,
                'min="0" step="0.01"'
              )}
            `).join("")
          : `
            <p class="muted">
              Cadastre primeiro um gasto com uma categoria.
            </p>
          `
      }

      ${field(
        "Nova categoria",
        "newCategory"
      )}

      ${field(
        "Teto da nova categoria",
        "newLimit",
        "number",
        "",
        'min="0" step="0.01"'
      )}
    `,

    {
      submit: "Salvar tetos"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const limits = {
      ...(state.settings.financeLimits || {})
    };

    list.forEach(cat => {

      const value =
        Number(
          f.get(
            `limit-${encodeURIComponent(cat)}`
          ) || 0
        );

      limits[cat] = value;

    });

    const newCategory =
      String(
        f.get("newCategory") || ""
      ).trim();

    const newLimit =
      Number(
        f.get("newLimit") || 0
      );

    if (newCategory) {
      limits[newCategory] =
        newLimit;
    }

    state.settings.financeLimits =
      limits;

    saveState();
    closeModal();
    render();

    toast(
      "Tetos de gastos atualizados."
    );
  };
}

/* =========================================================
   OBJETIVO
   ========================================================= */

function openGoalForm(existing = null) {

  openModal(
    existing
      ? "Editar objetivo"
      : "Novo objetivo",

    field(
      "Objetivo",
      "title",
      "text",
      existing?.title || "",
      "required"
    ) +

    field(
      "Prazo",
      "deadline",
      "date",
      existing?.deadline || ""
    ) +

    field(
      "Progresso",
      "progressRemaining",
      "text",
      money(Math.max(Number(existing?.moneyRemaining || 0), 0), existing?.moneyCurrency || "BRL"),
      'readonly aria-readonly="true"'
    ) +

    field(
      "Valor necessário",
      "moneyGoal",
      "number",
      existing?.moneyGoal || 0,
      'min="0" step="0.01" required'
    ) +

    field(
      "Valor arrecadado",
      "moneyAccumulated",
      "number",
      existing?.moneyAccumulated || 0,
      'min="0" step="0.01"'
    ) +

    selectField(
      "Moeda da meta financeira",
      "moneyCurrency",
      [
        { value: "BRL", label: "Real brasileiro (R$)" },
        { value: "USD", label: "Dólar americano (US$)" }
      ],
      existing?.moneyCurrency || "BRL"
    ) +`<label class="form-field"><span>Categoria financeira vinculada (opcional)</span><input name="financeCategory" value="${esc(existing?.financeCategory||"")}" placeholder="Ex.: Viagem, Notebook, Reserva"></label>` +

    textareaField(
      "Observações",
      "observations",
      existing?.observations || ""
    ),

    {
      submit:
        existing
          ? "Salvar"
          : "Criar objetivo"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const goal = {
      id:
        existing?.id ||
        uid("o"),

      title:
        f.get("title"),

      deadline:
        f.get("deadline"),

      progress:
        Number(existing?.progress || 0),

      moneyGoal:
        Number(
          f.get("moneyGoal") || 0
        ),

      moneyAccumulated:
        Number(
          f.get("moneyAccumulated") || 0
        ),

      moneyCurrency:
        f.get("moneyCurrency") || "BRL",

      financeCategory: String(f.get("financeCategory") || "").trim(),

      observations:
        f.get("observations"),

      metas:
        existing?.metas || []
    };

    updateGoalProgress(goal);

    if (existing) {

      const index =
        state.data.objetivos
          .findIndex(
            x => x.id === existing.id
          );

      if (index >= 0) {
        state.data.objetivos[index] =
          goal;
      }

    } else {

      state.data.objetivos.push(
        goal
      );

    }

    saveState();
    closeModal();
    render();

    toast(
      existing
        ? "Objetivo atualizado."
        : "Objetivo criado."
    );
  };

  const goalTargetInput = modal.querySelector('[name="moneyGoal"]');
  const goalAccumulatedInput = modal.querySelector('[name="moneyAccumulated"]');
  const goalCurrencyInput = modal.querySelector('[name="moneyCurrency"]');
  const goalRemainingInput = modal.querySelector('[name="progressRemaining"]');
  const refreshGoalRemaining = () => {
    if (!goalRemainingInput) return;
    const target = Math.max(0, Number(goalTargetInput?.value || 0));
    const accumulated = Math.max(0, Number(goalAccumulatedInput?.value || 0));
    const currency = goalCurrencyInput?.value || "BRL";
    goalRemainingInput.value = money(Math.max(target - accumulated, 0), currency);
  };
  [goalTargetInput, goalAccumulatedInput, goalCurrencyInput].forEach(input => {
    input?.addEventListener("input", refreshGoalRemaining);
    input?.addEventListener("change", refreshGoalRemaining);
  });
  refreshGoalRemaining();
}

/* =========================================================
   META INTERNA DO OBJETIVO
   ========================================================= */

function calculateGoalProgress(goal) {
  const metas = Array.isArray(goal?.metas) ? goal.metas : [];
  if (!metas.length) return Number(goal?.progress || 0);
  const completed = metas.filter(meta => meta.done).length;
  return Math.round((completed / metas.length) * 100);
}

function updateGoalProgress(goal) {
  if (!goal) return;
  const target = Number(goal.moneyGoal || 0);
  if (target > 0) {
    if (goal.moneyAccumulated == null || Number.isNaN(Number(goal.moneyAccumulated))) {
      if (goal.financeCategory) {
        const cur=goal.moneyCurrency||"BRL";
        goal.moneyAccumulated=(state.data.financas||[]).filter(x=>x.type==="income" && (x.currency||"BRL")===cur && String(x.category||"").trim().toLowerCase()===String(goal.financeCategory).trim().toLowerCase()).reduce((sum,x)=>sum+Number(x.value||0),0);
      } else {
        goal.moneyAccumulated=0;
      }
    }
    const accumulated=Math.max(0,Number(goal.moneyAccumulated)||0);
    goal.moneyAccumulated=accumulated;
    goal.moneyRemaining=Math.max(target-accumulated,0);
    goal.progress=Math.min(100,Math.round((accumulated/target)*100));
  } else if (Array.isArray(goal.metas) && goal.metas.length) {
    goal.progress = calculateGoalProgress(goal);
    goal.moneyAccumulated=Number(goal.moneyAccumulated||0);
    goal.moneyRemaining=0;
  } else {
    goal.moneyAccumulated=Number(goal.moneyAccumulated||0);
    goal.moneyRemaining=0;
  }
}
function addMeta(goalId) {

  openModal(
    "Nova meta do objetivo",

    field(
      "Meta",
      "title",
      "text",
      "",
      "required"
    ) +

    selectField(
      "Periodicidade",
      "period",
      [
        "Diária",
        "Semanal",
        "Mensal"
      ],
      "Diária"
    ),

    {
      submit: "Adicionar meta"
    }
  );

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const goal =
      state.data.objetivos.find(
        x => x.id === goalId
      );

    if (!goal) return;

    if (!goal.metas) {
      goal.metas = [];
    }

    goal.metas.push({
      id: uid("meta"),
      title:
        f.get("title"),
      period:
        f.get("period"),
      done: false
    });
    updateGoalProgress(goal);

    saveState();
    closeModal();
    render();

    toast(
      "Meta adicionada ao objetivo."
    );
  };
}

function confirmDeleteGoal(id) {
  const goal = state.data.objetivos.find(x => x.id === id);
  if (!goal) return;
  openModal(
    "Excluir objetivo",
    `<div class="confirm-delete-box"><div class="confirm-delete-icon">⚠</div><p>Tem certeza que deseja excluir <strong>${esc(goal.title)}</strong>?</p><p class="muted">As metas internas e o progresso deste objetivo também serão removidos.</p><div class="confirm-delete-actions"><button type="button" class="ghost-button" data-action="cancel-delete-objetivo">Cancelar</button><button type="button" class="danger-button" data-action="confirm-delete-objetivo" data-id="${goal.id}">Confirmar exclusão</button></div></div>`,
    { submit: "Cancelar" }
  );
  modal.querySelector(".modal-footer").style.display = "none";
}

/* =========================================================
   EDIÇÃO DE COMPROMISSO E TAREFA
   ========================================================= */


function openStudySubjectDetails(planId, subjectId){
  const plan=(state.data.studyPlans||[]).find(p=>String(p.id)===String(planId));
  const subject=plan?.subjects?.find(s=>String(s.id)===String(subjectId));
  if(!plan||!subject){toast("Matéria não encontrada.","error");return;}
  const topics=Array.isArray(subject.topics)?subject.topics:[];
  const renderTopic=(t)=>`<div class="content-card study-topic-detail-row" data-topic-id="${esc(t.id)}" style="margin-top:10px;padding:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div style="min-width:0"><strong style="${t.done?"text-decoration:line-through;opacity:.65":""}">${esc(t.name||"Assunto")}</strong><div class="muted" style="font-size:12px">${Number(t.duration)||0} min${t.done?" · Concluído":""}</div></div>
      <div class="item-actions">
        <button type="button" class="ghost-button compact" data-action="toggle-study-topic" data-plan-id="${esc(plan.id)}" data-subject-id="${esc(subject.id)}" data-topic-id="${esc(t.id)}" title="${t.done?"Marcar como pendente":"Marcar como concluído"}" aria-label="${t.done?"Marcar como pendente":"Marcar como concluído"}">${t.done?icon("check"):icon("arrow")}</button>
        <button type="button" class="ghost-button compact" data-edit-study-topic="${esc(t.id)}" title="Editar">${icon("edit")}</button>
        <button type="button" class="ghost-button compact" data-delete-study-topic="${esc(t.id)}" title="Excluir">${icon("trash")}</button>
      </div>
    </div>
    ${t.notes?`<p style="margin:8px 0 0">${esc(t.notes)}</p>`:""}
    ${Array.isArray(t.links)&&t.links[0]?`<a href="${esc(t.links[0])}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px">🔗 Abrir material</a>`:""}
  </div>`;
  const body=()=>`${topics.length?topics.map(renderTopic).join(""):"<p class=\"muted\">Nenhum assunto cadastrado.</p>"}<div style="margin-top:14px"><button type="button" class="primary-button compact" id="add-subject-topic-detail">＋ Adicionar assunto</button></div>`;
  openModal(`Assuntos — ${subject.name||"Matéria"}`,`<p class="muted">Todos os assuntos cadastrados nesta matéria, com duração, anotações e materiais.</p><div id="study-subject-topic-details">${body()}</div>`,{submit:"Fechar"});
  const bind=()=>{
    const container=modal.querySelector("#study-subject-topic-details");
    modal.querySelector("#add-subject-topic-detail").onclick=()=>openStudyTopicEditor(plan,subject,null,()=>openStudySubjectDetails(plan.id,subject.id));
    container.querySelectorAll("[data-edit-study-topic]").forEach(btn=>btn.onclick=()=>{const t=subject.topics.find(x=>String(x.id)===String(btn.dataset.editStudyTopic));if(t)openStudyTopicEditor(plan,subject,t,()=>openStudySubjectDetails(plan.id,subject.id));});
    container.querySelectorAll("[data-delete-study-topic]").forEach(btn=>btn.onclick=()=>{if(!confirm("Excluir este assunto?"))return;subject.topics=(subject.topics||[]).filter(x=>String(x.id)!==String(btn.dataset.deleteStudyTopic));saveState();openStudySubjectDetails(plan.id,subject.id);toast("Assunto excluído.");});
  };
  bind();
  modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();closeModal();};
}

function openStudyTopicEditor(plan,subject,existing,onDone){
  const t=existing||{id:uid("study-topic"),name:"",duration:30,notes:"",links:[],done:false};
  openModal(existing?"Editar assunto":"Novo assunto",field("Nome do assunto","name","text",t.name||"","required")+field("Tempo do assunto (minutos)","duration","number",Number(t.duration)||30,"required")+textareaField("Anotações","notes",t.notes||"")+field("Link","link","url",Array.isArray(t.links)?(t.links[0]||""):(t.link||"")),{submit:existing?"Salvar alterações":"Adicionar assunto"});
  modal.querySelector("#lidire-form").onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target);const name=String(f.get("name")||"").trim();if(!name){toast("Informe o nome do assunto.","error");return;}
    const item={id:t.id,name,duration:Math.max(1,Number(f.get("duration"))||30),notes:String(f.get("notes")||"").trim(),links:String(f.get("link")||"").trim()?[String(f.get("link")||"").trim()]:[],done:t.done===true};
    subject.topics=Array.isArray(subject.topics)?subject.topics:[];const idx=subject.topics.findIndex(x=>String(x.id)===String(item.id));if(idx>=0)subject.topics[idx]=item;else subject.topics.push(item);saveState();closeModal();if(typeof onDone==="function")onDone();toast(existing?"Assunto atualizado.":"Assunto adicionado.");
  };
}

function studyPlanCard(plan) {
  const name = String(plan.name || "Planejamento");
  const start = plan.startDate || "";
  const end = plan.endDate || "";
  const subjects = Array.isArray(plan.subjects) ? plan.subjects : [];
  const dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const subjectSummary = subjects.length
    ? `<div class="item-list" style="margin-top:10px">${subjects.map(subject => {
        const days = Array.isArray(subject.weekdays) ? subject.weekdays : [];
        const topics = Array.isArray(subject.topics) ? subject.topics : [];
        const completedTopics = topics.filter(topic => topic.done === true).length;
        const dayLabel = days.map(d => dayNames[Number(d)] || "").filter(Boolean).join(", ");
        const perDayCount = studySubjectTopicsPerDay(subject);
        const perDayText = topics.length > 1 ? (perDayCount === topics.length ? "todos no mesmo dia" : `${perDayCount} por dia`) : "";
        const topicLabel = topics.length ? ` · ${topics.length} ${topics.length === 1 ? "assunto" : "assuntos"}${perDayText ? ` (${perDayText})` : ""}` : "";
        const linkedReminder=(state.data.lembretes||[]).find(r=>String(r.sourceType||"")==="estudo-materia"&&String(r.sourceId||"")===String(subject.id));
        const bell=linkedReminder
          ? `<button type="button" class="ghost-button compact" data-action="toggle-study-subject-reminder" data-id="${esc(subject.id)}" title="${linkedReminder.paused?"Ativar lembrete":"Desativar lembrete"}" aria-label="${linkedReminder.paused?"Ativar lembrete":"Desativar lembrete"}">${linkedReminder.paused?"🔕":"🔔"}</button>`
          : `<button type="button" class="ghost-button compact" data-action="toggle-study-subject-reminder" data-id="${esc(subject.id)}" title="Criar lembrete" aria-label="Criar lembrete">🔔</button>`;
        return `<div class="list-item">
          <div class="module-icon small">📚</div>
          <div class="item-main">
            <strong data-action="view-study-subject" data-plan-id="${esc(plan.id)}" data-subject-id="${esc(subject.id)}" style="cursor:pointer">${esc(subject.name || "Matéria")} <span class="muted" style="font-size:13px;font-weight:600">${completedTopics}/${topics.length}</span></strong>
            <span>${dayLabel || "Sem dias definidos"} · ${Number(subject.duration)||0} min${topicLabel}</span>
          </div>
          <div class="item-actions">${bell}<button type="button" class="ghost-button compact" data-action="delete-study-subject" data-plan-id="${esc(plan.id)}" data-id="${esc(subject.id)}" title="Excluir matéria" aria-label="Excluir matéria">🗑️</button></div>
        </div>`;
      }).join("")}</div>`
    : `<p class="muted">Nenhuma matéria configurada ainda.</p>`;

  return `<div class="content-card">
    <div class="card-toolbar">
      <div>
        <div class="toolbar-title">📚 ${esc(name)}</div>
        <small>${start ? dateBR(start) : "—"}${end ? ` → ${dateBR(end)}` : ""}</small>
      </div>
      <div class="item-actions">
        <button type="button" data-action="edit-study-plan" data-id="${esc(plan.id)}" title="Editar">${icon("edit")}</button>
        <button type="button" data-action="delete-study-plan" data-id="${esc(plan.id)}" title="Excluir">${icon("trash")}</button>
        <button type="button" data-action="view-study-sessions" data-id="${esc(plan.id)}" title="Ver sessões">📅</button>
      </div>
    </div>
    ${subjectSummary}
  </div>`;
}

function addStudyPlan(existing = null) {
  const x = existing || {
    name: "",
    startDate: todayISO(),
    endDate: todayISO(),
    subjects: []
  };

  const subjects = Array.isArray(x.subjects)
    ? x.subjects.map(subject => ({
        id: subject.id || uid("study-subject"),
        name: subject.name || "",
        weekdays: Array.isArray(subject.weekdays) ? subject.weekdays.map(Number) : [],
        duration: Number(subject.duration) || 30,
        topicsPerDay: subject.topicsPerDay,
        topics: Array.isArray(subject.topics)
          ? subject.topics.map(topic => ({
              id: topic.id || uid("study-topic"),
              name: topic.name || "",
              duration: Number(topic.duration) || 30,
              notes: topic.notes || "",
              links: Array.isArray(topic.links) ? topic.links : (topic.link ? [topic.link] : []),
              done: topic.done === true
            }))
          : []
      }))
    : [];

  const weekdays = [
    ["0","Domingo"],
    ["1","Segunda-feira"],
    ["2","Terça-feira"],
    ["3","Quarta-feira"],
    ["4","Quinta-feira"],
    ["5","Sexta-feira"],
    ["6","Sábado"]
  ];

  const topicRow = topic => `
    <div class="study-topic-row" data-topic-id="${esc(topic.id || uid("study-topic"))}" style="margin-top:8px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong style="font-size:13px">Assunto</strong>
        <button type="button" class="ghost-button compact" data-remove-study-topic aria-label="Excluir assunto">🗑</button>
      </div>
      <label class="field-label">Nome do assunto</label>
      <input class="field-input study-topic-name" type="text" value="${esc(topic.name || "")}" placeholder="Ex.: Crase">
      <label class="field-label">Tempo do assunto (minutos)</label>
      <input class="field-input study-topic-duration" type="number" min="1" max="720" value="${Number(topic.duration)||30}">
      <label class="field-label">Anotações</label>
      <textarea class="field-input study-topic-notes" rows="2" placeholder="Observações, conteúdo ou estratégia...">${esc(topic.notes || "")}</textarea>
      <label class="field-label">Link</label>
      <input class="field-input study-topic-link" type="url" value="${esc(Array.isArray(topic.links) ? (topic.links[0] || "") : "")}" placeholder="https://...">
    </div>`;

  const subjectRow = subject => `
    <div class="content-card study-plan-subject-row" data-subject-id="${esc(subject.id || uid("study-subject"))}" style="margin-top:10px;padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong>Matéria</strong>
        <button type="button" class="ghost-button compact" data-remove-study-subject aria-label="Excluir matéria">🗑</button>
      </div>
      <label class="field-label">Nome da matéria</label>
      <input class="field-input study-subject-name" type="text" value="${esc(subject.name || "")}" required>
      <label class="field-label">Dias da semana</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px">
        ${weekdays.map(([value,label]) => `
          <label style="display:flex;align-items:center;gap:4px;font-size:13px">
            <input type="checkbox" class="study-subject-day" value="${value}" ${subject.weekdays.includes(Number(value)) ? "checked" : ""}>
            ${label}
          </label>
        `).join("")}
      </div>
      <label class="field-label">Tempo por sessão (minutos)</label>
      <input class="field-input study-subject-duration" type="number" min="1" max="720" value="${Number(subject.duration)||30}" required>
      <label class="field-label">Assuntos por dia de estudo</label>
      <select class="field-input study-subject-topics-per-day">
        ${(() => {
          const current = (subject.topicsPerDay === 0 || subject.topicsPerDay === "0") ? 0 : (Math.floor(Number(subject.topicsPerDay)) || 1);
          const options = [[1,"1 assunto por dia (em rodízio)"],[2,"2 assuntos por dia"],[3,"3 assuntos por dia"],[4,"4 assuntos por dia"],[5,"5 assuntos por dia"],[0,"Todos os assuntos em cada dia"]];
          if (!options.some(([value]) => value === current)) options.splice(options.length - 1, 0, [current, `${current} assuntos por dia`]);
          return options.map(([value,label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("");
        })()}
      </select>
      <small class="muted" style="display:block;margin-top:4px">Com vários assuntos no mesmo dia, cada um usa o próprio tempo. Se houver mais assuntos do que o escolhido, eles entram em rodízio ao longo do período.</small>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:14px">
        <strong style="font-size:13px">Assuntos</strong>
        <button type="button" class="ghost-button compact" data-add-study-topic>＋ Adicionar assunto</button>
      </div>
      <div class="study-topic-list">
        ${(Array.isArray(subject.topics) ? subject.topics : []).map(topicRow).join("")}
      </div>
    </div>`;

  openModal(
    existing ? "Editar planejamento" : "Novo planejamento",
    field("Nome do planejamento", "name", "text", x.name || "", "required") +
    field("Data de início", "startDate", "date", x.startDate || todayISO(), "required") +
    field("Data de término", "endDate", "date", x.endDate || todayISO(), "required") +
    `<div style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <strong>Matérias</strong>
        <button type="button" class="ghost-button compact" id="add-study-subject">＋ Adicionar matéria</button>
      </div>
      <div id="study-plan-subjects">
        ${subjects.map(subjectRow).join("")}
      </div>
      <p class="muted" style="margin-top:10px">Defina os dias, o tempo e os assuntos de cada matéria e escolha quantos assuntos entram em cada dia de estudo. Cada assunto pode ter duração, anotações e link.</p>
    </div>`,
    { submit: existing ? "Salvar alterações" : "Criar planejamento" }
  );

  const subjectContainer = modal.querySelector("#study-plan-subjects");
  const addSubjectButton = modal.querySelector("#add-study-subject");

  const bindSubjectEvents = () => {
    subjectContainer.querySelectorAll("[data-remove-study-subject]").forEach(button => {
      button.onclick = () => {
        const row = button.closest(".study-plan-subject-row");
        if (row) row.remove();
      };
    });
  };

  subjectContainer.addEventListener("click", event => {
    const addTopic = event.target.closest("[data-add-study-topic]");
    if (addTopic) {
      const list = addTopic.closest(".study-plan-subject-row")?.querySelector(".study-topic-list");
      if (!list) return;
      list.insertAdjacentHTML("beforeend", topicRow({
        id: uid("study-topic"), name: "", duration: 30, notes: "", links: []
      }));
      return;
    }
    const removeTopic = event.target.closest("[data-remove-study-topic]");
    if (removeTopic) {
      const row = removeTopic.closest(".study-topic-row");
      if (row) row.remove();
    }
  });

  addSubjectButton.onclick = () => {
    subjectContainer.insertAdjacentHTML("beforeend", subjectRow({
      id: uid("study-subject"),
      name: "",
      weekdays: [],
      duration: 30,
      topicsPerDay: 1,
      topics: []
    }));
    bindSubjectEvents();
  };

  bindSubjectEvents();

  modal.querySelector("#lidire-form").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = String(f.get("name") || "").trim();
    const startDate = String(f.get("startDate") || "");
    const endDate = String(f.get("endDate") || "");

    if (!name || !startDate || !endDate) {
      toast("Preencha o nome e o período do planejamento.", "error");
      return;
    }

    if (endDate < startDate) {
      toast("A data de término não pode ser anterior à data de início.", "error");
      return;
    }

    const nextSubjects = [];
    const rows = subjectContainer.querySelectorAll(".study-plan-subject-row");

    for (const row of rows) {
      const subjectName = String(row.querySelector(".study-subject-name")?.value || "").trim();
      const duration = Math.max(1, Number(row.querySelector(".study-subject-duration")?.value) || 30);
      const topicsPerDayRaw = row.querySelector(".study-subject-topics-per-day")?.value;
      const topicsPerDay = topicsPerDayRaw === "0" ? 0 : Math.max(1, Math.floor(Number(topicsPerDayRaw)) || 1);
      const selectedDays = Array.from(row.querySelectorAll(".study-subject-day:checked")).map(input => Number(input.value));

      if (!subjectName) {
        toast("Preencha o nome de todas as matérias.", "error");
        return;
      }

      if (!selectedDays.length) {
        toast(`Selecione pelo menos um dia para a matéria "${subjectName}".`, "error");
        return;
      }

      const originalId = String(row.dataset.subjectId || "");
      const original = subjects.find(subject => String(subject.id) === originalId);
      const topics = [];

      row.querySelectorAll(".study-topic-row").forEach(topicRowEl => {
        const topicName = String(topicRowEl.querySelector(".study-topic-name")?.value || "").trim();
        const topicDuration = Math.max(1, Number(topicRowEl.querySelector(".study-topic-duration")?.value) || 30);
        const notes = String(topicRowEl.querySelector(".study-topic-notes")?.value || "").trim();
        const link = String(topicRowEl.querySelector(".study-topic-link")?.value || "").trim();
        if (!topicName && !notes && !link) return;
        if (!topicName) return;
        const topicId = String(topicRowEl.dataset.topicId || uid("study-topic"));
        topics.push({
          id: topicId,
          name: topicName,
          duration: topicDuration,
          notes,
          links: link ? [link] : []
        });
      });

      nextSubjects.push({
        id: original?.id || originalId || uid("study-subject"),
        name: subjectName,
        weekdays: selectedDays,
        duration,
        topicsPerDay,
        topics
      });
    }

    if (existing) {
      existing.name = name;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.subjects = nextSubjects;
      existing.updatedAt = new Date().toISOString();
    } else {
      state.data.studyPlans.push({
        id: uid("study-plan"),
        name,
        startDate,
        endDate,
        subjects: nextSubjects,
        createdAt: new Date().toISOString()
      });
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    saveState();
    closeModal();
    render();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
    toast(existing ? "Planejamento atualizado." : "Planejamento criado com sucesso.");
  };
}

function editItem(type, id) {

  const key =
    type === "compromisso"
      ? "compromissos"
      : "tarefas";

  const item =
    state.data[key].find(
      x => x.id === id
    );

  if (!item) return;

  if (type === "compromisso") {

    openModal(
      "Editar compromisso",

      field(
        "Título",
        "title",
        "text",
        item.title,
        "required"
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date,
        "required"
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ) +

      field(
        "Local",
        "location",
        "text",
        item.location || ""
      ) +

      selectField(
        "Lugar frequente (opcional)",
        "frequentPlaceId",
        [{ value: "", label: "Selecione um lugar cadastrado" }, ...(state.data.lugares || []).map(place => ({ value: String(place.id), label: place.name || place.address }))],
        String((state.data.lugares || []).find(place => place.address && place.address === item.address)?.id || "")
      ) +

      field(
        "Endereço",
        "address",
        "text",
        item.address || "",
        'placeholder="Digite ou cole o endereço do compromisso"'
      ),

      {
        submit: "Salvar"
      }
    );

  } else {

    openModal(
      "Editar tarefa",

      field(
        "Tarefa",
        "title",
        "text",
        item.title,
        "required"
      ) +

      selectField(
        "Prioridade",
        "priority",
        [
          "Baixa",
          "Normal",
          "Média",
          "Alta"
        ],
        item.priority ||
          "Normal"
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date || ""
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ),

      {
        submit: "Salvar"
      }
    );
  }

  const editForm = modal.querySelector("#lidire-form");
  const frequentPlaceSelect = editForm.querySelector('[name="frequentPlaceId"]');
  frequentPlaceSelect?.addEventListener("change", () => {
    const selectedPlace = (state.data.lugares || []).find(place => String(place.id) === String(frequentPlaceSelect.value));
    const addressInput = editForm.querySelector('[name="address"]');
    const locationInput = editForm.querySelector('[name="location"]');
    if (selectedPlace && addressInput) {
      addressInput.value = selectedPlace.address || "";
      if (locationInput && !locationInput.value.trim()) locationInput.value = selectedPlace.name || "";
    }
  });

  modal.querySelector(
    "#lidire-form"
  ).onsubmit = e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    Object.assign(
      item,
      Object.fromEntries(
        f.entries()
      )
    );

    saveState();
    closeModal();
    render();

    toast(
      "Alterações salvas."
    );
  };
}


/* =========================================================
   AÇÕES PRINCIPAIS
   ========================================================= */

function removeItem(
  key,
  id,
  message = "Item removido."
) {

  state.data[key] =
    state.data[key].filter(
      x => x.id !== id
    );

  saveState();
  // Ao excluir um familiar, preserve a posição da lista em vez de voltar ao topo.
  render(key === "familia");

  toast(message);
}

function openFamilyForm(existing=null){
  const defaults={
    agenda:false,shareTasksData:false,compras:false,estudos:false,treinos:false,
    hidratacao:false,alimentacao:false,financas:false,objetivos:false,
    lembretes:false
  };
  const p={...defaults,...(existing?.permissions||{})};
  if (existing && existing.permissions?.shareConsentVersion !== 1) Object.keys(defaults).forEach(k=>{p[k]=false;});
  const labels={
    agenda:["📅","Agenda"],
    shareTasksData:["✓","Compartilhar todas as tarefas (somente leitura)"],
    compras:["🛒","Compras"],
    estudos:["📚","Estudos"],
    treinos:["🏋️","Treinos"],
    hidratacao:["💧","Hidratação"],
    alimentacao:["🍽️","Alimentação"],
    financas:["💰","Finanças"],
    objetivos:["🎯","Objetivos"],
    lembretes:["🔔","Lembretes"]
  };
  const perms=Object.entries(labels).map(([k,[ico,label]])=>`
    <label class="family-permission-option">
      <input type="checkbox" name="perm_${k}" ${p[k]?"checked":""}>
      <span class="family-permission-icon" aria-hidden="true">${ico}</span>
      <span class="family-permission-name">${label}</span>
    </label>
  `).join("");

  openModal(
    existing?"Editar pessoa":"Adicionar pessoa",
    field("Nome","name","text",existing?.name||"","required")+
    field("Relação","relation","text",existing?.relation||"Membro")+
    field("E-mail","email","email",existing?.email||"","required")+
    field("Endereço (opcional)","address","text",existing?.address||"",'placeholder="Rua, número, bairro, cidade"')+
    `<div class="family-permissions-editor">
      <div class="family-permissions-editor-title">
        <h3>Permissões de compartilhamento</h3>
        <p class="muted">Marque somente os módulos que você autoriza compartilhar com este contato. O compartilhamento é somente leitura, só vale depois que a pessoa aceitar o convite e os registros dos módulos marcados são enviados ao servidor LiDire (sem senhas ou credenciais). Dados de saúde, como Gestação e Ciclo Menstrual, não são compartilhados. Permissões antigas não concedem acesso automaticamente; revise e salve explicitamente as opções desejadas. Ao desmarcar um módulo, o acesso é bloqueado e a cópia é removida do servidor se nenhum outro contato a usa.</p>
      </div>
      <div class="family-permission-options">${perms}</div>
    </div>`,
    {submit:existing?"Salvar alterações":"Adicionar"}
  );

  modal.querySelector("#lidire-form").onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(e.target);
    const familyName=String(f.get("name")||"").trim();
    const familyEmail=String(f.get("email")||"").trim().toLowerCase();
    if(!familyName){toast("Informe o nome.","error");return;}
    if(!familyEmail){toast("Informe o e-mail.","error");return;}

    // Feedback imediato para a pessoa saber que o toque foi registrado e evitar duplicidade.
    const submitButton = e.submitter || modal?.querySelector('#lidire-form button[type="submit"]');
    const originalSubmitText = submitButton?.textContent || "Adicionar";
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Verificando e cadastrando…"; }

    const person=existing||{
      id:uid("family"),name:"",relation:"Membro",email:"",address:"",
      permissions:{},inviteStatus:"local"
    };
    person.name=familyName;
    person.relation=String(f.get("relation")||"Membro").trim();
    person.email=familyEmail;
    person.address=String(f.get("address")||"").trim();
    person.permissions={};
    Object.keys(defaults).forEach(k=>person.permissions[k]=f.get("perm_"+k)==="on");

    /*
       NOVO FLUXO F2:
       antes de cadastrar um novo familiar, consulta o D1 para saber
       se o e-mail já pertence a uma conta LiDire.
    */
    let emailCheck=null;
    if(!existing || String(existing.email||"").trim().toLowerCase()!==familyEmail){
      try{
        emailCheck=await apiRequest(`/api/family/check-email?email=${encodeURIComponent(familyEmail)}`,{method:"GET"});
      }catch(error){
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalSubmitText; }
        toast(error?.message||"Não foi possível verificar o e-mail no banco de dados.","error");
        return;
      }
    }

    try{
      const payload={
        name:person.name,
        relation:person.relation,
        email:person.email,
        address:person.address,
        permissions:person.permissions,
        shareConsentConfirmed:true
      };

      if(existing?.serverId){
        const data=await apiRequest(`/api/family/members/${encodeURIComponent(existing.serverId)}`,{
          method:"PUT",
          body:JSON.stringify(payload)
        });
        person.serverId=data?.member?.id||existing.serverId;
        person.inviteStatus=data?.member?.status||existing.inviteStatus||"active";
        if (data?.member?.permissions && typeof data.member.permissions === "object") person.permissions = data.member.permissions;
      }else{
        if(emailCheck?.alreadyFamilyMember){
          syncFamilyMemberFromServer(emailCheck.familyMember);
          saveState();
          closeModal();
          render();
          toast("Esse familiar já estava cadastrado. Sincronizei o registro e ele deve aparecer na lista.");
          return;
        }
        const data=await apiRequest("/api/family/members",{
          method:"POST",
          body:JSON.stringify(payload)
        });
        if(!data?.member?.id) throw new Error("O servidor não confirmou o cadastro do familiar.");
        person.serverId=data.member.id;
        person.inviteStatus=data.member.status|| (emailCheck?.accountExists?"active":"pending");
        if (data.member.permissions && typeof data.member.permissions === "object") person.permissions = data.member.permissions;
      }

      if(!existing) state.data.familia.push(person);
      saveState();
      closeModal();
      render();

      if(!existing && emailCheck && !emailCheck.accountExists){
        /* Pessoa sem conta: mostra imediatamente o convite, conforme o layout enviado. */
        createFamilyInviteFor(
          person,
          "Esta pessoa ainda não faz parte da LiDire. Envie um convite"
        );
        return;
      }

      toast(existing?"Pessoa atualizada.":(emailCheck?.accountExists?"Familiar cadastrado e vinculado à conta LiDire existente.":"Pessoa adicionada."));
    }catch(error){
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalSubmitText; }
      console.warn("Não foi possível sincronizar familiar agora:",error);
      toast(error?.message||"Não foi possível cadastrar o familiar.","error");
    }
  };
}
function encodeFamilyInvite(person){
  return btoa(unescape(encodeURIComponent(JSON.stringify({
    type:"family", id:person.id, email:person.email||"", language:false?"en-US":"pt-BR", ts:Date.now()
  })))).replace(/=+$/,"");
}
function decodeFamilyInvite(token){
  try{
    const raw=decodeURIComponent(escape(atob(String(token||""))));
    const data=JSON.parse(raw);
    return data?.type==="family"?data:null;
  }catch{return null;}
}
function renderInviteLanding(token){
  const invite=decodeFamilyInvite(token);
  if(!invite){
    document.getElementById("app").innerHTML=`
      <div class="invite-page"><div class="invite-card invite-invalid">
        <img src="/logo-lidire-oficial.png" alt="LiDire" class="invite-logo">
        <span class="eyebrow">LIDIRE</span>
        <h1>Convite inválido ou expirado.</h1>
        <p class="muted">Solicite um novo convite à pessoa que enviou este link.</p>
        <button class="primary-button" data-action="invite-back">Voltar para a LiDire</button>
      </div></div>`;
    return;
  }
  const lang=invite.language==="en-US" || (invite.language!="pt-BR" && false);
  document.documentElement.lang=lang?"en-US":"pt-BR";
  document.getElementById("app").innerHTML=`
    <div class="invite-page">
      <div class="invite-glow"></div>
      <section class="invite-card">
        <img src="/lidire-invite-preview.png" alt="Convite familiar LiDire" class="invite-banner">
        <img src="/logo-lidire-oficial.png" alt="LiDire" class="invite-logo">
        <span class="eyebrow">${lang?"FAMILY INVITATION":"CONVITE FAMILIAR"}</span>
        <h1>${lang?"You received an invitation to LiDire 💜":"Você recebeu um convite para a LiDire 💜"}</h1>
        <p>${lang?"Someone invited you to be part of their family routine on LiDire.":"Você foi convidado(a) para fazer parte da rotina familiar de alguém na LiDire."}</p>
        <div class="invite-note">
          <span>🔐</span>
          <div><strong>${lang?"Private and controlled sharing":"Compartilhamento privado e controlado"}</strong>
          <small>${lang?"You choose what information is shared. This link does not expose the sender's data.":"Você escolhe o que será compartilhado. Este link não expõe os dados de quem enviou o convite."}</small></div>
        </div>
        <button class="primary-button invite-main-action" data-action="invite-continue">${lang?"Continue to LiDire":"Continuar para a LiDire"}</button>
        <button class="ghost-button invite-secondary-action" data-action="invite-copy" data-token="${esc(token)}">${lang?"Copy invitation link":"Copiar link do convite"}</button>
        <small class="invite-footnote">${lang?"The invitation is a preview. Account access and permissions are only granted through the LiDire account flow.":"Este convite é uma prévia. O acesso à conta e as permissões só são concedidos pelo fluxo da conta LiDire."}</small>
      </section>
    </div>`;
}
function createFamilyInviteFor(person, noticeMessage=""){
  const token=encodeFamilyInvite(person);
  const link=`${location.origin}/convite?token=${token}`;
  const lang=false;
  openModal(
    lang?"Family invitation":"Convite familiar",
    `<div class="invite-preview">
      ${noticeMessage?`<div class="family-invite-notice">${esc(noticeMessage)}</div>`:""}
      <div class="invite-preview-card">
        <img src="/logo-lidire-oficial.png" alt="LiDire">
        <span class="eyebrow">${lang?"FAMILY INVITATION":"CONVITE FAMILIAR"}</span>
        <h3>${lang?"You received an invitation to LiDire 💜":"Você recebeu um convite para a LiDire 💜"}</h3>
        <p>${lang?"Private sharing, controlled by you.":"Compartilhamento privado, controlado por você."}</p>
      </div>
      <label class="form-field"><span>${lang?"Invitation link":"Link do convite"}</span><input id="familyInviteLink" value="${esc(link)}" readonly></label>
      <p class="muted invite-security-note">🔐 ${lang?"This link does not expose your data.":"Este link não expõe seus dados."}</p>
    </div>`,
    {submit:lang?"Copy link":"Copiar link"}
  );
  modal.querySelector("#lidire-form").onsubmit=e=>{
    e.preventDefault();
    navigator.clipboard?.writeText(link).catch(()=>{});
    const whatsapp=`https://wa.me/?text=${encodeURIComponent((lang?"Join me on LiDire 💜 ":"Venha fazer parte da minha família na LiDire 💜 ")+link)}`;
    closeModal();
    openModal(
      lang?"Share invitation":"Compartilhar convite",
      `<div class="invite-share-actions">
        <a class="primary-button" href="${whatsapp}" target="_blank" rel="noopener noreferrer">💬 ${lang?"Share on WhatsApp":"Compartilhar pelo WhatsApp"}</a>
        <button type="button" class="ghost-button" data-action="copy-family-invite" data-link="${esc(link)}">🔗 ${lang?"Copy link":"Copiar link"}</button>
        <button type="button" class="ghost-button" data-action="create-promo-link">📱 ${lang?"Installation QR code":"QR Code de instalação"}</button>
      </div>`,
      {submit:lang?"Close":"Fechar"}
    );
  };
}
function createPromoLink(){
  const link=`${location.origin}/divulgacao`;
  navigator.clipboard?.writeText(link).catch(()=>{});
  const lang=false;
  openModal(lang?"Install LiDire":"Instalar a LiDire",
    `<div class="install-invite-card" style="text-align:center">
      <p class="muted">${lang?"Scan the QR code with your phone to open the LiDire installation page.":"Aponte a câmera do celular para o QR Code e abra a página de instalação da LiDire."}</p>
      <img src="/lidire-install-qr.png" alt="QR Code LiDire" style="display:block;width:min(280px,80vw);height:auto;margin:18px auto;border-radius:18px;background:#fff;padding:12px;box-sizing:border-box" loading="eager">
      <strong style="display:block;margin-bottom:8px">${lang?"LiDire installation link":"Link de instalação da LiDire"}</strong>
      <label class="form-field"><input value="${esc(link)}" readonly></label>
      <div class="invite-share-actions"><button type="button" class="ghost-button" data-action="copy-promo-link" data-link="${esc(link)}">🔗 ${lang?"Copy link":"Copiar link"}</button><a class="ghost-button" href="/lidire-install-qr.png" download="LiDire-QR-Code.png">⬇ ${lang?"Download QR code":"Baixar QR Code"}</a></div>
    </div>`,
    {submit:lang?"Close":"Fechar"});
}

function handleAction(
  action,
  el
) {
  if (action === "open-ld-type") {
    const type=String(el?.dataset?.ldType||"");
    if(type==="familia"){
      const notes=Array.isArray(state.data.notificacoesFamilia)?state.data.notificacoesFamilia:[];
      if(notes.some(n=>!n.read_at)){ navigateTo("familia"); }
      else { toast("Sem nova LD por aqui", "info"); }
    } else if(type==="grupos"){ const groups=Array.isArray(state.data.grupos)?state.data.grupos:[]; const hasNew=groups.some(g=>(g.invitations||[]).some(i=>i.status==="new"||i.status==="pending")) || (Array.isArray(state.data.notificacoesGrupos)&&state.data.notificacoesGrupos.some(n=>!n.read_at&&n.status!=="deleted")); navigateTo("familia"); if(!hasNew) toast("Você está na área de grupos.","info"); } else { toast("Sem nova LD por aqui", "info"); }
    return;
  }
  if (action === "biometric-enable") { biometricRegister(); return; }
  if (action === "biometric-disable") { biometricDisable(); return; }
  if (action === "biometric-test") { biometricAuthenticate(false).then(ok=>{ if(ok) toast("Biometria reconhecida com sucesso."); }); return; }
  if (action === "biometric-unlock") { biometricAuthenticate(false).then(ok=>{ if(ok){ appLock.unlocked=true; render(); toast("Aplicativo desbloqueado com biometria."); } }); return; }
  if (action === "app-lock-now") {
    appLock.unlocked = false;
    render();
    return;
  }
  if (action === "app-lock-logout") {
    logoutLiDire();
    return;
  }
  if (action === "app-lock-disable") {
    const currentSecret = prompt("Digite seu PIN ou senha atual para desativar o bloqueio:");
    if (currentSecret === null) return;
    apiRequest("/api/security/app-lock", { method: "PUT", body: JSON.stringify({ enabled: false, currentSecret }) })
      .then(data => {
        appLock.configured = !!data.configured;
        appLock.enabled = false;
        appLock.unlocked = true;
        render();
        toast("Bloqueio do aplicativo desativado.");
      })
      .catch(error => toast(error?.message || "Não foi possível desativar o bloqueio.", "error"));
    return;
  }
  if (action === "copy-promo-link") { const link=el.dataset.link||`${location.origin}/divulgacao`; navigator.clipboard?.writeText(link).catch(()=>{}); toast(false?"Installation link copied.":"Link de instalação copiado."); return; }
  if (action === "family-settings") { currentPage="familia-settings"; render(); return; }
  if (action === "open-notifications") { navigateTo("configuracoesNotificacoes"); return; }
  if (action === "show-saved-shopping-lists") { navigateTo("compras-salvas"); return; }
  if (action === "back-to-shopping") { navigateTo("compras"); return; }
  if (action === "family-toggle-feature") {
    state.settings.familySharing=state.settings.familySharing||{};
    const key=el.dataset.key;
    const current=state.settings.familySharing[key];
    state.settings.familySharing[key]=current===undefined ? false : !current;
    saveState(); render(); return;
  }
  if (action === "family-connect-app") {
    state.settings.familySharing=state.settings.familySharing||{};
    const key=`connected_${el.dataset.key}`;
    state.settings.familySharing[key]=!state.settings.familySharing[key];
    saveState(); render();
    toast(state.settings.familySharing[key]?"Integração marcada como conectada.":"Integração desconectada.");
    return;
  }
  if (action === "family-confirm-reschedule") {
    const item=state.data.compromissos.find(x=>x.id===el.dataset.id);
    if(item){ item.familyConfirmed=true; saveState(); render(); toast("Presença confirmada."); }
    return;
  }
  if (action === "family-propose-time") {
    const item=state.data.compromissos.find(x=>x.id===el.dataset.id);
    if(item) openModal("Propor outro horário", field("Novo horário","time","time",item.time||"20:00"), {submit:"Enviar proposta"});
    if(modal){ modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target); if(item){item.proposedTime=String(f.get("time")||"");saveState();}closeModal();toast("Proposta enviada à família.");}; }
    return;
  }
  if (action === "family-view-shopping") {
    if (currentPage === "compras-salvas") { expandedShoppingListId = expandedShoppingListId === (el.dataset.id||null) ? null : (el.dataset.id||null); render(); } else { currentShoppingList=el.dataset.id||null; currentPage="compras"; render(); } return;
  }
  if (action === "family-remind-shopping") { toast("Lembrete da lista de compras agendado para mais tarde."); return; }
  if (action === "ack-group-invite") {
    const id=String(el.dataset.id||"");
    if(!id) return;
    tombstoneSet(groupInviteTombstones,id);
    if(Array.isArray(state.data.groupInvitations)) state.data.groupInvitations=state.data.groupInvitations.filter(i=>String(i.id)!==id);
    (state.data.grupos||[]).forEach(g=>{ if(Array.isArray(g.invitations)) g.invitations=g.invitations.filter(i=>String(i.serverInvitationId||i.id)!==id); });
    saveState(); render(true);
    apiRequest(`/api/groups/invitations/${encodeURIComponent(id)}`,{method:"DELETE",timeoutMs:15000})
      .then(()=>toast("Ciência registrada. O aviso foi retirado da lista."))
      .catch(error=>{
        if(error?.status===404){ toast("Ciência registrada."); return; }
        groupInviteTombstones.delete(id);
        loadGroupInvitationsFromD1().then(()=>render(true));
        toast(error?.message||"Não foi possível registrar a ciência.","error");
      });
    return;
  }
  if (action === "mark-family-notification-read") {
    const id=el.dataset.id;
    const list=state.data.notificacoesFamilia||[];
    const note=list.find(n=>String(n.id)===String(id));
    const previousRead=note?note.read_at:null;
    const acknowledge=String(el.textContent||"").trim().toLowerCase().includes("dar ciência") || String(el.textContent||"").trim().toLowerCase().includes("dar ciencia");
    familyTombstoneSet(id,acknowledge?"acknowledged":"read");
    if(acknowledge) state.data.notificacoesFamilia=list.filter(n=>String(n.id)!==String(id));
    else if(note) note.read_at = new Date().toISOString();
    saveState(); render(true);
    apiRequest(`/api/notifications/${encodeURIComponent(id)}`,{method:"POST",body:JSON.stringify(acknowledge?{acknowledge:true}:{})})
      .then(()=>loadFamilyNotifications(false))
      .catch(error=>{ familyNotificationTombstones.delete(String(id)); if(acknowledge&&note) state.data.notificacoesFamilia=[note,...(state.data.notificacoesFamilia||[]).filter(n=>String(n.id)!==String(id))]; else if(note) note.read_at=previousRead||null; saveState(); render(true); toast(error?.message||"Não foi possível registrar a ciência.","error"); });
    return;
  }
  if (action === "delete-family-notification") {
    const id=el.dataset.id;
    if(!confirm("Mover este LD para a lixeira? Você poderá excluí-lo definitivamente depois.")) return;
    const list=state.data.notificacoesFamilia||[];
    const note=list.find(n=>String(n.id)===String(id));
    // Efeito imediato: some da caixa e vai para a lixeira local; uma consulta em andamento não traz de volta.
    familyTombstoneSet(id,"deleted");
    if(note){
      state.data.notificacoesFamilia=list.filter(n=>String(n.id)!==String(id));
      state.data.notificacoesFamiliaLixeira=[{...note,deleted_at:new Date().toISOString()},...(state.data.notificacoesFamiliaLixeira||[])];
    }
    saveState(); render(true);
    apiRequest(`/api/notifications/${encodeURIComponent(id)}`,{method:"DELETE"})
      .then(()=>{ toast("LD movido para a lixeira."); return loadFamilyNotifications(false); })
      .catch(error=>{
        if(error?.status===404){ loadFamilyNotifications(false); return; }
        familyTombstoneClear(id);
        if(note){
          state.data.notificacoesFamilia=[note,...(state.data.notificacoesFamilia||[]).filter(n=>String(n.id)!==String(id))]
            .sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")));
          state.data.notificacoesFamiliaLixeira=(state.data.notificacoesFamiliaLixeira||[]).filter(n=>String(n.id)!==String(id));
        }
        saveState(); render(true);
        toast(error?.message||"Não foi possível mover o LD para a lixeira.","error");
      });
    return;
  }
  if (action === "purge-family-notification") {
    const id=el.dataset.id;
    if(!confirm("Excluir este LD definitivamente? Esta ação não poderá ser desfeita.")) return;
    familyTombstoneSet(id,"purged");
    state.data.notificacoesFamiliaLixeira=(state.data.notificacoesFamiliaLixeira||[]).filter(n=>String(n.id)!==String(id));
    saveState(); render(true);
    apiRequest(`/api/notifications/${encodeURIComponent(id)}?permanent=1`,{method:"DELETE"})
      .then(()=>{ toast("LD excluído definitivamente."); return loadFamilyNotifications(false); })
      .catch(error=>{
        if(error?.status!==404) familyTombstoneClear(id);
        loadFamilyNotifications(false).then(()=>render(true));
        if(error?.status!==404) toast(error?.message||"Não foi possível excluir o LD.","error");
      });
    return;
  }
  if (action === "empty-family-notification-trash") {
    if(!confirm("Esvaziar toda a lixeira? Todos os LDs excluídos serão removidos definitivamente.")) return;
    const ids=(state.data.notificacoesFamiliaLixeira||[]).map(n=>String(n.id));
    ids.forEach(id=>familyTombstoneSet(id,"purged"));
    state.data.notificacoesFamiliaLixeira=[];
    saveState(); render(true);
    apiRequest("/api/notifications/trash",{method:"DELETE"})
      .then(()=>{ toast("Lixeira esvaziada."); return loadFamilyNotifications(false); })
      .catch(error=>{
        ids.forEach(familyTombstoneClear);
        loadFamilyNotifications(false).then(()=>render(true));
        toast(error?.message||"Não foi possível esvaziar a lixeira.","error");
      });
    return;
  }
  if (action === "respond-family-notification") {
    const id=el.dataset.id; const kind=el.dataset.kind||"reply";
    const note=(state.data.notificacoesFamilia||[]).find(n=>String(n.id)===String(id)); if(!note) return;
    const defaultMessage=kind==="confirm"?"Confirmo o compromisso/alteração.":"";
    const title=kind==="confirm"?"Confirmar compromisso":kind==="suggest"?"Fazer sugestão":"Responder à LD";
    const label=kind==="suggest"?"Sua sugestão (data, horário ou local)":"Mensagem";
    const submitResponse=async message=>{try{await apiRequest(`/api/notifications/${encodeURIComponent(id)}/reply`,{method:"POST",body:JSON.stringify({kind,message})});closeModal();await loadFamilyNotifications(false);toast(kind==="confirm"?"Confirmação enviada.":kind==="suggest"?"Sugestão enviada ao remetente.":"Resposta enviada.");}catch(error){toast(error?.message||"Não foi possível enviar a resposta.","error");}};
    if(kind==="confirm"){submitResponse("Confirmo o compromisso/alteração.");return;}
    openModal(title,textareaField(label,"message",defaultMessage,"required"),{submit:kind==="suggest"?"Enviar sugestão":"Enviar resposta"});
    modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const message=String(f.get("message")||"").trim();if(!message){toast("Escreva uma mensagem.","error");return;}await submitResponse(message);};
    return;
  }
  if (action === "send-family-notification") {
    const person=state.data.familia.find(x=>x.id===el.dataset.id);
    if(!person) return;
    openModal(`Enviar para ${person.name||"familiar"}`,field("Título","title","text","LiDire — Família","required")+textareaField("Mensagem","message","",'required'),{submit:"Enviar notificação"});
    modal.querySelector("#lidire-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await apiRequest("/api/family/notifications",{method:"POST",body:JSON.stringify({memberId:person.serverId||"",recipientEmail:person.email,title:String(f.get("title")||"LiDire — Família"),message:String(f.get("message")||"")})});closeModal();toast("Notificação enviada.");}catch(error){toast(error?.message||"Não foi possível enviar a notificação.","error");}};
    return;
  }
  if (action === "suggest-departure") { suggestDepartureForCommitment(el.dataset.id); return; }
  if (action === "create-departure-reminder") {
    const pending = state.settings?.pendingDepartureReminder;
    if (!pending) { toast("Calcule o horário de saída novamente.", "error"); return; }
    const commitment = (state.data.compromissos || []).find(x => String(x.id) === String(pending.commitmentId));
    if (!commitment) { toast("O compromisso vinculado não foi encontrado.", "error"); return; }
    closeModal();
    openReminderForm({title:`Sair para: ${commitment.title || "compromisso"}`, date:pending.date, time:pending.time, repeat:"once", message:`Saia agora para chegar a ${commitment.title || "seu compromisso"}. Destino: ${commitment.address}. Tempo estimado: ${pending.duration}.`, sourceType:"compromisso", sourceId:commitment.id, sourceName:commitment.title || "Compromisso"});
    return;
  }
  if (action === "route-delete-result") {
    if (state.settings.route) {
      delete state.settings.route.last;
      saveState();
      render(true);
      toast("Resultado da rota excluído.");
    }
    return;
  }
  if (action === "route-open-google-maps" || action === "route-open-waze") {
    const route = state.settings.route?.last;
    if (!route) { toast("Calcule uma rota primeiro.", "error"); return; }

    // A API de rotas salva origem/destino como objetos {address} ou {location:{latLng}}.
    // Nunca converter o objeto inteiro para String, pois isso gera "[object Object]".
    const routeLocationToText = (value) => {
      if (typeof value === "string") return value.trim();
      if (!value || typeof value !== "object") return "";
      if (typeof value.address === "string" && value.address.trim()) return value.address.trim();
      const latLng = value.location?.latLng || value.latLng;
      if (latLng && Number.isFinite(Number(latLng.latitude)) && Number.isFinite(Number(latLng.longitude))) {
        return `${Number(latLng.latitude)},${Number(latLng.longitude)}`;
      }
      if (Number.isFinite(Number(value.latitude)) && Number.isFinite(Number(value.longitude))) {
        return `${Number(value.latitude)},${Number(value.longitude)}`;
      }
      return "";
    };

    const originText = routeLocationToText(route.origin);
    const destinationText = routeLocationToText(route.destination);
    const isCurrentLocation = ["current_location", "current", "gps", "daqui", "onde estou", "minha localização"].includes(originText.toLowerCase());
    if (!destinationText) { toast("O endereço de destino não foi encontrado. Calcule a rota novamente.", "error"); return; }

    if (action === "route-open-google-maps") {
      const params = new URLSearchParams({api: "1", destination: destinationText});
      if (originText && !isCurrentLocation) params.set("origin", originText);
      const modeMap = {DRIVE:"driving",WALK:"walking",BICYCLE:"bicycling",TWO_WHEELER:"driving",TRANSIT:"transit"};
      params.set("travelmode", modeMap[String(route.travelMode||"DRIVE").toUpperCase()] || "driving");
      window.open("https://www.google.com/maps/dir/?" + params.toString(), "_blank", "noopener,noreferrer");
      return;
    }

    // Waze Deep Links usa busca por texto; o aplicativo abre se instalado, senão abre a versão web.
    const params = new URLSearchParams({q: destinationText, navigate: "yes", utm_source: "LiDire"});
    window.open("https://waze.com/ul?" + params.toString(), "_blank", "noopener,noreferrer");
    return;
  }
  if (action === "route-use-gps") { const input=document.getElementById("route-origin"); if(input){input.value="Minha localização";input.dataset.gps="1";} getCurrentDeviceLocation().then(()=>toast("Localização autorizada. Agora informe o destino.")).catch(err=>toast(err.message,"error")); return; }
  if (action === "toggle-route-destinations") {
    const menu=document.getElementById("route-destination-menu");
    const toggle=el;
    if(menu){
      const willOpen=menu.hidden;
      menu.hidden=!willOpen;
      toggle.setAttribute("aria-expanded",String(willOpen));
      toggle.classList.toggle("open",willOpen);
    }
    return;
  }
  if (action === "route-select-destination") {
    const place=(state.data.lugares||[]).find(x=>x.id===el.dataset.id);
    const input=document.getElementById("route-destination");
    const menu=document.getElementById("route-destination-menu");
    const toggle=document.querySelector('[data-action="toggle-route-destinations"]');
    if(place && input){
      input.value=place.address||"";
      input.dataset.placeId=place.id||"";
      input.dataset.placeName=place.name||"";
      input.focus();
      if(menu) menu.hidden=true;
      if(toggle){toggle.setAttribute("aria-expanded","false");toggle.classList.remove("open");}
    }
    return;
  }
  if (action === "add-lugar") { openPlaceForm(); return; }
  if (action === "edit-lugar") { const place=(state.data.lugares||[]).find(x=>x.id===el.dataset.id); if(place) openPlaceForm(place); return; }
  if (action === "delete-lugar") { const place=(state.data.lugares||[]).find(x=>x.id===el.dataset.id); if(!place)return; if(!confirm(`Excluir o lugar “${place.name}”?`))return; state.data.lugares=state.data.lugares.filter(x=>x.id!==place.id); saveState(); render(); toast("Lugar excluído."); return; }
  if (action === "gestacao-start") { const current=state.data.gestacao?.startDate||""; const d=prompt("Data de início da gestação (DD/MM/AAAA):",current?gestDateBR(current):""); if(d===null)return; const iso=d.trim()?gestDateISO(d):""; if(d.trim()&&!iso){toast("Informe uma data válida no formato DD/MM/AAAA.","error");return;} state.data.gestacao={...(state.data.gestacao||{records:[],exams:[]}),startDate:iso,records:state.data.gestacao?.records||[],exams:state.data.gestacao?.exams||[]};saveState();render();return; }
  if (action === "gestacao-record" || action === "gestacao-weight") { const g=state.data.gestacao||(state.data.gestacao={startDate:"",records:[],exams:[]}); const dateInput=prompt("Data do registro (DD/MM/AAAA):",gestDateBR(todayISO()));if(dateInput===null)return; const date=gestDateISO(dateInput);if(!date){toast("Informe uma data válida no formato DD/MM/AAAA.","error");return;} const symptoms=action==="gestacao-weight"?"Peso":prompt("Sintomas (ex.: náusea, dor de cabeça, inchaço):","");if(symptoms===null)return;const weight=action==="gestacao-weight"?prompt("Peso em kg:",""):prompt("Peso em kg (opcional):","");if(weight===null)return;const intensity=action==="gestacao-weight"?"":prompt("Intensidade (leve, moderada, intensa ou não informada):","não informada");if(intensity===null)return;const mood=action==="gestacao-weight"?"":prompt("Humor/energia física e mental (opcional):","");if(mood===null)return;const notes=prompt("Observações adicionais (opcional):","");if(notes===null)return;g.records.push({id:uid("gestacao"),date,symptoms,weight:weight.trim(),intensity,mood,notes,createdAt:new Date().toISOString()});saveState();render();toast("Registro de gestação salvo.");return; }
  if (action === "gestacao-delete-record") { if(!confirm("Excluir este registro?"))return;state.data.gestacao.records=(state.data.gestacao.records||[]).filter(r=>r.id!==el.dataset.id);saveState();render();return; }
  if (action === "gestacao-exam") { const name=prompt("Nome do exame:","");if(name===null||!name.trim())return;const dateInput=prompt("Data prevista ou realizada (DD/MM/AAAA):",gestDateBR(todayISO()));if(dateInput===null)return;const date=gestDateISO(dateInput);if(!date){toast("Informe uma data válida no formato DD/MM/AAAA.","error");return;}const done=confirm("O exame já foi realizado?\nOK = realizado; Cancelar = pendente.");const notes=prompt("Resultado ou observações (opcional):","");if(notes===null)return;state.data.gestacao.exams.push({id:uid("exame"),name:name.trim(),date,done,notes});saveState();render();return; }
  if (action === "gestacao-toggle-exam") {const e=(state.data.gestacao.exams||[]).find(x=>x.id===el.dataset.id);if(e){e.done=!e.done;saveState();render();}return;}
  if (action === "gestacao-report") {
    const g=state.data.gestacao||{records:[],exams:[]};
    const dbr=v=>{if(!v)return "Não consta";const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v)};
    const records=(g.records||[]).map(r=>`<tr><td>${esc(dbr(r.date))}</td><td>${esc(r.symptoms||"Sintomas não informados")}</td><td>${esc(r.intensity||"Não informada")}</td><td>${esc(r.weight||"Não consta")}${r.weight?" kg":""}</td><td>${esc(r.mood||"Não consta")}</td><td>${esc(r.notes||"Não consta")}</td></tr>`).join("");
    const exams=(g.exams||[]).map(e=>`<tr><td>${esc(e.name||"Não consta")}</td><td>${e.done?"Realizado":"Pendente"}</td><td>${esc(dbr(e.date))}</td><td>${esc(e.notes||"Não consta")}</td></tr>`).join("");
    const w=window.open("","_blank");if(!w){toast("Permita a abertura de janela para gerar o relatório.","error");return;}
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de gestação — LiDire</title><style>body{font:14px Arial,sans-serif;max-width:1100px;margin:24px auto;padding:0 18px;color:#20243a;line-height:1.45}header{display:flex;align-items:center;gap:18px;border-bottom:2px solid #7860ef;padding-bottom:16px;margin-bottom:18px}header img{width:88px;height:auto;object-fit:contain}h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:24px 0 8px;color:#5140b8}p{margin:6px 0}table{width:100%;border-collapse:collapse;table-layout:fixed;overflow-wrap:anywhere;font-size:12px}th,td{border:1px solid #d9dced;padding:8px;text-align:left;vertical-align:top;word-break:break-word}th{background:#f0efff}small{color:#555}@media print{body{margin:10mm auto;padding:0}button{display:none}}</style></head><body><header><img src="${location.origin}/logo-lidire-oficial.png" alt="Logo oficial LiDire"><div><h1>Relatório de gestação — LiDire</h1><p>Organização de dados informados pela usuária.</p></div></header><p><strong>Data de início da gestação:</strong> ${esc(dbr(g.startDate))}</p><p><small>Este relatório não substitui avaliação ou acompanhamento médico.</small></p><h2>Registros e sintomas</h2><table><thead><tr><th>Data</th><th>Sintomas</th><th>Intensidade</th><th>Peso</th><th>Humor/energia</th><th>Observações</th></tr></thead><tbody>${records||'<tr><td colspan="6">Nenhum registro.</td></tr>'}</tbody></table><h2>Exames</h2><table><thead><tr><th>Exame</th><th>Status</th><th>Data</th><th>Observações</th></tr></thead><tbody>${exams||'<tr><td colspan="4">Nenhum exame registrado.</td></tr>'}</tbody></table><script>window.print()<\/script></body></html>`);w.document.close();return;
  }
  if (action === "add-familia") { openFamilyForm(); return; }
  if (action === "add-grupo") { openGroupForm(); return; }
  if (action === "edit-grupo") { const g=(state.data.grupos||[]).find(x=>x.id===el.dataset.id); if(g)openGroupForm(g); return; }
  if (action === "remove-grupo-member") { const group=(state.data.grupos||[]).find(x=>x.id===el.dataset.groupId); if(!group)return; const memberId=el.dataset.memberId; const member=(group.members||[]).find(m=>String(m.id||m.email||"")===String(memberId)); if(!member)return; if(!confirm(`Remover ${member.name||member.email||"este participante"} do grupo?`))return; group.members=(group.members||[]).filter(m=>String(m.id||m.email||"")!==String(memberId)); saveState();render();toast("Participante removido do registro local do grupo.");return; }
  if (action === "delete-grupo") {
    const groupId=String(el.dataset.id||"");
    const invitesOfGroup=(state.data.groupInvitations||[]).filter(i=>String(i.group_id||i.groupId)===groupId);
    if(invitesOfGroup.some(i=>i.direction==="received" && String(i.status||"").toLowerCase()==="pending")){
      toast("Aceite ou recuse o convite pendente deste grupo antes de excluí-lo.","error"); return;
    }
    if(!confirm("Excluir este grupo? Os convites enviados e recebidos dele também serão removidos."))return;
    // Sem remover os convites no servidor, o grupo era recriado a partir deles na consulta seguinte.
    invitesOfGroup.forEach(i=>tombstoneSet(groupInviteTombstones,i.id));
    state.data.groupInvitations=(state.data.groupInvitations||[]).filter(i=>String(i.group_id||i.groupId)!==groupId);
    state.data.grupos=(state.data.grupos||[]).filter(x=>String(x.id)!==groupId);
    saveState();render(true);toast("Grupo excluído.");
    Promise.allSettled(invitesOfGroup.map(i=>apiRequest(`/api/groups/invitations/${encodeURIComponent(i.id)}`,{method:"DELETE",timeoutMs:15000})))
      .then(results=>{
        const failed=results.filter((r,idx)=>r.status==="rejected" && r.reason?.status!==404);
        if(failed.length){ invitesOfGroup.forEach(i=>groupInviteTombstones.delete(String(i.id))); loadGroupInvitationsFromD1().then(()=>render(true)); toast("Alguns convites do grupo não puderam ser removidos do servidor.","error"); }
      });
    return;
  }
  if (action === "delete-familia") {
    const person=(state.data.familia||[]).find(x=>String(x.id)===String(el.dataset.id));
    if(!person) return;
    const serverId=person.serverId?String(person.serverId):"";
    if(!confirm(`Excluir ${person.name||person.email||"esta pessoa"}?${serverId?" O compartilhamento com ela será encerrado.":""}`)) return;
    // Antes a exclusão era só local: o servidor continuava com a pessoa e ela voltava na consulta seguinte.
    const position=(state.data.familia||[]).findIndex(x=>String(x.id)===String(person.id));
    if(serverId) tombstoneSet(familyMemberTombstones,serverId);
    tombstoneSet(familyMemberTombstones,person.id);
    state.data.familia=(state.data.familia||[]).filter(x=>String(x.id)!==String(person.id));
    saveState(); render(true); toast("Pessoa removida.");
    if(serverId){
      apiRequest(`/api/family/members/${encodeURIComponent(serverId)}`,{method:"DELETE",timeoutMs:15000})
        .catch(error=>{
          if(error?.status===404) return;
          familyMemberTombstones.delete(serverId); familyMemberTombstones.delete(String(person.id));
          if(!(state.data.familia||[]).some(x=>String(x.id)===String(person.id))){
            const list=[...(state.data.familia||[])]; list.splice(Math.max(0,position),0,person); state.data.familia=list;
          }
          saveState(); render(true);
          toast(error?.message||"Não foi possível excluir a pessoa. Ela foi mantida na lista.","error");
        });
    }
    return;
  }
  if (action === "edit-familia") { const person=state.data.familia.find(x=>x.id===el.dataset.id); if(person) openFamilyForm(person); return; }
  if (action === "family-invite-link") { const person=state.data.familia.find(x=>x.id===el.dataset.id); if(person) createFamilyInviteFor(person); return; }
  if (action === "resend-group-invite") {
    const inviteId=el.dataset.id;
    const invite=(state.data.groupInvitations||[]).find(i=>String(i.id)===String(inviteId));
    if(!invite){toast("Não foi possível localizar os dados deste convite para reenviar.","error");return;}
    if(!confirm(`Reenviar convite para ${invite.recipient_email||"este participante"}?`)) return;
    apiRequest("/api/groups/invitations",{method:"POST",body:JSON.stringify({
      groupId:invite.group_id||invite.groupId,
      groupName:invite.group_name||invite.groupName||"Grupo",
      recipientEmail:invite.recipient_email||invite.recipientEmail,
      resources:Array.isArray(invite.resources)?invite.resources:[]
    }),timeoutMs:20000})
      .then(async()=>{await loadGroupInvitationsFromD1();await loadFamilyNotifications(false);render();toast("Convite reenviado.","success");})
      .catch(error=>toast(error.message||"Não foi possível reenviar o convite.","error"));
    return;
  }
  if (action === "delete-group-invite") {
    const inviteId=el.dataset.id;
    if(!inviteId || !confirm("Excluir este convite enviado?")) return;
    tombstoneSet(groupInviteTombstones,inviteId);
    state.data.groupInvitations=(state.data.groupInvitations||[]).filter(i=>String(i.id)!==String(inviteId));
    saveState(); render(true);
    apiRequest(`/api/groups/invitations/${encodeURIComponent(inviteId)}`,{method:"DELETE",timeoutMs:15000})
      .then(async()=>{await loadGroupInvitationsFromD1();render();toast("Convite excluído.","success");})
      .catch(async error=>{
        if(error?.status===404){ await loadGroupInvitationsFromD1(); render(true); return; }
        groupInviteTombstones.delete(String(inviteId));
        await loadGroupInvitationsFromD1(); render(true);
        toast(error.message||"Não foi possível excluir o convite.","error");
      });
    return;
  }
  if (action === "respond-group-invite") {
    const inviteId=el.dataset.id; const decision=el.dataset.decision;
    if(!inviteId||!decision)return;
    apiRequest(`/api/groups/invitations/${encodeURIComponent(inviteId)}`,{method:"POST",body:JSON.stringify({decision}),timeoutMs:15000})
      .then(async()=>{await loadGroupInvitationsFromD1();render();toast(decision==="accept"?"Convite de grupo aceito.":"Convite de grupo recusado.","success");})
      .catch(error=>toast(error.message||"Não foi possível responder ao convite.","error"));
    return;
  }
  if (action === "create-family-invite") { openFamilyForm(); return; }
  if (action === "create-group-invite-link") {
    const groups = Array.isArray(state.data.grupos) ? state.data.grupos : [];
    if (!groups.length) { toast("Crie um grupo antes de gerar o convite.", "info"); return; }
    const options = groups.map((g, i) => `${i + 1}. ${g.name}`).join("\n");
    const answer = prompt("Para qual grupo deseja gerar um link?\n" + options, "1");
    if (answer === null) return;
    const group = groups[Number(answer) - 1];
    if (!group) { toast("Selecione um grupo válido.", "error"); return; }
    const link = `${location.origin}/?groupInvite=${encodeURIComponent(group.id)}`;
    if (navigator.share) navigator.share({title:`Convite para ${group.name} na LiDire`, text:`Você foi convidado para o grupo ${group.name}.`, url:link}).catch(() => {});
    else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(() => toast("Link do grupo copiado.", "success")).catch(() => prompt("Copie o link do grupo:", link));
    else prompt("Copie o link do grupo:", link);
    return;
  }
  if (action === "create-promo-link") { createPromoLink(); return; }
  if (action === "invite-copy") {
    const token=el.dataset.token||"";
    navigator.clipboard?.writeText(`${location.origin}/convite?token=${token}`).catch(()=>{});
    toast(false?"Invitation link copied.":"Link do convite copiado.");
    return;
  }
  if (action === "copy-family-invite") {
    navigator.clipboard?.writeText(el.dataset.link||"").catch(()=>{});
    toast(false?"Invitation link copied.":"Link do convite copiado.");
    return;
  }
  if (action === "invite-back") { history.replaceState(null,"",location.pathname); initAuth(); return; }
  if (action === "invite-continue") {
    const token=new URLSearchParams(location.search).get("convite")||"";
    sessionStorage.setItem("lidire_pending_family_invite",token);
    history.replaceState(null,"",location.pathname);
    authMode="login";
    authChecked=true;
    authUser=null;
    clearSharedCachesForAccountChange();
    renderAuth();
    return;
  }
  if (action === "toggle-reminder") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(r){r.paused=!r.paused;saveState();render();toast(r.paused?"Lembrete pausado.":"Lembrete ativado.");} return; }

  /* AUTENTICAÇÃO */

  if (action === "auth-switch") {
    handleAuthSwitch();
    return;
  }

  if (action === "auth-toggle-password") {
    togglePasswordInput("auth-password");
    return;
  }

  if (action === "auth-toggle-password-confirm") {
    togglePasswordInput("auth-password-confirm");
    return;
  }

  if (action === "forgot-password") {
    openPasswordRecovery();
    return;
  }

  if (action === "resend-email-verification") {
    resendEmailVerification();
    return;
  }

  if (action === "reset-toggle-password") {
    togglePasswordInput(el.dataset.target);
    return;
  }

  if (action === "reset-back-login") {
    history.replaceState({ lidire: true }, "", "/");
    authMode = "login";
    authUser = null;
    clearSharedCachesForAccountChange();
    authChecked = true;
    renderAuth();
    return;
  }

  if (action === "go-back") {
    goBack();
    return;
  }

  if (action === "logout") {
    if (!confirm("Deseja sair da sua conta? Você será desconectada deste dispositivo. Seus dados não serão excluídos.")) return;
    logoutLiDire();
    return;
  }

  if (action === "assistant-voice") {
    startAssistantVoice();
    return;
  }

  if (action === "assistant-speak-last") {
    if (lastAssistantResponse && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanAssistantText(lastAssistantResponse));
      utterance.lang = "pt-BR";
      window.speechSynthesis.speak(utterance);
    } else {
      toast("Faça uma pergunta primeiro.", "error");
    }
    return;
  }

  if (action === "open-global-search") {
    openModal("Pesquisar na LiDire", `<label class="form-field"><span>Pesquisar funções, títulos e textos</span><input id="lidire-global-search-input" type="search" placeholder="Ex.: hidratação, compromissos, estudos…" autocomplete="off"></label><div id="lidire-global-search-results" class="lidire-global-search-results"><p class="muted">Digite para pesquisar as áreas e os textos disponíveis no aplicativo.</p></div>`, {submit:"Fechar"});
    const input=modal.querySelector("#lidire-global-search-input"), results=modal.querySelector("#lidire-global-search-results");
    const pages=[...[ ["inicio","Início"],["agenda","Agenda"],["assistente","Assistente LiDire"],["explorar","Explorar"],["perfil","Perfil"],["tarefas","Tarefas"],["compras","Compras"],["estudos","Estudos"],["treinos","Treinos"],["hidratacao","Hidratação"],["alimentacao","Alimentação"],["financas","Finanças"],["objetivos","Objetivos"],["familia","Família"],["ciclo","Ciclo menstrual"],["dados","Exportar meus dados"],["configuracoes","Configurações"],["privacidade","Privacidade e permissões"],["termos","Termos de Uso"],["suporte","Suporte"] ].map(x=>({page:x[0],title:x[1],text:x[1]}))];
    const run=()=>{const q=String(input.value||"").trim().toLocaleLowerCase("pt-BR"); const hits=pages.filter(x=>!q||(x.title+" "+x.text).toLocaleLowerCase("pt-BR").includes(q)).slice(0,12);results.innerHTML=hits.length?hits.map(x=>`<button type="button" class="lidire-global-search-result" data-search-page="${esc(x.page)}"><strong>${esc(x.title)}</strong><span>Abrir seção</span></button>`).join(""):`<p class="muted">Nenhum resultado encontrado. Tente outro termo.</p>`;};
    input.addEventListener("input",run); results.addEventListener("click",e=>{const b=e.target.closest("[data-search-page]");if(b){const pg=b.dataset.searchPage;closeModal();navigateTo(pg);}}); input.focus(); run(); return;
  }

  if (action === "auth-legal") {
    openSignupLegalDocument(String(el.dataset.legal || "termos"));
    return;
  }

  if (action === "assistant-open-module") {
    const page = String(el.dataset.page || "");
    if (page) {
      navigateTo(page);
    }
    return;
  }
  if (action === "recipe-coming-soon") { openRecipeGenerator(); return; }
  if (action === "note-coming-soon" || action === "new-note") { openNoteForm(); return; }
  if (action === "edit-note") { const note=state.data.anotacoes.find(x=>x.id===el.dataset.id); if(note) openNoteForm(note); return; }
  if (action === "delete-note") { deleteNote(el.dataset.id); return; }
  if (action === "toggle-note-favorite") { toggleNoteFavorite(el.dataset.id); return; }
  if (action === "assistant-focus") { startAssistantVoice(); return; }
  if (action === "subscription-coming-soon") { navigateTo("assinaturaUpgrade"); return; }
  if (action === "choose-premium") { toast("O plano Premium foi selecionado. A cobrança será conectada quando o provedor de assinaturas estiver integrado."); return; }
  if (action === "preference-theme") { openThemeSettings(); return; }
  if (action === "export-data") {
    toast("Preparando seus dados pessoais…");
    fetch("/api/account/export", {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: Object.fromEntries(Object.entries({ ...state.user, email: String(state.user?.email || authUser?.email || "").trim().toLowerCase() }).filter(([key]) => !/photo|foto|avatar|image|imagem|base64/i.test(key))),
        data: Object.fromEntries(Object.entries(state.data || {}).filter(([key]) => !["familia", "notificacoesFamilia", "cicloMenstrual", "menstrualCycle", "gestacao", "gravidez"].includes(key))),
        settings: {
          hydrationGoal: state.settings?.hydrationGoal,
          hydrationStart: state.settings?.hydrationStart,
          hydrationEnd: state.settings?.hydrationEnd,
          hydrationIntervalMinutes: state.settings?.hydrationIntervalMinutes,
          calorieGoal: state.settings?.calorieGoal,
          language: state.settings?.language,
          theme: state.settings?.theme
        }
      })
    })
      .then(async response => {
        if (!response.ok) {
          let message = "Não foi possível exportar seus dados.";
          try { const data = await response.json(); message = data.message || message; } catch (_) {}
          throw new Error(message);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const reportWindow = window.open(url, "_blank", "noopener");
        if (!reportWindow) {
          const link = document.createElement("a");
          link.href = url;
          link.download = "lidire-meus-dados.html";
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast("Relatório aberto como arquivo. Abra-o e escolha “Salvar / Exportar como PDF”.");
        } else {
          toast("Relatório aberto. Toque em “Salvar / Exportar como PDF” e escolha salvar como PDF.");
        }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      })
      .catch(error => toast(error.message || "Falha ao exportar os dados.", "error"));
    return;
  }
  if (action === "delete-account") {
    if (!confirm("Excluir definitivamente sua conta e os dados associados? Esta ação não pode ser desfeita.")) return;
    apiRequest("/api/account", { method: "DELETE" })
      .then(() => { clearFamilyPendingSyncForUser(authUser?.id); localStorage.removeItem(STORAGE_KEY); state = clone(defaultState); authUser = null; clearSharedCachesForAccountChange(); authChecked = true; authMode = "login"; renderAuth(); toast("Conta excluída."); })
      .catch(error => toast(error.message || "Não foi possível excluir a conta.", "error"));
    return;
  }

  /* QUICK ADD */

  if (action === "quick-add") {

    openModal(
      "Adicionar rápido",

      `
        <p class="muted" style="grid-column:1/-1;margin-top:-4px;">
          Crie rapidamente um registro sem precisar abrir o menu Explorar.
        </p>

        <div class="quick-actions">

          ${[
            ["compromissos", "▣", "Compromisso"],
            ["tarefas", "✓", "Tarefa"],
            ["compras", "🛒", "Lista de compras"],
            ["alimentacao", "🍽", "Refeição"],
            ["hidratacao", "◉", "Água"],
            ["financas", "R$", "Lançamento"],
            ["treinos", "♢", "Treino"],
            ["objetivos", "◎", "Objetivo"]
          ]
            .map(
              x => `
                <button
                  type="button"
                  class="quick-option"
                  data-action="quick-option"
                  data-key="${x[0]}"
                >
                  <span>${x[1]}</span>
                  ${x[2]}
                </button>
              `
            )
            .join("")}

        </div>
      `,

      {
        submit: "Fechar"
      }
    );

    modal.querySelector(
      ".modal-footer"
    ).style.display = "none";

    return;
  }

  if (action === "quick-option") {

    const key =
      el.dataset.key;

    closeModal();
    addForm(key);

    return;
  }

  if (action === "close-modal") {
    closeModal();
    return;
  }

  if (
    action.startsWith("add-") &&
    action !== "add-item-compra" &&
    action !== "add-study-plan" &&
    action !== "add-dieta" &&
    action !== "add-meta" &&
    action !== "add-exercicio" &&
    action !== "add-periodo-ciclo" &&
    action !== "add-sintoma-ciclo" &&
    action !== "add-workout-on-day"
  ) {

    addForm(
      action.slice(4)
    );

    return;
  }

  /* COMPRAS */

  if (action === "toggle-shopping-list") {
    const id=el.dataset.id;
    expandedShoppingListId = expandedShoppingListId === id ? null : id;
    render();
    return;
  }
  if (action === "save-shopping-list") {
    const list=state.data.compras.find(x=>x.id===el.dataset.id); if(!list)return;
    list.saved=true; list.savedAt=new Date().toISOString();
    if(expandedShoppingListId===list.id) expandedShoppingListId=null;
    saveState(); render(); toast("Lista salva no histórico."); return;
  }
  if (action === "restore-shopping-list") {
    const list=state.data.compras.find(x=>x.id===el.dataset.id); if(!list)return;
    list.saved=false; list.archived=false; delete list.savedAt;
    saveState(); render(); toast("Lista restaurada."); return;
  }
  if (action === "mark-all-shopping-items") {
    const list=state.data.compras.find(x=>x.id===el.dataset.id); if(!list)return;
    const markDone=!(list.items||[]).every(item=>item.done);
    (list.items||[]).forEach(item=>item.done=markDone);
    saveState(); render(); toast(markDone?"Todos os itens marcados como concluídos.":"Conclusões desmarcadas."); return;
  }

  if (action === "open-lista-compras") {
    const listId = el.dataset.id;
    if (!listId) return;
    navigateToShoppingList(listId);
    return;
  }

  if (action === "back-compras") {
    // Voltar da lista interna deve consumir a entrada da própria lista
    // no histórico, retornando à tela de listas em vez da tela anterior
    // (por exemplo, Explorar).
    if (history.state?.lidire && history.state?.shoppingList) {
      history.back();
    } else {
      currentPage = "compras";
      currentShoppingList = null;
      render();
    }
    return;
  }

  if (action === "edit-lista-compras") {
    const lista=state.data.compras.find(x=>x.id===el.dataset.id); if(!lista)return;
    openModal("Editar lista de compras",field("Nome da lista","name","text",lista.name||"","required"),{submit:"Salvar nome"});
    modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const name=String(new FormData(e.target).get("name")||"").trim();if(!name){toast("Digite o nome da lista.","error");return;}lista.name=name;saveState();closeModal();render();toast("Nome da lista atualizado.");};
    return;
  }
  if (action === "merge-shopping-lists") {
    const selected=[...document.querySelectorAll(".shopping-merge-check:checked")].map(x=>x.value);if(selected.length<2){toast("Selecione pelo menos duas listas.","error");return;}openMergeShoppingModal(state.data.compras.filter(x=>selected.includes(x.id)));return;
  }

  if (action === "delete-lista-compras") {

    const id =
      el.dataset.id;

    if (
      !confirm(
        "Excluir esta lista de compras?"
      )
    ) {
      return;
    }

    state.data.compras =
      state.data.compras.filter(
        x => x.id !== id
      );

    saveState();

    render();

    toast(
      "Lista excluída."
    );

    return;
  }

  if (action === "add-item-compra") {
    const listId=el.dataset.id;
    const lista=state.data.compras.find(x=>x.id===listId);
    if (!lista) return;
    const allShoppingItems=(state.data.compras||[]).flatMap(l=>Array.isArray(l.items)?l.items:[]);
    const knownCategories=[...new Set(allShoppingItems.map(i=>String(i.category||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const categoryOptionsId="shopping-category-options";
    const categorySuggestions=knownCategories.length
      ?`<div class="shopping-category-picker"><button type="button" class="shopping-category-toggle" aria-label="Exibir categorias" aria-expanded="false">▾</button><div class="shopping-category-dropdown" hidden>${knownCategories.map(c=>`<button type="button" class="shopping-category-suggestion" data-category="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`
      :`<div class="shopping-category-picker"><button type="button" class="shopping-category-toggle" aria-label="Exibir categorias" aria-expanded="false">▾</button><div class="shopping-category-dropdown" hidden></div></div>`;
    openModal(
      "Adicionar item",
      field("Item","name","text","","required")+
      field("Quantidade","quantity","number","",'min="0" step="0.01"')+
      selectField("Unidade de medida","unit",SHOPPING_UNITS.map(u=>({value:u,label:u})),"UNI")+
      `<small class="muted">Ex.: 1 KG, 500 G, 2 PCT, 1 GARRAFA.</small>`+
      `<div class="shopping-category-field">${field("Categoria","category")}${categorySuggestions}</div>`,
      {submit:"Adicionar"}
    );
    const categoryInput=modal.querySelector('[name="category"]');
    const categoryPicker=modal.querySelector(".shopping-category-picker");
    const categoryToggle=categoryPicker?.querySelector(".shopping-category-toggle");
    const categoryDropdown=categoryPicker?.querySelector(".shopping-category-dropdown");
    categoryToggle?.addEventListener("click",()=>{
      const isOpen=!categoryDropdown.hidden;
      categoryDropdown.hidden=isOpen;
      categoryToggle.setAttribute("aria-expanded",String(!isOpen));
    });
    modal.querySelectorAll(".shopping-category-suggestion").forEach(button=>button.addEventListener("click",()=>{
      categoryInput.value=button.dataset.category||"";
      categoryInput.dispatchEvent(new Event("change",{bubbles:true}));
      categoryDropdown.hidden=true;
      categoryToggle?.setAttribute("aria-expanded","false");
      categoryInput.focus();
    }));
    modal.querySelector("#lidire-form").onsubmit=e=>{
      e.preventDefault();
      const f=new FormData(e.target),quantity=String(f.get("quantity")||"").trim(),unit=normalizeShoppingUnit(f.get("unit"));
      lista.items=lista.items||[];
      const name=String(f.get("name")||"").trim(), category=String(f.get("category")||"").trim();
      const duplicate=(lista.items||[]).find(i=>String(i.name||i.title||"").trim().toLocaleLowerCase("pt-BR")===name.toLocaleLowerCase("pt-BR")&&String(i.category||"").trim().toLocaleLowerCase("pt-BR")===category.toLocaleLowerCase("pt-BR")&&normalizeShoppingUnit(i.unit)===unit&&!i.done);
      if(duplicate) {
        const incoming=quantity?Number(quantity.replace(",",".")):NaN;
        const existing=Number(String(duplicate.quantityValue??duplicate.quantity??"").replace(",","."));
        if(Number.isFinite(incoming)&&Number.isFinite(existing)&&String(duplicate.quantityValue??duplicate.quantity??"").trim()!=="") { const total=existing+incoming; duplicate.quantity=String(formatShoppingNumber(total)); duplicate.quantityValue=total; }
        else { lista.items.push({id:uid("item"),name,quantity,quantityValue:quantity?Number(quantity.replace(",",".")):"",unit,category,done:false}); }
      } else lista.items.push({id:uid("item"),name,quantity,quantityValue:quantity?Number(quantity.replace(",",".")):"",unit,category,done:false});
      saveState();closeModal();render();toast(duplicate?"Item igual encontrado: quantidade atualizada.":"Item adicionado.");
    };
    return;
  }

  if (action === "edit-item-compra") {
    const lista=state.data.compras.find(x=>x.id===el.dataset.listId);
    const item=lista?.items?.find(x=>x.id===el.dataset.id);
    if(!lista||!item)return;
    const parsed=parseQuantity(item.quantity,item.unit);
    const knownCategories=[...new Set((state.data.compras||[]).flatMap(l=>Array.isArray(l.items)?l.items:[]).map(i=>String(i.category||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const categoryOptionsId="shopping-category-options-edit";
    openModal(
      "Editar item",
      field("Item","name","text",item.name||"","required")+
      field("Quantidade","quantity","number",parsed?.value??item.quantity??"",'min="0" step="0.01"')+
      selectField("Unidade de medida","unit",SHOPPING_UNITS.map(u=>({value:u,label:u})),normalizeShoppingUnit(parsed?.unit||item.unit)||"UNI")+
      field("Categoria","category","text",item.category||"")+
      `<datalist id="${categoryOptionsId}">${knownCategories.map(c=>`<option value="${esc(c)}"></option>`).join("")}</datalist>`,
      {submit:"Salvar"}
    );
    modal.querySelector('[name="category"]').setAttribute("list",categoryOptionsId);
    modal.querySelector("#lidire-form").onsubmit=e=>{
      e.preventDefault();
      const f=new FormData(e.target),quantity=String(f.get("quantity")||"").trim(),unit=normalizeShoppingUnit(f.get("unit"));
      item.name=String(f.get("name")||"").trim();item.quantity=quantity;item.quantityValue=quantity?Number(quantity.replace(",",".")):"";item.unit=unit;item.category=f.get("category")||"";
      saveState();closeModal();render();toast("Item atualizado.");
    };
    return;
  }

  if (action === "toggle-item-compra") {

    const lista =
      state.data.compras.find(
        x =>
          x.id ===
          el.dataset.listId
      );

    if (!lista) return;

    const item =
      (lista.items || []).find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    item.done = !item.done;

    saveState();
    render();

    return;
  }

  if (action === "delete-item-compra") {

    const lista =
      state.data.compras.find(
        x =>
          x.id ===
          el.dataset.listId
      );

    if (!lista) return;

    lista.items =
      (lista.items || []).filter(
        x =>
          x.id !==
          el.dataset.id
      );

    saveState();
    render();

    toast(
      "Item removido."
    );

    return;
  }

  if (action === "lista-dieta-para-compras") {
    const lista = state.data.compras.find(x => x.id === el.dataset.id);
    const diet = state.settings.diet;
    if (!lista || !diet?.foods?.length) { toast("Cadastre a dieta primeiro.", "error"); return; }
    const groups = [...new Set(diet.foods.map(f => f.meal || "Todos"))];
    openModal("Importar alimentos da dieta", `
      <p class="muted">Escolha a parte da dieta que deseja importar para esta lista.</p>
      ${selectField("Parte da dieta", "dietPart", groups.map(g => ({value:g,label:g})), "Todos")}
    `, {submit:"Importar"});
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const part = new FormData(e.target).get("dietPart");
      const foods = diet.foods.filter(f => part === "Todos" || (f.meal || "Todos") === part);
      lista.items = lista.items || [];
      foods.forEach(food => {
        const existing = lista.items.find(item => item.name.toLowerCase() === food.name.toLowerCase());
        if (!existing) { const q=String(food.quantity||""); const unit=normalizeShoppingUnit(food.unit); lista.items.push({id:uid("item"), name:food.name, quantity:q, quantityValue:q?Number(q.replace(",",".")):"", unit, category:food.meal || "Dieta", done:false}); }
      });
      saveState(); closeModal(); render(); toast("Alimentos da dieta importados.");
    };
    return;
  }

  /* TAREFAS */

  if (action === "toggle-tarefa") {

    const item =
      state.data.tarefas.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      item.done = !item.done;
    }

    saveState();
    render();

    return;
  }

  if (action === "edit-tarefa") {

    editItem(
      "tarefa",
      el.dataset.id
    );

    return;
  }

  if (action === "edit-compromisso") {

    editItem(
      "compromisso",
      el.dataset.id
    );

    return;
  }

  /* PLANEJAMENTO DE ESTUDOS */

  if (action === "add-study-plan") {
    addStudyPlan();
    return;
  }

  if (action === "toggle-study-plan") {
    const plan = (state.data.studyPlans || []).find(x => x.id === el.dataset.id);
    if (plan) plan.done = !plan.done;
    saveState();
    return;
  }

  if (action === "start-study-session") {
    const plan=(state.data.studyPlans||[]).find(x=>x.id===el.dataset.planId); if(!plan)return;
    const session=studyPlanSessions(plan).find(x=>x.id===el.dataset.sessionId); if(!session)return;
    startStudySessionPomodoro(session,plan);
    return;
  }
  if (action === "toggle-study-session") {
    const plan=(state.data.studyPlans||[]).find(x=>x.id===el.dataset.planId); if(!plan)return;
    const session=studyPlanSessions(plan).find(x=>x.id===el.dataset.sessionId); if(!session)return;
    updateStudySession(plan,session.id,{done:!session.done});
    openStudyPlanSessions(plan);
    toast(!session.done?"Sessão marcada como concluída.":"Sessão reaberta.");
    return;
  }
  if (action === "edit-study-session") {
    const plan=(state.data.studyPlans||[]).find(x=>x.id===el.dataset.planId); if(!plan)return;
    const session=studyPlanSessions(plan).find(x=>x.id===el.dataset.sessionId); if(!session)return;
    editStudySession(plan,session);
    return;
  }
  if (action === "delete-study-session") {
    const plan=(state.data.studyPlans||[]).find(x=>x.id===el.dataset.planId); if(!plan)return;
    const session=studyPlanSessions(plan).find(x=>x.id===el.dataset.sessionId); if(!session)return;
    if(!confirm("Excluir esta sessão de estudo?")) return;
    updateStudySession(plan,session.id,{deleted:true});
    openStudyPlanSessions(plan);
    toast("Sessão excluída.");
    return;
  }

  if (action === "edit-study-plan") {
    const plan = (state.data.studyPlans || []).find(x => x.id === el.dataset.id);
    if (plan) addStudyPlan(plan);
    return;
  }

  if (action === "view-study-sessions") {
    const plan = (state.data.studyPlans || []).find(x => x.id === el.dataset.id);
    if (plan) openStudyPlanSessions(plan);
    return;
  }

  if (action === "delete-study-plan") {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    state.data.studyPlans = (state.data.studyPlans || []).filter(x => x.id !== el.dataset.id);
    saveState();
    render();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
    toast("Planejamento removido.");
    return;
  }

  /* ESTUDOS */

  if (action === "toggle-estudo") {

    const item =
      state.data.estudos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      item.done = !item.done;
    }

    saveState();

    return;
  }

  if (action === "edit-estudo") {

    const item =
      state.data.estudos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    openModal(
      "Editar estudo",

      field(
        "Matéria",
        "subject",
        "text",
        item.subject,
        "required"
      ) +

      field(
        "Assunto",
        "topic",
        "text",
        item.topic || ""
      ) +

      field(
        "Data",
        "date",
        "date",
        item.date || todayISO()
      ) +

      field(
        "Horário",
        "time",
        "time",
        item.time || ""
      ) +

      field(
        "Tempo planejado (min)",
        "duration",
        "number",
        item.duration || "",
        "min=\"0\""
      ) +

      field(
        "Tempo realizado (min)",
        "effectiveDuration",
        "number",
        item.effectiveDuration || "",
        "min=\"0\""
      ) +

      textareaField(
        "Bloco de anotações",
        "notes",
        item.notes || "",
        'class="notes-box" placeholder="Anote de onde parou e informações importantes sobre o assunto."'
      ) +

      field(
        "Link da bibliografia",
        "link",
        "url",
        item.link || ""
      ),

      {
        submit: "Salvar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      Object.assign(
        item,
        {
          subject:
            f.get("subject"),
          topic:
            f.get("topic"),
          date:
            f.get("date") || todayISO(),
          time:
            f.get("time") || "",
          duration:
            f.get("duration"),
          effectiveDuration:
            f.get("effectiveDuration") || "",
          notes:
            f.get("notes"),
          link:
            f.get("link")
        }
      );

      syncManualStudyHistory(item.id, item.effectiveDuration, item.date);
      saveState();
      closeModal();

      toast(
        "Estudo atualizado."
      );
    };

    return;
  }

  /* TREINOS */

  if (action === "add-exercicio") {

    addExerciseForm(
      el.dataset.id
    );

    return;
  }

  if (action === "animate-exercicio") {

    animateExercise(
      el.dataset.id
    );

    return;
  }

  if (action === "edit-exercicio") {

    const treino =
      state.data.treinos.find(
        x =>
          x.id ===
          el.dataset.treinoId
      );

    const exercise =
      treino?.exercises?.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (treino && exercise) {
      addExerciseForm(
        treino.id,
        exercise
      );
    }

    return;
  }

  if (action === "delete-exercicio") {

    const treino =
      state.data.treinos.find(
        x =>
          x.id ===
          el.dataset.treinoId
      );

    if (!treino) return;

    treino.exercises =
      (treino.exercises || [])
        .filter(
          x =>
            x.id !==
            el.dataset.id
        );

    saveState();
    render();

    toast(
      "Exercício removido."
    );

    return;
  }

  /* HIDRATAÇÃO */

  if (action === "quick-water") {

    state.data.hidratacao.push({
      id: uid("h"),
      amount:
        Number(
          el.dataset.value
        ),
      date:
        todayISO(),
      createdAt:
        new Date().toISOString()
    });

    saveState();
    render();

    toast(
      `+${el.dataset.value} ml registrados.`
    );

    return;
  }

  if (action === "config-hidratacao") {

    configHidratacao();
    return;
  }

  if (action === "reset-hidratacao") {

    if (
      confirm(
        "Limpar todos os registros de hidratação?"
      )
    ) {

      state.data.hidratacao =
        state.data.hidratacao.filter(
          x =>
            x.date !==
            todayISO()
        );

      saveState();
      render();

      toast(
        "Registros de hoje limpos."
      );
    }

    return;
  }

  /* ALIMENTAÇÃO */

  if (action === "food-catalog") { openFoodCatalog(); return; }

  if (action === "add-alimentacao") {

    addMealForm();
    return;
  }

  if (action === "edit-refeicao") {

    const meal =
      state.data.alimentacao.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (meal) {
      addMealForm(meal);
    }

    return;
  }

  if (action === "delete-refeicao") {

    removeItem(
      "alimentacao",
      el.dataset.id,
      "Refeição removida."
    );

    return;
  }

  if (action === "config-calorias") {

    configCalorias();
    return;
  }

  if (action === "add-dieta") {

    addDietForm();
    return;
  }

  if (action === "dieta-para-compras") {

    createShoppingListFromDiet();
    return;
  }

  /* FINANÇAS */
  if (action === "edit-financa") { const item=state.data.financas.find(x=>x.id===el.dataset.id); if(!item)return; openFinanceEditModal(item); return; }
  if (action === "finance-monthly-report") { financeMonthlyReport(); return; }
  if (action === "finance-history") { financeHistory(); return; }
  if (action === "report-bug") { openModal("Informar bug",textareaField("Descreva o problema","bug","",'required placeholder="O que aconteceu? Em qual tela?"'),{submit:"Preparar e-mail"}); modal.querySelector("#lidire-form").onsubmit=e=>{e.preventDefault();const msg=new FormData(e.target).get("bug")||"";window.location.href=`mailto:contato@lidire.online?subject=${encodeURIComponent("Bug LiDire")}&body=${encodeURIComponent("Bug LiDire\n\n"+msg)}`;closeModal();};return; }
  if (action === "support-email") { window.location.href="mailto:contato@lidire.online?subject=Contato%20com%20a%20LiDire"; return; }

  if (action === "finance-zero-month") {
    const month = currentFinanceMonth();
    if (confirm("Zerar os lançamentos deste mês na visão atual? O histórico continuará armazenado e poderá ser consultado em Histórico.")) {
      if (!state.settings.financeMonthResets) state.settings.financeMonthResets = {};
      state.settings.financeMonthResets[month] = new Date().toISOString();
      saveState(); render(); toast("Mês zerado. O histórico foi preservado.");
    }
    return;
  }

  if (action === "config-tetos") {

    configFinanceLimits();
    return;
  }

  /* OBJETIVOS */

  if (action === "add-meta") {

    addMeta(
      el.dataset.id
    );

    return;
  }

  if (action === "toggle-meta") {

    const goal =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.goalId
      );

    if (!goal) return;

    const meta =
      (goal.metas || []).find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!meta) return;

    meta.done =
      !meta.done;
    updateGoalProgress(goal);

    saveState();
    render();

    return;
  }

  if (action === "progress-objetivo") {

    const item =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (!item) return;

    openModal(
      "Atualizar progresso",

      field(
        "Progresso (%)",
        "progress",
        "number",
        item.progress || 0,
        'min="0" max="100" required'
      ),

      {
        submit: "Atualizar"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      item.progress =
        Number(
          f.get("progress")
        );

      saveState();
      closeModal();
      render();

      toast(
        "Progresso atualizado."
      );
    };

    return;
  }

  if (action === "delete-objetivo") {
    confirmDeleteGoal(el.dataset.id);
    return;
  }

  if (action === "confirm-delete-objetivo") {
    const item = state.data.objetivos.find(x => x.id === el.dataset.id);
    if (!item) { closeModal(); return; }
    state.data.objetivos = state.data.objetivos.filter(x => x.id !== item.id);
    saveState();
    closeModal();
    render();
    toast("Objetivo removido.");
    return;
  }

  if (action === "cancel-delete-objetivo") {
    closeModal();
    return;
  }

  if (action === "edit-objetivo") {

    const item =
      state.data.objetivos.find(
        x =>
          x.id ===
          el.dataset.id
      );

    if (item) {
      openGoalForm(item);
    }

    return;
  }

  /* FAMÍLIA */

  if (action === "edit-familia") {
    const person = state.data.familia.find(x => x.id === el.dataset.id);
    if (!person) return;
    openModal(
      "Editar pessoa",
      field("Nome", "name", "text", person.name || "", "required") +
      field("Relação", "relation", "text", person.relation || "") +
      field("E-mail", "email", "email", person.email || "")+
      field("Endereço", "address", "text", person.address || ""),
      { submit: "Salvar alterações" }
    );
    modal.querySelector("#lidire-form").onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      person.name = String(f.get("name") || "").trim();
      person.relation = String(f.get("relation") || "").trim();
      person.email = String(f.get("email") || "").trim();
      person.address = String(f.get("address") || "").trim();
      if (!person.name) { toast("Informe o nome.", "error"); return; }
      saveState(); closeModal(); render(); toast("Pessoa atualizada.");
    };
    return;
  }

  if (action === "connect-google") { openGoogleConnection(); return; }
  if (action === "gmail-connect") { if (providerConnections.gmail) openGmailInbox(); else connectGmail(); return; }
  if (action === "gmail-inbox") { openGmailInbox(); return; }
  if (action === "gmail-rules") { openGmailImportantSenders(); return; }
  if (action === "gmail-rule-delete") { apiRequest(`/api/gmail/important-senders/${encodeURIComponent(el.dataset.id)}`,{method:"DELETE"}).then(()=>openGmailImportantSenders()).catch(e=>toast(e.message||"Não foi possível remover.","error")); return; }
  if (action === "gmail-disconnect") {
    if (!confirm("Desconectar o Gmail da LiDire? Os lembretes já criados serão mantidos.")) return;
    apiRequest("/api/connections/gmail",{method:"DELETE"}).then(()=>{providerConnections.gmail=false;render();toast("Gmail desconectado.");}).catch(e=>toast(e.message||"Não foi possível desconectar.","error")); return;
  }
  if (action === "gmail-create-reminder") {
    const item=gmailMessages[Number(el.dataset.index)]; if(!item) { toast("E-mail não encontrado.","error"); return; }
    const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1); const date=`${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`;
    if(!Array.isArray(state.data.lembretes)) state.data.lembretes=[];
    state.data.lembretes.push({id:uid("r"),title:`Responder e-mail: ${item.subject}`.slice(0,180),date,time:"09:00",message:`E-mail de ${item.from}. Confira a mensagem no Gmail e responda se necessário.`,paused:false,repeat:"none",sourceType:"gmail"});
    saveState(); closeModal(); render(); toast("Lembrete criado para amanhã às 09:00."); return;
  }
  if (action === "connect-apple") { openAppleConnection(); return; }

  if (action === "request-notification-permission") { requestNotificationPermission(); return; }
  if (action === "toggle-notifications") {
    if (el.checked) {
      state.settings.notifications.enabled = true;
      saveState();
      if ("Notification" in window && Notification.permission !== "granted") {
        requestNotificationPermission().then(()=>{ if (Notification.permission !== "granted") { state.settings.notifications.enabled=false; saveState(); render(); } });
      } else {
        toast("Notificações de lembretes ativadas.");
      }
    } else {
      state.settings.notifications.enabled = false;
      saveState();
      toast("Notificações de lembretes desativadas.");
    }
    return;
  }
  if (action === "test-reminder") { testReminderNotification(); return; }
  if (action === "start-reminder-recording") { startReminderVoiceRecording(); return; }
  if (action === "stop-reminder-recording") { stopReminderVoiceRecording(); return; }
  if (action === "play-reminder-voice") { playSavedReminderVoice(); return; }
  if (action === "delete-reminder-voice") { state.settings.notifications.voiceDataUrl = ""; saveState(); render(); toast("Mensagem de voz excluída."); return; }
  if (action === "save-notification-settings") {
    const form = el.closest(".content-card")?.querySelector("#lidire-form");
    if (form) {
      const f = new FormData(form);
      state.settings.notifications.mode = "audio_text";
      state.settings.notifications.audioId = String(f.get("notificationAudio") || "builtin-alarm-30s");
      state.settings.notifications.title = String(f.get("notificationTitle") || "LiDire — Lembrete");
      state.settings.notifications.message = String(f.get("notificationMessage") || "Hora do seu lembrete.");
      state.settings.notifications.sound = true;
    } else {
      // Fallback: this page is rendered without a surrounding modal form.
      const mode = document.querySelector('[name="notificationMode"]');
      const title = document.querySelector('[name="notificationTitle"]');
      const message = document.querySelector('[name="notificationMessage"]');
      const sound = document.querySelector('[name="notificationSound"]');
      const audio = document.querySelector('[name="notificationAudio"]');
      state.settings.notifications.mode = "audio_text";
      if (audio) state.settings.notifications.audioId = audio.value;
      if (title) state.settings.notifications.title = title.value;
      if (message) state.settings.notifications.message = message.value;
      state.settings.notifications.sound = true;
    }
    saveState(); toast("Configurações de notificações salvas."); return;
  }
  if (action === "diet-library") { navigateTo("dietLibrary"); return; }
  if (action === "audio-library") { navigateTo("audioLibrary"); return; }
  if (action === "new-reminder") { openReminderForm(); return; }
  if (action === "create-reminder") { createReminderFor(el.dataset.source,el.dataset.id); return; }
  if (action === "view-study-subject") { openStudySubjectDetails(el.dataset.planId, el.dataset.subjectId); return; }
  if (action === "toggle-study-topic") {
    const plan = (state.data.studyPlans || []).find(x => String(x.id) === String(el.dataset.planId));
    const subject = plan && (plan.subjects || []).find(x => String(x.id) === String(el.dataset.subjectId));
    const topic = subject && (subject.topics || []).find(x => String(x.id) === String(el.dataset.topicId));
    if (!plan || !subject || !topic) return;
    topic.done = topic.done !== true;
    // Um assunto pode aparecer em várias sessões recorrentes. Marcar o assunto
    // como concluído não deve concluir todas as ocorrências e preencher o gráfico.
    // Vincula a ação a, no máximo, uma sessão da semana atual correspondente ao assunto.
    const overrides = ensureStudySessionOverrides(plan);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekStartISO = localDateISO(weekStart);
    const weekEndISO = localDateISO(weekEnd);
    const matchingSessions = studyPlanSessions(plan, true)
      .filter(session => !session.deleted && String(session.topicId || "") === String(topic.id || ""))
      .sort((a, b) => a.date.localeCompare(b.date));
    const currentWeekSession = matchingSessions.find(session => session.date >= weekStartISO && session.date <= weekEndISO);
    if (currentWeekSession) {
      overrides[currentWeekSession.id] = {
        ...(overrides[currentWeekSession.id] || {}),
        done: topic.done
      };
    }
    saveState();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    closeModal();
    render();
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      openStudySubjectDetails(plan.id, subject.id);
    });
    toast(topic.done ? "Assunto marcado como concluído." : "Assunto marcado como pendente.");
    return;
  }
  if (action === "delete-study-subject") {
    const plan = (state.data.studyPlans || []).find(x => String(x.id) === String(el.dataset.planId));
    if (!plan) return;
    const subject = (plan.subjects || []).find(x => String(x.id) === String(el.dataset.id));
    if (!subject) return;
    if (!confirm(`Excluir a matéria "${subject.name || "Matéria"}" e todos os seus assuntos?`)) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    plan.subjects = (plan.subjects || []).filter(x => String(x.id) !== String(el.dataset.id));
    saveState();
    render();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
    toast("Matéria excluída.");
    return;
  }
  if (action === "toggle-study-subject-reminder") {
    const subjectId=String(el.dataset.id||"");
    const reminder=(state.data.lembretes||[]).find(r=>String(r.sourceType||"")==="estudo-materia"&&String(r.sourceId||"")===subjectId);
    const subject=findStudySubjectById(subjectId);
    if(reminder) openReminderForm(reminder);
    else if(subject) openReminderForm({sourceType:"estudo-materia",sourceId:subjectId,sourceName:subject.name||"Matéria de estudo"});
    return;
  }
  if (action === "preview-reminder-audio") {
    const select = modal && modal.querySelector('[name="audioId"]');
    const audioId = String(select?.value || "");
    if (audioId && typeof playSavedReminderVoice === "function") {
      playSavedReminderVoice(audioId);
    } else if (typeof playLiDireNotificationSound === "function") {
      playLiDireNotificationSound();
    }
    return;
  }

  if (action === "snooze-reminder") { snoozeReminder(el.dataset.id, Number(el.dataset.minutes||5)); return; }
  if (action === "edit-reminder") { const r=state.data.lembretes.find(x=>x.id===el.dataset.id); if(r) openReminderForm(r); return; }
  if (action === "delete-reminder") { const scrollY=window.scrollY||window.pageYOffset||0; state.data.lembretes=state.data.lembretes.filter(x=>String(x.id)!==String(el.dataset.id)); saveState(); render(true); requestAnimationFrame(()=>window.scrollTo({top:scrollY,behavior:"auto"})); toast("Lembrete removido."); return; }
  if (action === "play-audio") { playSavedReminderVoice(el.dataset.id); return; }
  if (action === "pause-audio" || action === "pause-reminder-voice") { if(currentReminderAudio) currentReminderAudio.pause(); return; }
  if (action === "stop-audio" || action === "stop-reminder-voice") { if(currentReminderAudio){currentReminderAudio.pause();currentReminderAudio.currentTime=0;} return; }
  if (action === "rename-audio") { const a=state.data.audios.find(x=>x.id===el.dataset.id); if(a){const n=prompt("Novo nome do áudio:",a.name);if(n?.trim()){a.name=n.trim();saveState();render();toast("Áudio renomeado.");}} return; }
  if (action === "delete-audio") { if(!confirm("Excluir este áudio?"))return; state.data.audios=state.data.audios.filter(x=>x.id!==el.dataset.id); saveState(); render(); toast("Áudio excluído."); return; }
  if (action === "use-diet") { const d=state.data.dietas.find(x=>x.id===el.dataset.id); if(d){state.settings.diet=clone(d);saveState();navigateTo("alimentacao");toast("Dieta selecionada.");} return; }
  if (action === "edit-diet") { editDiet(el.dataset.id); return; }
  if (action === "delete-diet") { if(!confirm("Excluir esta dieta da biblioteca?"))return;state.data.dietas=state.data.dietas.filter(x=>x.id!==el.dataset.id);saveState();render();toast("Dieta excluída.");return; }
  if (action === "workout-history-open") { workoutHistoryView=true; render(); return; }
  if (action === "workout-history-back") { workoutHistoryView=false; render(); return; }
  if (action === "add-workout-on-day") { const selectedDate=el.dataset.date||todayISO(); workoutPrefillDate=selectedDate; addForm("treinos"); const dateField=modal?.querySelector('[name="date"]'); if(dateField) dateField.value=selectedDate; workoutPrefillDate=""; return; }
  if (action === "workout-analysis-mode") { workoutAnalysisMode=el.dataset.mode||"volume"; render(); return; }
  if (action === "workout-type-pick") { const input=modal?.querySelector('[name="type"]'); const box=modal?.querySelector(".workout-type-suggestions"); if(input){if(el.dataset.type==="Digitar"){input.readOnly=false;input.placeholder="Digite o tipo de treino";input.value="";input.focus();}else{input.value=el.dataset.type;input.readOnly=true;} box?.classList.add("is-hidden");} return; }
  if (action === "workout-week-prev") { workoutWeekOffset--; render(); return; }
  if (action === "workout-week-next") { workoutWeekOffset++; render(); return; }
  if (action === "workout-week-today") { workoutWeekOffset=0; render(); return; }
  if (action === "copy-workout") { copyWorkoutForm(el.dataset.id); return; }
  if (action === "toggle-exercises") { const id=String(el.dataset.id); if(expandedWorkoutIds.has(id)) expandedWorkoutIds.delete(id); else expandedWorkoutIds.add(id); render(); return; }
  if (action === "complete-exercicio") { const t=state.data.treinos.find(x=>x.id===el.dataset.treinoId); const ex=t?.exercises?.find(x=>x.id===el.dataset.id); if(t&&ex){ex.completed=!ex.completed; const allDone=(t.exercises||[]).length>0&&t.exercises.every(x=>x.completed); if(allDone){t.completed=true;t.completedAt=new Date().toISOString();}else if(!ex.completed){t.completed=false;t.completedAt="";} saveState();render();toast(allDone?"Último exercício concluído: treino marcado como concluído.":ex.completed?"Exercício concluído.":"Exercício reaberto.");} return; }
  if (action === "toggle-treino") { const t=state.data.treinos.find(x=>x.id===el.dataset.id); if(t){t.completed=!t.completed;t.completedAt=t.completed?new Date().toISOString():"";saveState();render();toast(t.completed?"Treino marcado como concluído.":"Treino voltou para planejado.");} return; }
  if (action === "edit-treino") { const t=state.data.treinos.find(x=>x.id===el.dataset.id); if(t) editWorkoutForm(t); return; }
  if (action === "animate-exercicio") { animateExercise(el.dataset.id); return; }

  if (action === "start-study-focus") { togglePomodoro(); return; }
  if (action === "reset-study-focus") { resetPomodoro(); return; }
  if (action === "set-study-focus") { setPomodoroTime(); return; }
  if (action === "open-pomodoro-details") { openPomodoroDetails(); return; }
  if (action === "open-pomodoro-history") { openPomodoroHistory(); return; }
  if (action === "zero-pomodoro-total") {
    if (!confirm("Zerar todo o tempo contabilizado do Pomodoro?")) return;
    state.data.pomodoroHistory=[];
    pomodoroState.accumulated=0;
    activeStudySession=null;
    saveState();
    syncPomodoroDisplay();
    const focusEl=document.getElementById("pomodoro-focus-total");
    if(focusEl) focusEl.textContent="0h 0m";
    toast("Tempo total do Pomodoro zerado.");
    return;
  }
  if (action === "delete-pomodoro-history") {
    const id = String(el.dataset.id || "");
    if (!id) return;
    const history = ensurePomodoroHistory();
    const index = history.findIndex(x => String(x.id) === id);
    if (index < 0) return;
    if (!confirm("Excluir este registro do histórico do Pomodoro?")) return;
    history.splice(index, 1);
    saveState();
    syncPomodoroDisplay();
    openPomodoroHistory();
    toast("Registro excluído do histórico.");
    return;
  }
  if (action === "clear-pomodoro-history") {
    if (!confirm("Limpar todo o histórico do Pomodoro?")) return;
    state.data.pomodoroHistory=[];
    saveState();
    closeModal();
    syncPomodoroDisplay();
    render();
    toast("Histórico do Pomodoro limpo.");
    return;
  }

  /* CICLO MENSTRUAL */

  if (action === "config-ciclo") {
    configCicloMenstrual();
    return;
  }

  if (action === "add-periodo-ciclo") {
    addPeriodoCiclo();
    return;
  }

  if (action === "add-sintoma-ciclo") {
    addSintomaCiclo(el.dataset.mood || "");
    return;
  }

  if (action === "edit-periodo-ciclo") {
    editPeriodoCiclo(el.dataset.id);
    return;
  }

  if (action === "edit-sintoma-ciclo") {
    editSintomaCiclo(el.dataset.id);
    return;
  }

  if (action === "delete-sintoma-ciclo") {
    if (!confirm("Excluir este registro do ciclo?")) return;
    state.data.cicloMenstrual.sintomas = state.data.cicloMenstrual.sintomas.filter(x => x.id !== el.dataset.id);
    saveState();
    render();
    toast("Registro removido.");
    return;
  }

  if (action === "cycle-view-history") {
    const lang=false;
    const rows=[...(state.data.cicloMenstrual?.periodos||[])].sort((a,b)=>String(b.start).localeCompare(String(a.start)));
    openModal(lang?"Cycle history":"Histórico do ciclo", rows.length?rows.map(r=>`<div class="list-item"><div class="item-main"><strong>${dateBR(r.start)}</strong><span>${r.end?`${lang?"to":"até"} ${dateBR(r.end)}`:""} · ${esc(r.flow|| (lang?"Flow not informed":"Fluxo não informado"))}</span></div></div>`).join(""):`<p class="muted">${lang?"No cycle records yet.":"Nenhum registro de ciclo ainda."}</p>`,{submit:lang?"Close":"Fechar"});
    return;
  }

  if (action === "toggle-cycle-ai") {
    state.settings.cycleAiContext = !!el.checked;
    saveState();
    toast(el.checked ? "Uso do ciclo pela IA autorizado." : "Uso do ciclo pela IA desativado.");
    return;
  }

  /* ASSISTENTE */

  if (action === "assistant-question") {
    answerAssistant(el.dataset.question || "", false);
    return;
  }

  /* PERFIL */

  if (
    action ===
    "edit-profile"
  ) {

    openModal(
      "Editar perfil",

      field(
        "Nome",
        "name",
        "text",
        state.user.name,
        "required"
      ) +

      field(
        "E-mail",
        "email",
        "email",
        state.user.email || ""
      ) +

      field(
        "Data de nascimento",
        "birth_date",
        "date",
        state.user.birth_date || "",
        'max="' + todayISO() + '"'
      ) +

      field(
        "Endereço",
        "address",
        "text",
        state.user.address || ""
      ),

      {
        submit: "Salvar perfil"
      }
    );

    modal.querySelector(
      "#lidire-form"
    ).onsubmit = async e => {

      e.preventDefault();

      const f =
        new FormData(e.target);

      const profileData = Object.fromEntries(f.entries());
      if (String(profileData.email || "").trim().toLowerCase() !== String(state.user.email || "").trim().toLowerCase()) {
        toast("Por segurança, a alteração de e-mail está temporariamente indisponível até implementarmos a confirmação do novo endereço.", "error");
        return;
      }

      try {
        const response = await apiRequest("/api/profile", {
          method: "PUT",
          body: JSON.stringify({ ...profileData, birth_date: profileData.birth_date || "" })
        });
        if (response.user) syncUserToState(response.user);
        else {
          state.user = { ...state.user, ...profileData };
          saveState();
        }
        closeModal();
        render();
        toast("Perfil atualizado.");
      } catch (error) {
        state.user = { ...state.user, ...profileData };
        saveState();
        closeModal();
        render();
        toast(error.message || "Perfil atualizado localmente.");
      }
    };

    return;
  }

  if (
    action === "profile-photo" ||
    action === "photo-profile"
  ) {

    profilePhotoModal();
    return;
  }

  if (action === "delete-profile-photo") {
    if (confirm("Excluir sua foto de perfil?")) {
      state.user.photo = "";
      saveState();
      apiRequest("/api/profile", { method: "PUT", body: JSON.stringify({name: state.user.name, email: state.user.email, age: state.user.age, birth_date: state.user.birth_date || "", phone: state.user.phone, address: state.user.address, profile_photo: ""}) })
        .then(response => { if (response.user) syncUserToState(response.user); })
        .catch(error => toast(error.message || "Não foi possível remover a foto do servidor.", "error"))
        .finally(() => { closeModal(); render(); });
      toast("Foto de perfil excluída.");
    }
    return;
  }

  /* EXCLUSÕES */

  const deletes = {
    "delete-compromisso": [
      "compromissos",
      "Compromisso removido."
    ],

    "delete-tarefa": [
      "tarefas",
      "Tarefa removida."
    ],

    "delete-estudo": [
      "estudos",
      "Registro removido."
    ],

    "delete-treino": [
      "treinos",
      "Treino removido."
    ],

    "delete-hidratacao": [
      "hidratacao",
      "Registro removido."
    ],

    "delete-financa": [
      "financas",
      "Lançamento removido."
    ],

    "delete-familia": [
      "familia",
      "Pessoa removida."
    ]
  };

  if (deletes[action]) {

    removeItem(
      deletes[action][0],
      el.dataset.id,
      deletes[action][1]
    );

    return;
  }

  /* RESET */

  if (
    action ===
    "clear-local"
  ) {

    if (
      confirm(
        "Isso apagará os dados salvos neste dispositivo. Continuar?"
      )
    ) {

      state =
        clone(defaultState);

      saveState();

      currentPage =
        "inicio";

      currentShoppingList =
        null;

      render();

      toast(
        "Dados locais redefinidos."
      );
    }
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener("input", event => {
  const input = event.target;
  if (input && ["currentSecret", "secret", "secretConfirm"].includes(input.name)) {
    input.value = String(input.value || "").replace(/\D/g, "").slice(0, 6);
  }
  if (input && input.id === "app-lock-secret") {
    input.value = String(input.value || "").replace(/\D/g, "").slice(0, 6);
  }
});

document.addEventListener("submit", async event => {
  if (event.target && event.target.id === "auth-form") {
    event.preventDefault();
    submitAuth(event.target);
    return;
  }
  if (event.target && event.target.id === "change-account-password-form") {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") || "");
    const newPassword = String(data.get("newPassword") || "");
    const confirmation = String(data.get("newPasswordConfirm") || "");
    if (currentPassword.length < 8) { toast("Informe sua senha atual.", "error"); return; }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      toast("A nova senha precisa ter 8 caracteres, maiúscula, minúscula, número e caractere especial.", "error");
      return;
    }
    if (newPassword !== confirmation) { toast("As novas senhas não coincidem.", "error"); return; }
    if (currentPassword === newPassword) { toast("A nova senha deve ser diferente da senha atual.", "error"); return; }
    const button = form.querySelector("button[type=submit]");
    if (button) { button.disabled = true; button.textContent = "Salvando…"; }
    try {
      await apiRequest("/api/password-change", {
        method:"POST",
        timeoutMs:20000,
        body:JSON.stringify({ currentPassword, newPassword })
      });
      form.reset();
      toast("Senha de cadastro alterada com sucesso.");
      navigateTo("perfil");
    } catch (error) {
      toast(error?.status === 401 ? "A senha atual está incorreta." : (error?.message || "Não foi possível alterar a senha."), "error");
      if (button) { button.disabled = false; button.textContent = "Salvar nova senha"; }
    }
    return;
  }
  if (event.target && event.target.id === "app-lock-settings-form") {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const currentSecret = String(data.get("currentSecret") || "").trim();
    const secret = String(data.get("secret") || "").trim();
    const secretConfirm = String(data.get("secretConfirm") || "").trim();
    if (secret && !/^\d{4,6}$/.test(secret)) { toast("O PIN deve ter de 4 a 6 dígitos.", "error"); return; }
    if (secret && secret !== secretConfirm) { toast("Os PINs não coincidem.", "error"); return; }
    if (!appLock.configured && !secret) { toast("Informe um PIN de 4 a 6 dígitos.", "error"); return; }
    if (currentSecret && !/^\d{4,6}$/.test(currentSecret)) { toast("O PIN atual deve ter de 4 a 6 dígitos.", "error"); return; }
    apiRequest("/api/security/app-lock", { method: "PUT", body: JSON.stringify({ enabled: true, currentSecret, secret }) })
      .then(data => {
        appLock.configured = !!data.configured;
        appLock.enabled = !!data.enabled;
        appLock.unlocked = true;
        render();
        toast(appLock.configured ? "Configuração de segurança salva." : "Bloqueio configurado.");
      })
      .catch(error => toast(error?.message || "Não foi possível salvar a configuração.", "error"));
    return;
  }
  if (event.target && event.target.id === "password-reset-form") {
    event.preventDefault();
    const token = new URLSearchParams(location.search).get("redefinir") || "";
    submitPasswordReset(event.target, token);
    return;
  }
  if (event.target && event.target.id === "assistant-question-form") {
    event.preventDefault();
    const input = document.getElementById("assistant-question-input");
    answerAssistant(input?.value || "", false);
  }
});

document.addEventListener(
  "click",
  event => {

    const pageEl =
      event.target.closest(
        "[data-page]"
      );

    if (pageEl) {

      event.preventDefault();

      navigateTo(pageEl.dataset.page);

      return;
    }

    const actionEl =
      event.target.closest(
        "[data-action]"
      );

    if (actionEl) {

      // Checkboxes (ex.: IA do ciclo, notificações) precisam manter o
      // comportamento nativo; preventDefault desfazia a marcação.
      const isToggleInput = actionEl.tagName === "INPUT" && ["checkbox", "radio"].includes(actionEl.type);
      if (!isToggleInput) event.preventDefault();

      handleAction(
        actionEl.dataset.action,
        actionEl
      );
    }
  }
);

document.addEventListener(
  "click",
  event => {

    if (
      event.target.classList.contains(
        "modal-backdrop"
      )
    ) {
      closeModal();
    }
  }
);

window.addEventListener("popstate", event => {
  const statePage = event.state?.page;
  const hashValue = location.hash ? decodeURIComponent(location.hash.slice(1)) : "inicio";
  const hashPage = hashValue.startsWith("compras/") ? "compras" : hashValue;
  const page = statePage || hashPage || "inicio";
  currentPage = pages[page] ? page : "inicio";
  currentShoppingList = event.state?.shoppingList ? String(event.state.shoppingList) : (hashValue.startsWith("compras/") ? hashValue.slice("compras/".length) : null);
  if (currentPage !== "compras") currentShoppingList = null;
  render();
});

/* =========================================================
   API PÚBLICA DA LIDIRE
   ========================================================= */

window.LiDire = {

  state: () => state,

  save: saveState,

  go: page => {

    navigateTo(page);
  },

  reset: () => {

    if (
      confirm(
        "Redefinir todos os dados da LiDire?"
      )
    ) {

      state =
        clone(defaultState);

      saveState();

      currentPage =
        "inicio";

      render();
    }
  }

};

/* =========================================================
   PROTEÇÃO CONTRA ERROS DE INICIALIZAÇÃO
   ========================================================= */

window.addEventListener("error", event => {
  console.error("Erro na LiDire:", event.error || event.message);
  const root = document.getElementById("app");
  if (root && !root.innerHTML.trim()) {
    root.innerHTML = `
      <div class="auth-screen">
        <section class="auth-card">
          <div class="auth-brand"><strong>LiDire</strong></div>
          <h1 class="auth-title">Não foi possível carregar a LiDire.</h1>
          <p class="auth-subtitle">Atualize a página. Se o problema continuar, envie esta tela para análise.</p>
          <button class="primary-button" onclick="location.reload()">Atualizar página</button>
        </section>
      </div>`;
  }
});

window.addEventListener("unhandledrejection", event => {
  console.error("Erro assíncrono na LiDire:", event.reason);
});

/* =========================================================
   LEMBRETES — áudio, foco e retorno ao aplicativo
   ========================================================= */
function handleLiDireUserGesture() {
  if (window.__lidireAudioUnlocked) return;
  window.__lidireAudioUnlocked = true;
  unlockLiDireNotificationAudio();
}
["pointerdown","touchstart","keydown"].forEach(eventName => {
  window.addEventListener(eventName, handleLiDireUserGesture, { passive: true });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    ensureLiDireAudioContext();
    checkDueReminders();
    retryPendingFamilySync();
  }
});
window.addEventListener("focus", () => {
  ensureLiDireAudioContext();
  checkDueReminders();
});
window.addEventListener("pageshow", () => {
  ensureLiDireAudioContext();
  checkDueReminders();
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */


document.addEventListener(
  "DOMContentLoaded",
  () => {

    injectLiDireStyles();
    applyTheme();
    if (!history.state?.lidire) history.replaceState({ page: currentPage, lidire: true, shoppingList: null }, "", "#inicio");
    initAuth();
    startReminderScheduler();

  }
);


/* CORREÇÃO DIRETA: navegação do botão Tarefas
   Este listener usa a fase de captura para garantir que o botão
   inferior e os cards com data-page="tarefas" sempre naveguem. */
document.addEventListener("click", function(e){
  const tasksBtn = e.target.closest('[data-page="tarefas"]');
  if (!tasksBtn) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (currentPage !== "tarefas") {
    navigateTo("tarefas");
  }
}, true);

/* CORREÇÃO DIRETA — botão Registrar ciclo */
document.addEventListener("click", function(e){
  const cycleBtn = e.target.closest('[data-action="add-periodo-ciclo"]');
  if (!cycleBtn) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (!authUser) {
    toast("Entre na sua conta para registrar um ciclo.", "error");
    return;
  }
  try {
    addPeriodoCiclo();
  } catch (error) {
    console.error("Erro ao abrir o registro do ciclo:", error);
    toast("Não foi possível abrir o registro do ciclo.", "error");
  }
}, true);

document.addEventListener("click",function(e){
  const btn=e.target.closest('[data-preview-reminder-audio="1"]');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  const select=btn.closest("form, .modal, .modal-card")?.querySelector('[name="audioId"]') || document.querySelector('[name="audioId"]');
  const audioId=String(select?.value||"");
  try{
    stopReminderPreviewAudio();
    if(audioId && typeof playSavedReminderVoice==="function"){
      playSavedReminderVoice(audioId);
    }else if(typeof playLiDireNotificationSound==="function"){
      playLiDireNotificationSound();
    }
  }catch(err){
    if(typeof toast==="function")toast("Não foi possível reproduzir a prévia.");
  }
},true);
