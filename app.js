// Imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Config json response
app.use(express.json());

// Modelo do Usuário
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

// Middleware de autenticação - Rota privada
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ msg: 'Acesso negado!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'SLKNDKFSKDLKlnhfdshfsdj*/*/D*ASkdsajkdbka@*');
    req.user = verified; // Adiciona os dados do usuário decodificado à requisição
    next();
  } catch (err) {
    return res.status(400).json({ msg: 'Token inválido!' });
  }
};

// Rota aberta
app.get('/', (req, res) => {
  res.status(200).json({ msg: "Bem-vindo à API!" });
});

// Registrar usuário
app.post('/auth/register', async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  if (!name) {
    return res.status(422).json({ msg: 'O nome é obrigatório' });
  }
  if (!email) {
    return res.status(422).json({ msg: 'O e-mail é obrigatório' });
  }
  if (!password) {
    return res.status(422).json({ msg: 'A senha é obrigatória' });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: 'As senhas não conferem' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(422).json({ msg: 'E-mail já cadastrado' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();
    res.status(201).json({ msg: 'Usuário criado com sucesso!' });
  } catch (err) {
    res.status(500).json({ msg: 'Erro no servidor, tente novamente mais tarde' });
  }
});

// Login de usuário
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: 'O e-mail é obrigatório' });
  }
  if (!password) {
    return res.status(422).json({ msg: 'A senha é obrigatória' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(422).json({ msg: 'Senha inválida' });
  }

  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET || 'SLKNDKFSKDLKlnhfdshfsdj*/*/D*ASkdsajkdbka@*',
    { expiresIn: '1h' }
  );

  res.status(200).json({ msg: 'Autenticação bem-sucedida', token });
});

// Rota privada (dados do usuário)
app.get('/user/:id', verifyToken, async (req, res) => {
  const id = req.params.id;

  try {
    const user = await User.findById(id, '-password'); // Exclui o campo senha dos dados retornados
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// Credenciais do banco
const dbUser = process.env.DB_USER;
const dbSenha = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbSenha)}@db-auth.fuyzv.mongodb.net/?retryWrites=true&w=majority&appName=DB-Auth`
  )
  .then(() => {
    app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
    console.log('Conectado ao banco!');
  })
  .catch((err) => console.error(err));
