export const getUserFromBackend = async (userId) => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`);
  return res.json();
};

export const addUserToBackend = async (user) => {
  console.log("📌 Sending to backend:", user);

  const formattedUser = {
    user_id: user.id,
    name: `${user.givenName || ""} ${user.familyName || ""}`.trim(),
    email: user.email,
    credits: 100 // ✅ Assign default credits
  };

  console.log("✅ Reformatted for backend:", formattedUser);

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formattedUser),
  });

  return res.json();
};
