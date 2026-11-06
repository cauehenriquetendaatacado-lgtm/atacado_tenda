const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool, types } = require("pg");
const ExcelJS = require("exceljs");

// O driver do Postgres devolve colunas "numeric" como texto (para não perder
// precisão). Isso fazia o valor recuperado virar string e quebrar as somas em
// reais no painel (ex: 0 + "1935.00" virava o texto "01935.00" em vez de somar).
// Aqui forçamos a conversão para número sempre que o Postgres devolver um
// campo numeric (OID 1700).
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

// O driver do Postgres também devolvia colunas "date" (OID 1082) já convertidas
// em objeto Date do JS. Ao virar JSON, esse Date era serializado como
// "2026-09-04T00:00:00.000Z", e o front-end (que espera "AAAA-MM-DD") cortava
// esse texto errado, mostrando datas quebradas tipo "04T00:00:00.000Z/09/2026".
// Aqui mantemos a data como veio do banco, em texto puro "AAAA-MM-DD".
types.setTypeParser(1082, (val) => val);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;
const SENHA = process.env.SENHA_PAINEL || "tenda123@";
const SENHA_ADMIN = process.env.SENHA_ADMIN || "admin123@";
const SENHA_GERENCIA = process.env.SENHA_GERENCIA || "gerencia123@";
// Login do Caue (acesso total: tudo do administrador + Backup + Configurações).
// Entra informando usuário + senha. Pode ser trocado por variáveis de ambiente
// ou, depois de logado, pela tela de Configurações.
const USUARIO_CAUE = process.env.USUARIO_CAUE || "Caue";
const SENHA_CAUE = process.env.SENHA_CAUE || "Caue299792458@";
const CONFIG_FILE = path.join(__dirname, "config.json");
const DB_FILE = path.join(__dirname, "dados.json");
const FACEID_FILE = path.join(__dirname, "faceid_testes.json");

const DATABASE_URL = process.env.DATABASE_URL;
const USANDO_POSTGRES = Boolean(DATABASE_URL);

const pool = USANDO_POSTGRES
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

async function iniciarBanco() {
  if (!USANDO_POSTGRES) {
    console.log(
      "Armazenamento: arquivo local dados.json (defina DATABASE_URL para usar Postgres persistente)"
    );
    return;
  }
  await pool.query(`
    create table if not exists ocorrencias (
      id text primary key,
      data date not null,
      loja text not null,
      regional text default '',
      descricao text not null,
      "valorRecuperado" numeric default 0,
      quadrilha boolean default false,
      nome text default '',
      inibido boolean default false,
      "apoioCopia" boolean default false,
      monitoramento boolean default false,
      confirmado boolean default false,
      "confirmadoPor" text default '',
      "confirmadoEm" timestamptz,
      "criadoEm" timestamptz default now()
    )
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists regional text default ''
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists nome text default ''
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists inibido boolean default false
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists "apoioCopia" boolean default false
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists monitoramento boolean default false
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists foto text
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists confirmado boolean default false
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists "confirmadoPor" text default ''
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists "confirmadoEm" timestamptz
  `);
  await pool.query(`
    alter table ocorrencias add column if not exists "faceId" boolean default false
  `);
  await pool.query(`
    create table if not exists faceid_testes (
      id text primary key,
      data date not null,
      regional text not null,
      avaliador text default '',
      resultados jsonb default '{}'::jsonb,
      "atualizadoPor" text default '',
      "atualizadoEm" timestamptz default now()
    )
  `);
  await pool.query(`
    create table if not exists configuracoes (
      chave text primary key,
      valor jsonb not null default '{}'::jsonb,
      "atualizadoEm" timestamptz default now()
    )
  `);
  console.log("Armazenamento: Postgres (persistente)");
}

app.use(express.json({ limit: "8mb" }));
app.use(express.static(path.join(__dirname, "public")));
// Fallback: se os arquivos do front estiverem na raiz (sem a pasta public), serve só os necessários.
["index.html", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png"].forEach((f) => {
  app.get("/" + f, (req, res, next) => res.sendFile(path.join(__dirname, f), (err) => err && next()));
});
app.get("/", (req, res, next) => res.sendFile(path.join(__dirname, "index.html"), (err) => err && next()));

// ---------- Fallback local (arquivo JSON) ----------
function lerDadosArquivo() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function salvarDadosArquivo(dados) {
  fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));
}

