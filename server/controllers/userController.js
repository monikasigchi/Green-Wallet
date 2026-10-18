export async function updateProfile(req, res) {
  const user = req.user;
  const { name, phone, address, serviceArea, description, contactDetails, organisationName } = req.body;
  if (name !== undefined) { if (String(name).trim().length < 2 || String(name).length > 120) return res.status(400).json({ message: "Name must be 2–120 characters." }); user.name = String(name).trim(); }
  if (phone !== undefined) { if (String(phone).trim().length < 7 || String(phone).length > 24) return res.status(400).json({ message: "Enter a valid phone number." }); user.phone = String(phone).trim(); }
  if (user.role === "household" && address !== undefined) user.householdProfile.address = String(address).slice(0,500);
  if (user.role === "collector" && serviceArea !== undefined) user.collectorProfile.serviceArea = String(serviceArea).slice(0,200);
  if (user.role === "organisation") {
    if (organisationName !== undefined) user.organisationProfile.organisationName = String(organisationName).slice(0,140);
    if (description !== undefined) user.organisationProfile.description = String(description).slice(0,1000);
    if (contactDetails !== undefined) user.organisationProfile.contactDetails = String(contactDetails).slice(0,300);
  }
  await user.save();
  res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, householdProfile: user.householdProfile, collectorProfile: user.collectorProfile, organisationProfile: user.organisationProfile } });
}
