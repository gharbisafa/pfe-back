const Event = require("../models/event");

const getPaginatedEvents = async (
  filter = {},
  projection = {},
  page = 1,
  limit = 10,
  sort = {}
) => {
  const skip = (page - 1) * limit;

  const events = await Event.find(filter, projection)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  const totalCount = await Event.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;

  return {
    events,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
    },
  };
};

module.exports = {
  getPaginatedEvents,
};
