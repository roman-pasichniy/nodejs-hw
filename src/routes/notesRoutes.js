import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from '../controllers/notesController.js';
import { celebrate } from 'celebrate';
import {
  getAllNotesSchema,
  createNoteSchema,
  noteIdSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';
import authenticate from '../middleware/authenticate.js';

const notesRouter = Router();

notesRouter.use(authenticate);

notesRouter.get('/', celebrate(getAllNotesSchema), getAllNotes);
notesRouter.get('/:noteId', celebrate(noteIdSchema), getNoteById);
notesRouter.post('/', celebrate(createNoteSchema), createNote);
notesRouter.delete('/:noteId', celebrate(noteIdSchema), deleteNote);
notesRouter.patch('/:noteId', celebrate(updateNoteSchema), updateNote);

export default notesRouter;
