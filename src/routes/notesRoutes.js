import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from '../controllers/notesController.js';

const notesRouters = Router();

notesRouters.get('/', getAllNotes);
notesRouters.get('/:noteId', getNoteById);
notesRouters.post('/', createNote);
notesRouters.delete('/:noteId', deleteNote);
notesRouters.patch('/:noteId', updateNote);

export default notesRouters;
