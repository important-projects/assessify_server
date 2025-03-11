const cron = require("node-cron");
const Test = require("../models/Test");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredTests = await Test.find({
      status: "active",
      endTime: { $lte: now },
    });

    for (let test of expiredTests) {
      test.status = "completed";
      await test.save();
      console.log(`Test ${test._id} auto-submitted.`);
    }
  } catch (error) {
    console.error("Error in auto-submit job:", error);
  }
});
