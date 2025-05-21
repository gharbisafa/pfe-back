const Event = require("../models/event");

const getPaginatedEvents = async (
  filter = {},
  projection = {},
  page = 1,
  limit = 10,
  sort = {}
) => {
  const skip = (page - 1) * limit;

  // Query to retrieve events with pagination and sorting
  const events = await Event.find(filter, projection)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  // Get the total count of events
  const totalCount = await Event.countDocuments(filter);

  // Calculate total pages and check if there is a next page
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
