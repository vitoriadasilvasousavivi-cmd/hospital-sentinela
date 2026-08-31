const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// ===============================
// CONFIGURAÇÕES
// ===============================

app.use(express.json());
app.use(cors());

// Pasta do frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Banco de dados
const DB_FILE = path.join(__dirname, "db.json");

// ===============================
// BANCO DE DADOS
// ===============================

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const bancoInicial = {
        usuarios: [],
        pacientes: [],
        triagens: [],
        consultas: [],
        tv_chamada: null,
        tv_historico: []
      };

      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(bancoInicial, null, 2)
      );

      return bancoInicial;
    }

    const db = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    if (!db.usuarios) db.usuarios = [];
    if (!db.pacientes) db.pacientes = [];
    if (!db.triagens) db.triagens = [];
    if (!db.consultas) db.consultas = [];
    if (!db.tv_chamada) db.tv_chamada = null;
    if (!db.tv_historico) db.tv_historico = [];

    return db;

  } catch (erro) {
    console.error("Erro ao ler banco de dados:", erro);

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (erro) {
    console.error("Erro ao salvar banco de dados:", erro);
  }
}

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(
    u =>
      u.usuario === req.body.usuario &&
      u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// ===============================
// ATENDIMENTO
// ===============================

app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);

  writeDB(db);

  res.json(paciente);
});

// ===============================
// LISTAR PACIENTES
// ===============================

app.get("/pacientes", (req, res) => {
  const db = readDB();

  res.json(db.pacientes);
});

// ===============================
// TRIAGEM
// ===============================

app.post("/triagem", (req, res) => {
  const db = readDB();

  const temperatura = Number(req.body.temperatura);

  let risco = req.body.risco;

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco: risco,
    status: "aguardando_medico",
    createdAt: new Date().toISOString()
  };

  db.triagens.push(triagem);

  writeDB(db);

  res.json(triagem);
});

// ===============================
// LISTAR TRIAGENS
// ===============================

app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(db.triagens);
});

// ===============================
// MÍDIA INDOOR - TV
// ===============================

app.post("/tv/chamar", (req, res) => {
  const db = readDB();

  const chamada = {
    id: Date.now().toString(),
    localTipo: req.body.localTipo,
    localNumero: req.body.localNumero,
    paciente: req.body.paciente,
    hora: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  db.tv_chamada = chamada;

  db.tv_historico.unshift(chamada);

  if (db.tv_historico.length > 5) {
    db.tv_historico.pop();
  }

  writeDB(db);

  res.json(chamada);
});

// ===============================
// CONSULTAR CHAMADA DA TV
// ===============================

app.get("/tv/chamada", (req, res) => {
  const db = readDB();

  res.json({
    chamada: db.tv_chamada,
    historico: db.tv_historico
  });
});

// ===============================
// LISTA DE MEDICAÇÕES
// ===============================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// ===============================
// CONSULTA MÉDICA
// ===============================

app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date().toISOString()
  };

  db.consultas.push(consulta);

  writeDB(db);

  res.json(consulta);
});

// ===============================
// MEDICAÇÕES / CONSULTAS
// ===============================

app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas);
});

// ===============================
// TESTE DO SERVIDOR
// ===============================

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    sistema: "Sentinela",
    mensagem: "Servidor funcionando corretamente"
  });
});

// ===============================
// FRONTEND
// ===============================

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

// ===============================
// INICIAR SERVIDOR
// ===============================

// IMPORTANTE PARA O RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🏥 Sentinela rodando na porta ${PORT}`);
});
