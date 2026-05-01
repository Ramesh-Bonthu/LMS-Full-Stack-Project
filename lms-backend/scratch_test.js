const { sequelize, Announcement } = require('./db');
const { Op } = require('sequelize');

async function test() {
  await sequelize.sync();
  console.log("All announcements:");
  const all = await Announcement.findAll();
  console.log(all.map(a => a.toJSON()));

  console.log("\nStudent query:");
  const studentAnns = await Announcement.findAll({
    where: { audience: { [Op.in]: ["ALL", "STUDENTS"] } }
  });
  console.log(studentAnns.map(a => a.toJSON()));
}

test().catch(console.error);
