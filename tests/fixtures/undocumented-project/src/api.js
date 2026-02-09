function getUsers() {
  return [];
}

function createUser(name, email) {
  return { id: 1, name, email };
}

function deleteUser(id) {
  return true;
}

function updateUser(id, data) {
  return { id, ...data };
}

module.exports = { getUsers, createUser, deleteUser, updateUser };
