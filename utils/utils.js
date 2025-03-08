const assignBadges = async (user) => {
  const badges = [];

  if (user.points >= 100) {
    badges.push("Beginner");
  } else if (user.points >= 500) {
    badges.push("Intermediate");
  } else if (user.badges >= 1000) {
    badges.push("Expert");
  }

  user.badges = [...new Set([...user.badges, ...badges])];
  await user.save();
};

await assignBadges(user);

const trackUserStreak = async (user) => {
  const today = new Date().toDateString();
  const lastActive = user.lastActive
    ? new Date(user.lastActive).toDateString()
    : null;

  if (lastActive && today === lastActive) {
    return;
  } else if (
    lastActive &&
    new Date(lastActive).getTime() === new Date(today).getTime() - 86400000
  ) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  user.lastActive = new Date();

  await user.save();
};

await trackUserStreak(user);
