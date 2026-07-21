import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res) => {
  const { _id: userId } = req.user;
  const { page = 1, perPage = 10, tag, search } = req.query;
  const pageValue = Number(page);
  const perPageValue = Number(perPage);
  const searchTerm = search?.trim();
  const skip = (pageValue - 1) * perPageValue;
  const normalizedSearch = searchTerm?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const noteQuery = Note.find({ userId });

  if (tag) {
    noteQuery.where('tag').equals(tag);
  }

  if (normalizedSearch) {
    noteQuery.where({
      $or: [
        { title: { $regex: normalizedSearch, $options: 'i' } },
        { content: { $regex: normalizedSearch, $options: 'i' } },
      ],
    });
  }

  const [notes, totalNotes] = await Promise.all([
    noteQuery.clone().skip(skip).limit(perPageValue),
    noteQuery.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalNotes / perPageValue);

  res.status(200).json({
    page: pageValue,
    perPage: perPageValue,
    totalNotes,
    totalPages,
    notes,
  });
};

export const getNoteById = async (req, res) => {
  const { noteId: _id } = req.params;
  const { _id: userId } = req.user;

  const result = await Note.findOne({ _id, userId });

  if (!result) throw createHttpError(404, `Note not found`);

  res.status(200).json(result);
};

export const createNote = async (req, res) => {
  const { _id: userId } = req.user;

  const result = await Note.create({ ...req.body, userId });

  res.status(201).json(result);
};

export const deleteNote = async (req, res) => {
  const { noteId: _id } = req.params;
  const { _id: userId } = req.user;

  const result = await Note.findOneAndDelete({ _id, userId });

  if (!result) throw createHttpError(404, `Note not found`);

  res.status(200).json(result);
};

export const updateNote = async (req, res) => {
  const { noteId: _id } = req.params;
  const { _id: userId } = req.user;

  const result = await Note.findOneAndUpdate({ _id, userId }, req.body, {
    returnDocument: 'after',
  });
  if (!result) throw createHttpError(404, `Note not found`);
  res.status(200).json(result);
};
