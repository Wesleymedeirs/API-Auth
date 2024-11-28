const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexão com o MongoDB
mongoose.connect(`mongodb+srv://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbSenha)}@db-auth.fuyzv.mongodb.net/?retryWrites=true&w=majority&appName=DB-Auth`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo de Evento
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    allDay: { type: Boolean, default: false },
});

const Event = mongoose.model('Event', EventSchema);

// Rotas da API
// 1. Criar um novo evento
app.post('/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar o evento' });
    }
});

// 2. Listar todos os eventos
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar os eventos' });
    }
});

// 3. Atualizar um evento
app.put('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        res.status(200).json(event);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar o evento' });
    }
});

// 4. Excluir um evento
app.delete('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        res.status(200).json({ message: 'Evento excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir o evento' });
    }
});

// Iniciar o servidor
const PORT = 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