// ---------- Camada de dados (Postgres ou arquivo) ----------
async function listarOcorrencias() {
  if (USANDO_POSTGRES) {
    const { rows } = await pool.query(
      'select * from ocorrencias order by "criadoEm" desc'
    );
    // Segunda camada de proteção: garante numero mesmo se o typeParser
    // acima não pegar (ex: coluna vindo de outro tipo/consulta).
    return rows.map((r) => ({
      ...r,
      valorRecuperado: Number(r.valorRecuperado) || 0,
    }));
  }
  return lerDadosArquivo().map((r) => ({
    ...r,
    valorRecuperado: Number(r.valorRecuperado) || 0,
  }));
}

async function criarOcorrencia(campos) {
  const nova = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    data: campos.data,
    loja: campos.loja,
    regional: campos.regional || "",
    descricao: campos.descricao,
    valorRecuperado: Number(campos.valorRecuperado) || 0,
    quadrilha: !!campos.quadrilha,
    nome: campos.nome || "",
    inibido: !!campos.inibido,
    apoioCopia: !!campos.apoioCopia,
    monitoramento: !!campos.monitoramento,
    faceId: !!campos.faceId,
    foto: campos.foto || null,
    confirmado: false,
    confirmadoPor: "",
    confirmadoEm: null,
    criadoEm: new Date().toISOString(),
  };

  if (USANDO_POSTGRES) {
    await pool.query(
      `insert into ocorrencias (id, data, loja, regional, descricao, "valorRecuperado", quadrilha, nome, inibido, "apoioCopia", monitoramento, foto, confirmado, "confirmadoPor", "confirmadoEm", "criadoEm", "faceId")
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        nova.id,
        nova.data,
        nova.loja,
        nova.regional,
        nova.descricao,
        nova.valorRecuperado,
        nova.quadrilha,
        nova.nome,
        nova.inibido,
        nova.apoioCopia,
        nova.monitoramento,
        nova.foto,
        nova.confirmado,
        nova.confirmadoPor,
        nova.confirmadoEm,
        nova.criadoEm,
        nova.faceId,
      ]
    );
    return nova;
  }

  const dados = lerDadosArquivo();
  dados.unshift(nova);
  salvarDadosArquivo(dados);
  return nova;
}

async function excluirOcorrencia(id) {
  if (USANDO_POSTGRES) {
    await pool.query("delete from ocorrencias where id = $1", [id]);
    return;
  }
  const dados = lerDadosArquivo();
  const restante = dados.filter((o) => o.id !== id);
  salvarDadosArquivo(restante);
}

async function confirmarOcorrencia(id, confirmado, nomeAdmin) {
  const confirmadoEm = confirmado ? new Date().toISOString() : null;
  const confirmadoPor = confirmado ? nomeAdmin || "Administrador" : "";

  if (USANDO_POSTGRES) {
    const { rows } = await pool.query(
      `update ocorrencias
       set confirmado = $1, "confirmadoPor" = $2, "confirmadoEm" = $3
       where id = $4
       returning *`,
      [confirmado, confirmadoPor, confirmadoEm, id]
    );
    return rows[0] || null;
  }

  const dados = lerDadosArquivo();
  const idx = dados.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  dados[idx] = {
    ...dados[idx],
    confirmado,
    confirmadoPor,
    confirmadoEm,
  };
  salvarDadosArquivo(dados);
  return dados[idx];
}


// ---------- Teste do Face ID (planilha por data + regional) ----------
// Um registro por (data, regional). "resultados" guarda, para cada loja,
// os 4 pontos testados: [entrada01, entrada02, saida01, saida02].
function lerFaceIdArquivo() {
  try {
    return JSON.parse(fs.readFileSync(FACEID_FILE, "utf-8") || "[]");
  } catch (e) {
    return [];
  }
}

async function listarFaceId() {
  if (USANDO_POSTGRES) {
    const { rows } = await pool.query(
      'select * from faceid_testes order by data desc, regional'
    );
    return rows;
  }
  return lerFaceIdArquivo();
}

async function salvarFaceId({ data, regional, avaliador, resultados, por }) {
  const id = `${data}|${regional}`;
  const agora = new Date().toISOString();
  if (USANDO_POSTGRES) {
    const { rows } = await pool.query(
      `insert into faceid_testes (id, data, regional, avaliador, resultados, "atualizadoPor", "atualizadoEm")
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update
       set avaliador = excluded.avaliador,
           resultados = excluded.resultados,
           "atualizadoPor" = excluded."atualizadoPor",
           "atualizadoEm" = excluded."atualizadoEm"
       returning *`,
      [id, data, regional, avaliador, JSON.stringify(resultados), por, agora]
    );
    return rows[0];
  }
  const lista = lerFaceIdArquivo();
  const reg = { id, data, regional, avaliador, resultados, atualizadoPor: por, atualizadoEm: agora };
  const idx = lista.findIndex((r) => r.id === id);
  if (idx === -1) lista.unshift(reg);
  else lista[idx] = reg;
  fs.writeFileSync(FACEID_FILE, JSON.stringify(lista, null, 2));
  return reg;
}

// ---------- Configurações do aplicativo (editadas pelo Caue) ----------
// Ficam no Postgres (tabela "configuracoes") ou em config.json no modo local.
// Guardam aparência, textos, meta, intervalo de atualização e as senhas
// trocadas pela tela de Configurações (somente o hash, nunca a senha em texto).
const TEMA_PADRAO = {
  bg: "#0a1929", panel: "#10233a", panel2: "#163049", line: "#1e4266",
  text: "#e9f2fb", muted: "#7ea3c4", amber: "#4fc3f7", focus: "#6fd0ff",
  red: "#e05a56", green: "#45b57e",
};
const CONFIG_PADRAO = {
  tema: TEMA_PADRAO,
  empresa: "Tenda Atacado",
  titulo: "Painel de Ocorrências de Roubo",
  metaRecuperado: 3500,
  intervaloSeg: 60,
};
let CONFIG = { ...CONFIG_PADRAO, tema: { ...TEMA_PADRAO } };
let SENHAS_HASH = {}; // { comum, gerencia, admin, caue } -> "salt:hash"

async function carregarConfig() {
  let salvo = {};
  try {
    if (USANDO_POSTGRES) {
      const { rows } = await pool.query("select chave, valor from configuracoes");
      rows.forEach((r) => (salvo[r.chave] = r.valor));
    } else {
      salvo = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8") || "{}");
    }
  } catch (e) {
    salvo = {};
  }
  const c = salvo.app || {};
  CONFIG = {
    ...CONFIG_PADRAO,
    ...c,
    tema: { ...TEMA_PADRAO, ...(c.tema || {}) },
  };
  SENHAS_HASH = salvo.senhas || {};
}

async function salvarChaveConfig(chave, valor) {
  if (USANDO_POSTGRES) {
    await pool.query(
      `insert into configuracoes (chave, valor, "atualizadoEm") values ($1, $2, now())
       on conflict (chave) do update set valor = excluded.valor, "atualizadoEm" = now()`,
      [chave, JSON.stringify(valor)]
    );
    return;
  }
  let atual = {};
  try { atual = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8") || "{}"); } catch (e) {}
  atual[chave] = valor;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(atual, null, 2));
}

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(senha, salt, 32).toString("hex");
  return `${salt}:${h}`;
}

function confereHash(senha, guardado) {
  const [salt, h] = String(guardado).split(":");
  if (!salt || !h) return false;
  const calc = crypto.scryptSync(senha, salt, 32);
  const esperado = Buffer.from(h, "hex");
  return esperado.length === calc.length && crypto.timingSafeEqual(calc, esperado);
}

function igualSeguro(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const SENHAS_PADRAO = () => ({
  comum: SENHA,
  gerencia: SENHA_GERENCIA,
  admin: SENHA_ADMIN,
  caue: SENHA_CAUE,
});

function senhaConfere(perfil, senha) {
  if (typeof senha !== "string" || !senha) return false;
  if (SENHAS_HASH[perfil]) return confereHash(senha, SENHAS_HASH[perfil]);
  return igualSeguro(senha, SENHAS_PADRAO()[perfil]);
}

// ---------- Autenticacao ----------
// Quatro acessos: a senha normal (funcionarios), a da gerencia (so consulta
// os paineis, nao registra), a de administrador (audita: confirma/exclui) e o
// login do Caue (usuario + senha), que tem tudo do administrador mais a tela de
// Configuracoes. Se um usuario for informado, so o Caue existe; sem usuario,
// valem as tres senhas compartilhadas.
function identificarPerfil(usuario, senha) {
  const u = String(usuario || "").trim().toLowerCase();
  if (u) {
    return u === USUARIO_CAUE.toLowerCase() && senhaConfere("caue", senha) ? "caue" : null;
  }
  if (senhaConfere("admin", senha)) return "admin";
  if (senhaConfere("gerencia", senha)) return "gerencia";
  if (senhaConfere("comum", senha)) return "comum";
  return null;
}

function checarSenha(req, res, next) {
  const perfil = identificarPerfil(req.headers["x-usuario"], req.headers["x-senha"]);
  if (!perfil) {
    return res.status(401).json({ erro: "Senha incorreta" });
  }
  req.perfil = perfil;
  req.ehCaue = perfil === "caue";
  req.ehAdmin = perfil === "admin" || perfil === "caue";
  req.ehGerencia = perfil === "gerencia";
  next();
}

function checarAdmin(req, res, next) {
  if (!req.ehAdmin) {
    return res.status(403).json({ erro: "Acao restrita ao administrador" });
  }
  next();
}

function checarCaue(req, res, next) {
  if (!req.ehCaue) {
    return res.status(403).json({ erro: "Acao restrita ao acesso do Caue" });
  }
  next();
}

app.post("/api/login", (req, res) => {
  const { senha, usuario } = req.body || {};
  const perfil = identificarPerfil(usuario, senha);
  if (perfil) {
    return res.json({
      ok: true,
      admin: perfil === "admin" || perfil === "caue",
      gerencia: perfil === "gerencia",
      caue: perfil === "caue",
    });
  }
  return res.status(401).json({ ok: false, erro: "Usuário ou senha incorretos" });
});

// ---------- Configurações: leitura pública (tema da tela de login) e edição (Caue) ----------
function configPublica() {
  return {
    tema: CONFIG.tema,
    empresa: CONFIG.empresa,
    titulo: CONFIG.titulo,
    metaRecuperado: CONFIG.metaRecuperado,
    intervaloSeg: CONFIG.intervaloSeg,
  };
}

app.get("/api/config-publica", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(configPublica());
});

const HEX = /^#[0-9a-fA-F]{6}$/;

app.put("/api/config", checarSenha, checarCaue, async (req, res) => {
  const b = req.body || {};
  try {
    let novo;
    if (b.restaurar === true) {
      novo = { ...CONFIG_PADRAO, tema: { ...TEMA_PADRAO } };
    } else {
      novo = { ...CONFIG, tema: { ...CONFIG.tema } };
      if (b.tema && typeof b.tema === "object") {
        for (const k of Object.keys(TEMA_PADRAO)) {
          if (b.tema[k] !== undefined) {
            if (!HEX.test(b.tema[k])) return res.status(400).json({ erro: `Cor inválida: ${k}` });
            novo.tema[k] = b.tema[k].toLowerCase();
          }
        }
      }
      if (b.empresa !== undefined) novo.empresa = String(b.empresa).trim().slice(0, 60) || CONFIG_PADRAO.empresa;
      if (b.titulo !== undefined) novo.titulo = String(b.titulo).trim().slice(0, 80) || CONFIG_PADRAO.titulo;
      if (b.metaRecuperado !== undefined) {
        const m = Number(b.metaRecuperado);
        if (!(m > 0 && m <= 100000000)) return res.status(400).json({ erro: "Meta inválida" });
        novo.metaRecuperado = m;
      }
      if (b.intervaloSeg !== undefined) {
        const i = Math.round(Number(b.intervaloSeg));
        if (!(i >= 15 && i <= 3600)) return res.status(400).json({ erro: "Intervalo deve ficar entre 15 e 3600 segundos" });
        novo.intervaloSeg = i;
      }
    }
    await salvarChaveConfig("app", novo);
    CONFIG = novo;
    res.json(configPublica());
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar as configurações" });
  }
});

const PERFIS_SENHA = ["comum", "gerencia", "admin", "caue"];

app.put("/api/config/senha", checarSenha, checarCaue, async (req, res) => {
  const { perfil, nova } = req.body || {};
  if (!PERFIS_SENHA.includes(perfil)) return res.status(400).json({ erro: "Perfil inválido" });
  if (typeof nova !== "string" || nova.length < 6 || nova.length > 100) {
    return res.status(400).json({ erro: "A senha precisa ter de 6 a 100 caracteres" });
  }
  // Não deixa duas senhas compartilhadas iguais (uma esconderia a outra).
  const outras = PERFIS_SENHA.filter((p) => p !== perfil && p !== "caue");
  if (perfil !== "caue" && outras.some((p) => senhaConfere(p, nova))) {
    return res.status(400).json({ erro: "Essa senha já é usada por outro perfil" });
  }
  try {
    const novas = { ...SENHAS_HASH, [perfil]: hashSenha(nova) };
    await salvarChaveConfig("senhas", novas);
    SENHAS_HASH = novas;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar a senha" });
  }
});

app.get("/api/ocorrencias", checarSenha, async (req, res) => {
  try {
    const dados = await listarOcorrencias();
    res.json(dados);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao ler os dados" });
  }
});

app.post("/api/ocorrencias", checarSenha, async (req, res) => {
  // A gerencia so consulta os paineis; nao registra ocorrencias.
  if (req.ehGerencia) {
    return res.status(403).json({ erro: "A gerencia nao registra ocorrencias" });
  }
  const { data, loja, regional, descricao, valorRecuperado, quadrilha, nome, inibido, apoioCopia, monitoramento, faceId, foto } = req.body;
  if (!data || !loja || !descricao || !nome) {
    return res.status(400).json({ erro: "Preencha nome, data, loja e descricao" });
  }
  try {
    const nova = await criarOcorrencia({
      data,
      loja,
      regional,
      descricao,
      valorRecuperado,
      quadrilha,
      nome,
      inibido,
      apoioCopia,
      monitoramento,
      faceId,
      foto,
    });
    res.status(201).json(nova);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar os dados" });
  }
});

// Apenas administrador pode excluir — usuários comuns só registram
app.delete("/api/ocorrencias/:id", checarSenha, checarAdmin, async (req, res) => {
  try {
    await excluirOcorrencia(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

// Apenas administrador: confirmar (ou desfazer a confirmacao de) um registro
app.patch("/api/ocorrencias/:id/confirmar", checarSenha, checarAdmin, async (req, res) => {
  const confirmado = req.body.confirmado !== false; // default: confirmar
  const nomeAdmin = req.body.nome || "";
  try {
    const atualizado = await confirmarOcorrencia(req.params.id, confirmado, nomeAdmin);
    if (!atualizado) {
      return res.status(404).json({ erro: "Ocorrencia nao encontrada" });
    }
    res.json(atualizado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao confirmar ocorrencia" });
  }
});


// ---------- Teste do Face ID ----------
const STATUS_FACEID = ["", "OK", "CLARIDADE", "Ñ SOBE ALERTA", "Ñ RECONHECE", "TELA PRETA", "DELAY", "SEM ALERTA"];

app.get("/api/faceid", checarSenha, async (req, res) => {
  try {
    res.json(await listarFaceId());
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao ler os testes de Face ID" });
  }
});

// Cria ou atualiza a planilha de uma data + regional. A gerencia so consulta.
app.put("/api/faceid", checarSenha, async (req, res) => {
  if (req.ehGerencia) {
    return res.status(403).json({ erro: "A gerencia nao preenche a planilha" });
  }
  const { data, regional, avaliador, resultados, por } = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "") || !regional) {
    return res.status(400).json({ erro: "Informe data e regional" });
  }
  // Sanitiza: so aceita lojas com 4 posicoes e status conhecidos
  const limpo = {};
  Object.entries(resultados || {}).forEach(([loja, pontos]) => {
    if (!Array.isArray(pontos)) return;
    limpo[String(loja).slice(0, 20)] = [0, 1, 2, 3].map((i) =>
      STATUS_FACEID.includes(pontos[i]) ? pontos[i] : ""
    );
  });
  try {
    const salvo = await salvarFaceId({
      data,
      regional: String(regional).slice(0, 80),
      avaliador: String(avaliador || "").slice(0, 60),
      resultados: limpo,
      por: String(por || "").slice(0, 60),
    });
    res.json(salvo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao salvar o teste de Face ID" });
  }
});



// ---------- Planilha do Teste do Face ID (igual a tela do painel) ----------
// Mesma estrutura de regionais/lojas usada no front-end.
const REGIONAIS = [
  {
    nome: "Vale e Litoral Norte",
    responsavel: "João Nunes",
    lojas: ["CT06","CT08","CT09","CT13","CT14","CT15","CT18","CT34","CT47","CT48","CT57","CT67"],
  },
  {
    nome: "Interior Noroeste",
    responsavel: "Márcio Lúcio",
    lojas: ["CT25","CT27","CT28","CT32","CT35","CT37","CT39","CT59","CT60","CT63","CT64"],
  },
  {
    nome: "Interior Grande SP e Litoral Sul",
    responsavel: "Mauro Antonio",
    lojas: ["CT17","CT20","CT33","CT36","CT41","CT43","CT44","CT49","CT51","CT53","CT58"],
  },
  {
    nome: "Interior e Campinas",
    responsavel: "Marcos Paulo",
    lojas: ["CAMP-CEASA","CT03","CT16","CT30","CT31","CT38","CT50","CT54","CT62","CT65","CT66"],
  },
];
const NOME_LOJA = {
  CT06: "Kennedy", CT08: "São José", CT09: "Guarapiranga", CT13: "Guaratinguetá",
  CT14: "Bonsucesso", CT15: "Taubaté", CT18: "Jacareí", CT34: "Pinda",
  CT47: "Presidente Dutra", CT48: "Vila Galvão", CT57: "Ubatuba", CT67: "Bertioga",
  CT25: "Bauru", CT27: "Santa Bárbara", CT28: "Indaiatuba", CT32: "Sumaré",
  CT35: "Botucatu", CT37: "Piracicaba", CT39: "Hortolândia", CT59: "Matão",
  CT60: "Jaú", CT63: "Itapetininga", CT64: "Avaré",
  CT17: "Diadema", CT20: "Itu", CT33: "Itanhaém", CT36: "Salto",
  CT41: "Ferraz", CT43: "Itaquá", CT44: "Suzano", CT49: "São Mateus",
  CT51: "Praia Grande", CT53: "Sorocaba", CT58: "Praia Grande 2",
  "CAMP-CEASA": "Ceasa", CT03: "Amoreiras", CT16: "Carapicuíba", CT30: "Mogi Guaçu",
  CT31: "São Carlos", CT38: "Ribeirão Preto", CT50: "Jundiaí", CT54: "Itatiba",
  CT62: "Leme", CT65: "Vinhedo", CT66: "Amparo",
};

const FID_COLUNAS = ["Entrada 01", "Entrada 02", "Saída 01", "Saída 02"];
// A planilha original não inclui a loja do Ceasa
const fidLojasDe = (r) => r.lojas.filter((l) => l !== "CAMP-CEASA");

// Cores do painel
const COR = {
  fundo: "FF0A1929", painel: "FF10233A", painel2: "FF163049", linha: "FF1E4266",
  texto: "FFE9F2FB", muted: "FF7EA3C4", foco: "FF6FD0FF",
  okTxt: "FF7EE2AD", okFundo: "FF133A2C", falhaFundo: "FFC62828",
};
const bordaFid = { style: "thin", color: { argb: COR.linha } };
const bordasFid = { top: bordaFid, left: bordaFid, bottom: bordaFid, right: bordaFid };

function nomeAbaFid(nome) {
  return nome.replace(/[\\/?*\[\]:]/g, "-").slice(0, 31);
}

async function montarPlanilhaFaceId() {
  const registros = await listarFaceId();
  const wb = new ExcelJS.Workbook();
  wb.creator = "Painel de Ocorrências — Tenda Atacado";
  wb.created = new Date();

  REGIONAIS.forEach((reg) => {
    const ws = wb.addWorksheet(nomeAbaFid(reg.nome), {
      properties: { tabColor: { argb: COR.foco } },
      views: [{ showGridLines: false }],
    });
    ws.columns = [{ width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    const lojas = fidLojasDe(reg);

    const doRegional = registros
      .filter((r) => r.regional === reg.nome)
      .sort((a, b) => String(fmtDataISO(a.data)).localeCompare(String(fmtDataISO(b.data))));

    const pintar = (row, fundo, cor, negrito) => {
      for (let c = 1; c <= 5; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fundo } };
        cell.font = { color: { argb: cor }, bold: !!negrito, name: "Calibri", size: 11 };
      }
    };

    // Título da aba
    let r = ws.addRow([reg.nome.toUpperCase() + " — Teste do Face ID"]);
    ws.mergeCells(r.number, 1, r.number, 5);
    pintar(r, COR.fundo, COR.foco, true);
    r.getCell(1).font = { color: { argb: COR.foco }, bold: true, size: 14, name: "Calibri" };
    r.height = 26;
    r.getCell(1).alignment = { vertical: "middle" };
    r = ws.addRow([]);
    pintar(r, COR.fundo, COR.texto);

    if (doRegional.length === 0) {
      r = ws.addRow(["Nenhum teste preenchido ainda."]);
      ws.mergeCells(r.number, 1, r.number, 5);
      pintar(r, COR.fundo, COR.muted);
    }

    doRegional.forEach((rec) => {
      const iso = fmtDataISO(rec.data);
      const d = new Date(iso + "T12:00:00");
      const dia = isNaN(d) ? "" : DIAS_SEMANA_FULL[d.getDay()];
      const resultados = rec.resultados || {};

      // Data / dia da semana / responsável (topo do bloco, como na tela)
      r = ws.addRow([`${fmtDataBR(iso)}  ·  ${dia}`, "", "Responsável pelo teste:", "", rec.avaliador || "—"]);
      ws.mergeCells(r.number, 1, r.number, 2);
      ws.mergeCells(r.number, 3, r.number, 4);
      pintar(r, COR.fundo, COR.foco, true);
      r.getCell(3).font = { color: { argb: COR.muted }, size: 10, name: "Calibri" };
      r.getCell(3).alignment = { horizontal: "right" };
      r.getCell(5).font = { color: { argb: COR.texto }, bold: true, name: "Calibri", size: 11 };
      r.height = 22;

      // Cabeçalho da tabela
      r = ws.addRow(["LOJA", ...FID_COLUNAS.map((c) => c.toUpperCase())]);
      pintar(r, COR.painel2, COR.muted, true);
      r.height = 22;
      for (let c = 1; c <= 5; c++) {
        r.getCell(c).border = bordasFid;
        r.getCell(c).alignment = { horizontal: c === 1 ? "left" : "center", vertical: "middle", indent: c === 1 ? 1 : 0 };
      }

      let feitos = 0, falhas = 0;
      lojas.forEach((loja) => {
        const p = Array.isArray(resultados[loja]) ? resultados[loja] : [];
        const linha = ws.addRow([NOME_LOJA[loja] ? `${loja} · ${NOME_LOJA[loja]}` : loja, p[0] || "", p[1] || "", p[2] || "", p[3] || ""]);
        linha.height = 20;
        pintar(linha, COR.painel, COR.texto);
        linha.getCell(1).font = { color: { argb: COR.texto }, bold: true, name: "Calibri", size: 11 };
        linha.getCell(1).alignment = { vertical: "middle", indent: 1 };
        for (let c = 1; c <= 5; c++) linha.getCell(c).border = bordasFid;
        for (let i = 0; i < 4; i++) {
          const cell = linha.getCell(i + 2);
          const v = p[i] || "";
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (v) {
            feitos++;
            if (v === "OK") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.okFundo } };
              cell.font = { color: { argb: COR.okTxt }, bold: true, name: "Calibri", size: 10 };
            } else {
              falhas++;
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.falhaFundo } };
              cell.font = { color: { argb: "FFFFFFFF" }, bold: true, name: "Calibri", size: 10 };
            }
          }
        }
      });

      // Resumo (igual ao rodapé da tela)
      r = ws.addRow([`Preenchidos: ${feitos}/${lojas.length * 4}  ·  Com falha: ${falhas}`]);
      ws.mergeCells(r.number, 1, r.number, 5);
      pintar(r, COR.fundo, COR.muted);
      r.getCell(1).alignment = { indent: 1 };
      // espaço entre testes
      pintar(ws.addRow([]), COR.fundo, COR.texto);
      pintar(ws.addRow([]), COR.fundo, COR.texto);
    });

    // Fundo escuro nas colunas ao redor, como a tela do painel
    ws.properties.defaultRowHeight = 18;
  });

  return wb;
}

const DIAS_SEMANA_FULL = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];

// Qualquer perfil (inclusive gerencia) pode baixar a planilha, como na tela.
app.get("/api/faceid/planilha", checarSenha, async (req, res) => {
  try {
    const wb = await montarPlanilhaFaceId();
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="teste-face-id-${hoje}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ erro: "Erro ao gerar a planilha do Face ID" });
  }
});

// ---------- Backup em planilha (somente o Caue) ----------
// Gera um .xlsx com TODAS as ocorrencias e todos os testes de Face ID.
// A foto (base64) nao entra na planilha por ser muito pesada; fica so a
// indicacao "Sim/Nao" na coluna "Tem foto".
function fmtDataBR(v) {
  if (!v) return "";
  const soData = String(v instanceof Date ? v.toISOString() : v).split("T")[0];
  const [a, m, d] = soData.split("-");
  return d && m && a ? `${d}/${m}/${a}` : String(v);
}

function fmtDataHoraBR(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const simNao = (v) => (v ? "Sim" : "Não");
const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function estilizarCabecalho(ws) {
  const cab = ws.getRow(1);
  cab.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cab.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cab.height = 22;
  cab.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A5F" } };
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}

async function montarPlanilhaBackup() {
  const ocorrencias = await listarOcorrencias();
  const faceid = await listarFaceId();

  const wb = new ExcelJS.Workbook();
  wb.creator = "Painel de Ocorrências — Tenda Atacado";
  wb.created = new Date();

  // --- Aba 1: ocorrencias ---
  const ws = wb.addWorksheet("Ocorrências");
  ws.columns = [
    { header: "Data", key: "data", width: 12 },
    { header: "Loja", key: "loja", width: 10 },
    { header: "Regional", key: "regional", width: 24 },
    { header: "Registrado por", key: "nome", width: 22 },
    { header: "Descrição", key: "descricao", width: 60 },
    { header: "Valor recuperado (R$)", key: "valor", width: 20 },
    { header: "Quadrilha", key: "quadrilha", width: 11 },
    { header: "Inibida", key: "inibido", width: 9 },
    { header: "Apoio de cópia", key: "apoioCopia", width: 14 },
    { header: "Monitoramento", key: "monitoramento", width: 15 },
    { header: "Face ID", key: "faceId", width: 9 },
    { header: "Tem foto", key: "foto", width: 10 },
    { header: "Confirmada", key: "confirmado", width: 12 },
    { header: "Confirmada por", key: "confirmadoPor", width: 20 },
    { header: "Confirmada em", key: "confirmadoEm", width: 20 },
    { header: "Registrada em", key: "criadoEm", width: 20 },
    { header: "ID", key: "id", width: 16 },
  ];
  [...ocorrencias]
    .sort((a, b) => String(fmtDataISO(a.data)).localeCompare(String(fmtDataISO(b.data))))
    .forEach((o) => {
      ws.addRow({
        data: fmtDataBR(o.data),
        loja: o.loja || "",
        regional: o.regional || "",
        nome: o.nome || "",
        descricao: o.descricao || "",
        valor: Number(o.valorRecuperado) || 0,
        quadrilha: simNao(o.quadrilha),
        inibido: simNao(o.inibido),
        apoioCopia: simNao(o.apoioCopia),
        monitoramento: simNao(o.monitoramento),
        faceId: simNao(o.faceId),
        foto: simNao(o.foto),
        confirmado: simNao(o.confirmado),
        confirmadoPor: o.confirmadoPor || "",
        confirmadoEm: fmtDataHoraBR(o.confirmadoEm),
        criadoEm: fmtDataHoraBR(o.criadoEm),
        id: o.id,
      });
    });
  ws.getColumn("valor").numFmt = '"R$" #,##0.00';
  ws.getColumn("descricao").alignment = { wrapText: true, vertical: "top" };
  estilizarCabecalho(ws);

  // --- Aba 2: teste do Face ID (uma linha por loja) ---
  const wf = wb.addWorksheet("Teste Face ID");
  wf.columns = [
    { header: "Data", key: "data", width: 12 },
    { header: "Dia", key: "dia", width: 10 },
    { header: "Regional", key: "regional", width: 24 },
    { header: "Responsável", key: "avaliador", width: 22 },
    { header: "Loja", key: "loja", width: 10 },
    { header: "Entrada 01", key: "e1", width: 16 },
    { header: "Entrada 02", key: "e2", width: 16 },
    { header: "Saída 01", key: "s1", width: 16 },
    { header: "Saída 02", key: "s2", width: 16 },
  ];
  [...faceid]
    .sort((a, b) => String(fmtDataISO(a.data)).localeCompare(String(fmtDataISO(b.data))))
    .forEach((r) => {
      const iso = fmtDataISO(r.data);
      const dow = new Date(iso + "T12:00:00");
      Object.entries(r.resultados || {}).forEach(([loja, p]) => {
        const pts = Array.isArray(p) ? p : [];
        wf.addRow({
          data: fmtDataBR(iso),
          dia: isNaN(dow) ? "" : DIAS_SEMANA[dow.getDay()],
          regional: r.regional || "",
          avaliador: r.avaliador || "",
          loja,
          e1: pts[0] || "",
          e2: pts[1] || "",
          s1: pts[2] || "",
          s2: pts[3] || "",
        });
      });
    });
  estilizarCabecalho(wf);

  return { wb, totalOcorrencias: ocorrencias.length };
}

function fmtDataISO(v) {
  if (!v) return "";
  return String(v instanceof Date ? v.toISOString() : v).slice(0, 10);
}

app.get("/api/backup", checarSenha, checarCaue, async (req, res) => {
  try {
    const { wb, totalOcorrencias } = await montarPlanilhaBackup();
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="backup-ocorrencias-${hoje}.xlsx"`);
    res.setHeader("X-Total-Ocorrencias", String(totalOcorrencias));
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ erro: "Erro ao gerar o backup" });
  }
});

// Backup completo em JSON: todas as ocorrencias (com foto) e todos os testes de Face ID.
app.get("/api/backup-completo", checarSenha, checarCaue, async (req, res) => {
  try {
    const ocorrencias = await listarOcorrencias();
    const faceid = await listarFaceId();
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="backup-completo-${hoje}.json"`);
    res.send(
      JSON.stringify(
        { geradoEm: new Date().toISOString(), ocorrencias, faceid_testes: faceid },
        null,
        2
      )
    );
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ erro: "Erro ao gerar o backup completo" });
  }
});

iniciarBanco()
  .then(() => carregarConfig())
  .catch((e) => {
    console.error("Erro ao iniciar banco:", e);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Painel Tenda Atacado rodando na porta ${PORT}`);
    });
  });
