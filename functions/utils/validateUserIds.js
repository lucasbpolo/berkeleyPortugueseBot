// Middleware function to validate user IDs
const validateUserIds = (db) => {
  return async (ctx, next) => {
    const fromId = ctx.from.id;

    const snapshot = await db.ref('authorizedUserIds').once('value');
    const authorizedUserIds = snapshot.val();

    if (authorizedUserIds.includes(fromId)) {
      return next();
    } else {
      throw new Error('Você não está autorizado a usar este bot ainda!');
    }
  };
};

module.exports = validateUserIds;
