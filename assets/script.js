// Initialize Database
const dbRequest = indexedDB.open("travelOneDB", 1);

dbRequest.onupgradeneeded = function (event) {
  const db = event.target.result;

  if (!db.objectStoreNames.contains("trips")) {
    const store = db.createObjectStore("trips", { keyPath: "id" });
    store.createIndex("byStartDate", "startDate", { unique: false });
    store.createIndex("byEndDate", "endDate", { unique: false });
  }
};

dbRequest.onsuccess = function () {
  console.log("Database initialized successfully.");
};

dbRequest.onerror = function () {
  console.error("Error initializing database:", dbRequest.error);
};

// Toggle Menu
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("menu").classList.toggle("hidden");
});

// Show/Hide Sections
const sections = {
  addTrip: document.getElementById("addTripSection"),
  viewTrips: document.getElementById("viewTripsSection"),
  tripDetails: document.getElementById("tripDetailsSection"),
};

function hideAllSections() {
  Object.values(sections).forEach((section) => section.classList.add("hidden"));
}

document.getElementById("addTripBtn").addEventListener("click", () => {
  hideAllSections();
  sections.addTrip.classList.remove("hidden");
});

document.getElementById("viewTripsBtn").addEventListener("click", () => {
  hideAllSections();
  sections.viewTrips.classList.remove("hidden");
  displayAllTrips(); // Fetch and display trips
});







// Add or Edit a Trip   2

document.getElementById("tripInputForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const isEditing = form.dataset.editingTrip; // Check if editing mode is active
  const tripId = parseInt(document.getElementById("tripId").value);
  const location = document.getElementById("location").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const notes = document.getElementById("notes").value;
  const photoFiles = document.getElementById("photoUpload").files;

  // Convert photos to Base64
  const photoPromises = Array.from(photoFiles).map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject("Error reading file");
      reader.readAsDataURL(file);
    });
  });

  Promise.all(photoPromises).then((photos) => {
    const dbRequest = indexedDB.open("travelOneDB", 1);

    dbRequest.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction("trips", "readwrite");
      const store = transaction.objectStore("trips");

      if (isEditing) {
        // Update existing trip
        const getRequest = store.get(parseInt(isEditing));
        getRequest.onsuccess = function () {
          const trip = getRequest.result;
          if (trip) {
            trip.location = location;
            trip.startDate = startDate;
            trip.endDate = endDate;
            trip.notes = notes;

            // Append new photos to existing ones
            trip.photos = [...trip.photos, ...photos];

            store.put(trip);
            alert("Trip updated successfully!");
          }
          form.dataset.editingTrip = ""; // Reset editing mode
          document.getElementById("tripId").disabled = false; // Re-enable Trip ID input
        };
      } else {
        // Add a new trip
        const newTrip = {
          id: tripId,
          location,
          startDate,
          endDate,
          notes,
          dailyNotes: {}, // Placeholder for now
          photos,
        };

        // Check if trip ID already exists
        const getRequest = store.get(tripId);
        getRequest.onsuccess = function () {
          if (getRequest.result) {
            alert(`Trip ID ${tripId} already exists! Pick another trip number.`);
          } else {
            store.put(newTrip);
            alert("Trip added successfully!");
          }
        };
      }

      // Reset the form and refresh the trip list
      document.getElementById("tripInputForm").reset();
      displayAllTrips();
    };

    dbRequest.onerror = function () {
      console.error("Error opening database:", dbRequest.error);
    };
  });
});




