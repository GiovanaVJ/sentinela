const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

//frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { usuarios: [], pacientes: [], triagens: [], consultas: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE));

}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

//login 

app.post("/login", (req, res) => {
    const db = readDB();
    const user = db.usuarios.find(
        u => u.username === req.body.usuario && u.password === req.body.senha
    );

    if (!user) return res.status(401).json({ message: "login inválido" });

    res.json(user);

});

//atendimento

app.post("/atendimento", (req, res) => {
    const db = readDB();

    const paciente = {

        id = Date.now(),
        ...req.body,
        status = "triagem",
        createdAt = new Date()
    };

    db.pacientes.push(paciente);
    writeDB(db);
    res.json(paciente);

});
//triagem

app.post("/triagem", (req, res) => {
    const db = readDB();

    let risco = req.body.risco;

    //regra automática simples 
    if (req.body.temperatura > 38)  risco = "vermelho";
    if (req.body.temperatura >= 38 && risco !== 'vermelho') risco = "amarelo";
    

    const triagem = {
        id: Date.now(),
        ...req.body,
        risco,
        createdAt: new Date()
    };

    db.triagens.push(triagem);
    writeDB(db);

    res.json(triagem);
});
//triagem para médico
app.post("/consulta", (req, res) => {
    const db = readDB();
    res.json(db.triagens);
});

//consulta
app.post("/consulta", (req, res) => {
    const db = readDB();

    const consulta = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
    };

    db.consultas.push(consulta);
    writeDB(db);

    res.json(consulta);
});

//medicações
app.post("/medicacoes", (req, res) => {
    const db = readDB();
    res.json(db.consultas);
});

//start
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`hospital rodando na porta ${PORT})`;
});
