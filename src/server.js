import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectMongoDB } from './db/connectMongoDB.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import notesRouters from './routes/notesRoutes.js';

const app = express();

app.use(logger);
app.use(express.json());
app.use(cors());

app.use('/notes', notesRouters);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

await connectMongoDB();