function displayAllTrips() {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readonly");
    const store = transaction.objectStore("trips");

    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = function () {
      const trips = getAllRequest.result;
      const tripList = document.getElementById("tripList");
      tripList.innerHTML = ""; // Clear previous list

      if (trips.length === 0) {
        tripList.innerHTML = "<p>No trips available.</p>";
        return;
      }

      trips.forEach((trip) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <div>
            <span style="font-weight: bold;">Trip ${trip.id}: ${trip.location}</span>
            <button onclick="editTrip(${trip.id})" style="margin-left: 10px; background-color: #ffa500;">Edit</button>
            <button onclick="deleteTrip(${trip.id})" style="margin-left: 10px; background-color: #ff0000;">Delete</button>
          </div>
        `;

        // Add click event to display trip details
        listItem.addEventListener("click", () => displayTrip(trip));

        tripList.appendChild(listItem);
      });
    };

    getAllRequest.onerror = function () {
      console.error("Error fetching trips:", getAllRequest.error);
    };
  };

  dbRequest.onerror = function () {
    console.error("Error opening database:", dbRequest.error);
  };
}




// Display Trip Details with Notes and Photos   1
function displayTrip(trip) {
  const detailsContainer = document.getElementById("tripDetails");

  const photos = (trip.photos || [])
    .map(
      (photo, index) => `
        <img 
          src="${photo}" 
          alt="Photo ${index + 1}" 
          style="width: 100px; height: auto; cursor: pointer;" 
          onclick="window.open('${photo}', '_blank')" 
        /> <button onclick="deletePhoto(${trip.id}, ${index})">Delete</button>`
    )
    .join("");

  const dailyNotes = Object.entries(trip.dailyNotes || {})
    .map(
      ([date, note]) => `
        <div>
          <strong>${date}:</strong> ${note}
          <button onclick="deleteNote(${trip.id}, '${date}')">Delete</button>
        </div>`
    )
    .join("");




  detailsContainer.innerHTML = `
    <h2>Trip ${trip.id}</h2>
    <button id="hideTripDetailsBtn">Hide Trip Details</button>
    <div id="tripDetailsContent">
      <p><strong>Location:</strong> ${trip.location}</p>
      <p><strong>Start Date:</strong> ${trip.startDate}</p>
      <p><strong>End Date:</strong> ${trip.endDate}</p>
      <p><strong>Notes:</strong> ${trip.notes}</p>
      <h3>Daily Notes:</h3>
      <button id="hideDailyNotesBtn">Hide Daily Notes</button>
      <div id="dailyNotesContent">
        ${dailyNotes || "<p>No notes available.</p>"}
        <button onclick="addNotePrompt(${trip.id})">Add Note</button>
      </div>
      <h3>Photos:</h3>
      <div>${photos || "<p>No photos available.</p>"}</div>
      <button onclick="addPhotoPrompt(${trip.id})">Add Photo</button>
      <div style="margin-top: 20px;">
        <button onclick="editTrip(${trip.id})" style="background-color: #ffa500;">Edit Trip</button>
        <button onclick="deleteTrip(${trip.id})" style="background-color: #ff0000;">Delete Trip</button>
      </div>
    </div>
  `;


  
  // Show trip details section
  document.getElementById("tripDetailsSection").classList.remove("hidden");
}

  // Toggle visibility helper
  const addToggleEvent = (buttonId, contentId, showText, hideText) => {
    const button = document.getElementById(buttonId);
    const content = document.getElementById(contentId);
    button.addEventListener("click", () => {
      content.classList.toggle("hidden");
      button.textContent = content.classList.contains("hidden") ? showText : hideText;
    });
  };

  // Add toggle event listeners
  addToggleEvent("hideTripDetailsBtn", "tripDetailsContent", "Show Trip Details", "Hide Trip Details");
  addToggleEvent("hideDailyNotesBtn", "dailyNotesContent", "Show Daily Notes", "Hide Daily Notes");
  addToggleEvent("hideAllTripsBtn", "tripList", "Show All Trips", "Hide All Trips");



  function editTrip(tripId) {
    const dbRequest = indexedDB.open("travelOneDB", 1);
  
    dbRequest.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction("trips", "readonly");
      const store = transaction.objectStore("trips");
  
      const getRequest = store.get(tripId);
      getRequest.onsuccess = function () {
        const trip = getRequest.result;
        if (trip) {
          // Pre-fill form fields with trip details
          document.getElementById("tripId").value = trip.id;
          document.getElementById("location").value = trip.location;
          document.getElementById("startDate").value = trip.startDate;
          document.getElementById("endDate").value = trip.endDate;
          document.getElementById("notes").value = trip.notes;
  



          // Prevent editing the trip ID
          document.getElementById("tripId").disabled = true;

          // Show the Add/Edit section
          hideAllSections();
          sections.addTrip.classList.remove("hidden");
  
          // Change form behavior to save changes instead of adding a new trip
          const form = document.getElementById("tripInputForm");
          form.dataset.editingTrip = tripId; // Store the trip ID being edited
          alert("Edit the trip details and click 'Save Changes' to update.");
        }
      };
  
      getRequest.onerror = function () {
        console.error("Error fetching trip details:", getRequest.error);
      };
    };
  
    dbRequest.onerror = function () {
      console.error("Error opening database:", dbRequest.error);
    };
  }








  function deleteTrip(tripId) {
    if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      return;
    }
  
    const dbRequest = indexedDB.open("travelOneDB", 1);
  
    dbRequest.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction("trips", "readwrite");
      const store = transaction.objectStore("trips");
  
      const deleteRequest = store.delete(tripId);
      deleteRequest.onsuccess = function () {
        alert(`Trip ${tripId} deleted successfully!`);
        displayAllTrips(); // Refresh the trip list
        hideAllSections(); // Hide trip details section
        sections.viewTrips.classList.remove("hidden"); // Show trip list
      };
  
      deleteRequest.onerror = function () {
        console.error("Error deleting trip:", deleteRequest.error);
      };
    };
  }




// Add Note
function addNotePrompt(tripId) {
  const date = prompt("Enter date (YYYY-MM-DD):");
  const note = prompt("Enter note:");
  if (date && note) {
    addNoteToTrip(tripId, date, note);
  }
}

function addNoteToTrip(tripId, date, note) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        trip.dailyNotes[date] = note;
        store.put(trip);
        displayTrip(trip);
      }
    };
  };
}






// Delete Photo
function deletePhoto(tripId, photoIndex) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        trip.photos.splice(photoIndex, 1); // Remove photo by index
        store.put(trip);
        displayTrip(trip);
      }
    };
  };
}



// Display Trip Details with Notes and Photos    1
function displayTrip(trip) {
  const detailsContainer = document.getElementById("tripDetails");

  // Photos Section
  const photos = (trip.photos || [])
    .map(
      (photo, index) => `
        <div style="display: inline-block; margin-right: 10px;">
          <img 
            src="${photo}" 
            alt="Photo ${index + 1}" 
            style="width: 100px; height: auto; cursor: pointer;" 
            onclick="window.open('${photo}', '_blank')" 
          />
          <button onclick="deletePhoto(${trip.id}, ${index})" style="display: block; margin-top: 5px;">Delete</button>
        </div>`
    )
    .join("");

  // Daily Notes Section
  const dailyNotes = Object.entries(trip.dailyNotes || {})
    .map(
      ([date, note]) => `
        <div>
          <strong>${date}:</strong> ${note}
          <button onclick="deleteNote(${trip.id}, '${date}')">Delete</button>
        </div>`
    )
    .join("");

  // Render the Trip Details
  detailsContainer.innerHTML = `
    <h2>Trip ${trip.id}</h2>
    <button id="hideTripDetailsBtn">Hide Trip Details</button>
    <div id="tripDetailsContent">
      <p><strong>Location:</strong> ${trip.location}</p>
      <p><strong>Start Date:</strong> ${trip.startDate}</p>
      <p><strong>End Date:</strong> ${trip.endDate}</p>
      <p><strong>Notes:</strong> ${trip.notes}</p>
      <h3>Daily Notes:</h3>
      <button id="hideDailyNotesBtn">Hide Daily Notes</button>
      <div id="dailyNotesContent">
        ${dailyNotes || "<p>No notes available.</p>"}
        <button onclick="addNotePrompt(${trip.id})">Add Note</button>
      </div>
      <h3>Photos:</h3>
      <div>${photos || "<p>No photos available.</p>"}</div>
      <button onclick="addPhotoPrompt(${trip.id})">Add Photo</button>
    </div>
  `;

  // Show the trip details section
  document.getElementById("tripDetailsSection").classList.remove("hidden");

  // Add event listener for hiding trip details
  const hideTripDetailsBtn = document.getElementById("hideTripDetailsBtn");
  const tripDetailsContent = document.getElementById("tripDetailsContent");
  hideTripDetailsBtn.addEventListener("click", () => {
    tripDetailsContent.classList.toggle("hidden");
    hideTripDetailsBtn.textContent = tripDetailsContent.classList.contains("hidden")
      ? "Show Trip Details"
      : "Hide Trip Details";
  });

  // Add event listener for hiding daily notes
  const hideDailyNotesBtn = document.getElementById("hideDailyNotesBtn");
  const dailyNotesContent = document.getElementById("dailyNotesContent");
  hideDailyNotesBtn.addEventListener("click", () => {
    dailyNotesContent.classList.toggle("hidden");
    hideDailyNotesBtn.textContent = dailyNotesContent.classList.contains("hidden")
      ? "Show Daily Notes"
      : "Hide Daily Notes";
  });
}




// Add Daily Note Prompt
function addNotePrompt(tripId) {
  const date = prompt("Enter date (YYYY-MM-DD):");
  const note = prompt("Enter note:");
  if (date && note) {
    addNoteToTrip(tripId, date, note);
  }
}

// Add Note to Trip
function addNoteToTrip(tripId, date, note) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        trip.dailyNotes[date] = note; // Add the new note
        store.put(trip); // Update the trip in the database
        alert("Note added successfully!");
        displayTrip(trip); // Refresh the trip details
      }
    };
  };
}




// Delete Note from Trip
function deleteNote(tripId, date) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        delete trip.dailyNotes[date]; // Remove the note
        store.put(trip); // Update the trip in the database
        alert("Note deleted successfully!");
        displayTrip(trip); // Refresh the trip details
      }
    };
  };
}




// Add Photo Prompt
function addPhotoPrompt(tripId) {
  const photoInput = document.createElement("input");
  photoInput.type = "file";
  photoInput.accept = "image/*";

  photoInput.onchange = function () {
    const file = photoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      addPhotoToTrip(tripId, event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input dialog
  photoInput.click();
}

// Add Photo to Trip
function addPhotoToTrip(tripId, photoData) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        trip.photos.push(photoData); // Add the photo
        store.put(trip); // Update the trip in the database
        alert("Photo added successfully!");
        displayTrip(trip); // Refresh the trip details
      }
    };
  };
}




// Delete Photo
function deletePhoto(tripId, photoIndex) {
  const dbRequest = indexedDB.open("travelOneDB", 1);

  dbRequest.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction("trips", "readwrite");
    const store = transaction.objectStore("trips");

    const getRequest = store.get(tripId);
    getRequest.onsuccess = function () {
      const trip = getRequest.result;
      if (trip) {
        trip.photos.splice(photoIndex, 1); // Remove photo by index
        store.put(trip); // Update the trip in the database
        alert("Photo deleted successfully!");
        displayTrip(trip); // Refresh the trip details
      }
    };
  };
}



