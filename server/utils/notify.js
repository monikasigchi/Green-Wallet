import Notification from "../models/Notification.js";
export async function notify(user, type, title, message, relatedType = "", relatedId = null) {
  if (!user) return;
  await Notification.create({ user, type, title, message, relatedType, relatedId });
}
