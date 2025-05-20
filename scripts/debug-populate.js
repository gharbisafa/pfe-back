// const mongoose = require("mongoose");
// const Event = require("../models/event"); // Adjust the path to your Event model
// const User = require("../models/user");   // Adjust the path to your User model
// const UserAccount = require("../models/userAccount");  // Adjust the path to your UserAccount model

// const debugPopulation = async () => {
//     try {
//         // Connect to MongoDB
//         await mongoose.connect("mongodb+srv://atlas-sample-dataset-load-67f666a2c345691b488148fb:O8ejnaxs0hmlpOW5@cluster0.pcz5mvg.mongodb.net/test?retryWrites=true&w=majority", {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });

//         console.log("Connected to MongoDB");

//        db.events.find({ _id: ObjectId("680cd30f05d0d9868143a70e") });

//         // Disconnect from MongoDB
//         await mongoose.disconnect();
//         console.log("Disconnected from MongoDB");
//     } catch (error) {
//         console.error("Error during debugging:", error);
//     }
// };

// // Run the debug function
// debugPopulation();