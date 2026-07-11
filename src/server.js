import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import 'dotenv/config';

const app = express();

app.use(express.json());
app.use(cors());

app.use(
  pinoHttp({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        singleLine: true,
        ignore: 'req.headers,res.headers',
      },
    },
  }),
);

app.get('/notes', (req, res) => {
  res.status(200).json({ message: 'Retrieved all notes' });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`,
  });
});

app.get('/test-error', async (req, res) => {
  throw new Error('Simulated server error');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
app.use((error, req, res, next) => {
  res.status(500).json({
    message: error.message,
  });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
