// Reset Database Functionality - Unimplemented but available
document.getElementById("resetDatabase").addEventListener("click", function () {
  const deleteRequest = indexedDB.deleteDatabase("phillieUnoDB");

  deleteRequest.onsuccess = function () {
    console.log("Database deleted successfully.");
    alert("Database has been reset.");
  };

  deleteRequest.onerror = function () {
    console.error("Error deleting database:", deleteRequest.error);
    alert("Failed to reset the database.");
  };

  deleteRequest.onblocked = function () {
    console.warn("Database deletion blocked. Close other tabs accessing the database.");
    alert("Database reset is blocked. Close all other tabs using this app and try again.");
  };
});