import createHttpError from 'http-errors';

const notFoundHandler = (req, res) => {
  throw createHttpError(404, 'Route not found');
};

export default notFoundHandler;
