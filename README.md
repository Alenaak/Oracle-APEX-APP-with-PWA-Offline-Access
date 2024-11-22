# **Steps to Create an Oracle APEX App PWA for Offline Access**

### **1. Create a New Oracle APEX Workspace**
1. **Sign in to Oracle APEX**:
   - Log in to your Oracle APEX account:  
     [https://apex.oracle.com/en/](https://apex.oracle.com/en/)
     
2. **Create a Workspace**:
   - If not already created, set up a new workspace.
   - Configure the database schema and workspace settings.

---

### **2. Build a New Application**
1. Navigate to the **App Builder** in your workspace.
2. Select **Create** → **New Application**.
3. Choose the CSV or JSON of your choice to create the application. (Here, I chose JSON.)
4. Provide the following details:
   - **Name**: Set a meaningful name for the app.
   - **Features**: Enable **Progressive Web App (PWA)**.
   - **Navigation**: Configure pages for navigation.

---

### **3. Configure Static Files**
1. Go to **Shared Components** → **Static Application Files**.
2. Upload the following files:
   - **`sw.js`**: Handles caching and offline availability.
   - **`app.js`**: Manages IndexedDB and data caching.
3. Ensure the files are correctly linked to your application.

---

### **4. Set Up the Service Worker**
1. **Incorporate the Service Worker**:
   - Copy the path of the `sw.js` file and paste it in **Shared Components** → **User Interface** → **Progressive Web App** → **Service Worker Configuration** → **File URL**.

---

### **5. Create Data Entry Functionality**
1. **Add a Form Page**:
   - Go to the page where data fields are provided for entry. Oracle will handle creating the application automatically for you.
2. **Add a Button**:
   - Label the button as **"Create"** or similar.
   - Set its action to execute a JavaScript function that will save the data to IndexedDB when the user is offline:
     ```javascript
     if (!navigator.onLine) {
         saveDataToIndexedDb();
     } else {
         console.log("ONLINE");
         apex.server.process(
             "insertion",
             {
                 x01: $v("P4_CITY"),
                 x02: $v("P4_NAME"),
                 x03: $v("P4_PHONE")
             },
             {
                 success: function (data) {
                     // Show a success message
                     apex.message.showPageSuccess("Data successfully inserted into the database!");
                 },
                 error: function (xhr, status, error) {
                     // Show an error message
                     console.error("Error during data insertion:", error);
                     apex.message.showErrors([
                         {
                             type: "error",
                             location: "page",
                             message: "Error during data insertion: " + error,
                             unsafe: false
                         }
                     ]);
                 }
             }
         );
     }

     // Function to save data to IndexedDB
     function saveDataToIndexedDb() {
         const data = {
             x01: $v("P4_CITY"),
             x02: $v("P4_NAME"),
             x03: $v("P4_PHONE")
         };

         const dbRequest = indexedDB.open("offline-forms", 1);

         dbRequest.onupgradeneeded = (event) => {
             const db = event.target.result;
             if (!db.objectStoreNames.contains("forms")) {
                 db.createObjectStore("forms", { keyPath: "id", autoIncrement: true });
             }
         };

         dbRequest.onsuccess = (event) => {
             const db = event.target.result;
             const transaction = db.transaction("forms", "readwrite");
             const store = transaction.objectStore("forms");

             store.add(data);

             transaction.oncomplete = () => {
                 apex.message.showPageSuccess("Data saved locally as you are offline.");
             };

             transaction.onerror = (err) => {
                 console.error("Transaction error:", err);
                 apex.message.showErrors([
                     {
                         type: "error",
                         location: "page",
                         message: "Failed to save data locally.",
                         unsafe: false
                     }
                 ]);
             };
         };

         dbRequest.onerror = (err) => {
             console.error("IndexedDB error:", err);
             apex.message.showErrors([
                 {
                     type: "error",
                     location: "page",
                     message: "Error accessing local database.",
                     unsafe: false
                 }
             ]);
         };
     }
     ```

---

### **6. Load Data from IndexedDB on Page Reload When User Gets Online**
1. Add the following code to be executed when the page reloads, so the data is synced when the user gets back online:
   ```javascript
   // Sync offline data to database when the user comes back online

       syncIndexedDbToDatabase();
   

   function syncIndexedDbToDatabase() {
       const dbRequest = indexedDB.open("offline-forms", 1);

       dbRequest.onsuccess = (event) => {
           const db = event.target.result;
           const transaction = db.transaction("forms", "readonly");
           const store = transaction.objectStore("forms");
           const getAllRequest = store.getAll();

           getAllRequest.onsuccess = () => {
               const offlineData = getAllRequest.result;

               if (offlineData.length > 0) {
                   offlineData.forEach((record) => {
                       apex.server.process(
                           "insertion",
                           {
                               x01: record.x01,
                               x02: record.x02,
                               x03: record.x03
                           },
                           {
                               success: function (data) {
                                   // Assume data is successfully inserted if we get a response
                                   console.log("Record processed successfully:", record);
                                 
                               },
                               error: function (xhr, status, error) {
                                   console.log("Error occurred, but verifying server status...", error);
                               }
                           }
                       );
                   });

                   apex.message.showPageSuccess("Data sync process completed.");
               } else {
                   apex.message.showPageSuccess("No offline data to sync.");
               }
           };

           getAllRequest.onerror = (err) => {
               console.error("Error fetching data from IndexedDB:", err);
               apex.message.showErrors([
                   {
                       type: "error",
                       location: "page",
                       message: "Error fetching offline data.",
                       unsafe: false
                   }
               ]);
           };
       };

       dbRequest.onerror = (err) => {
           console.error("Error opening IndexedDB:", err);
           apex.message.showErrors([
               {
                   type: "error",
                   location: "page",
                   message: "Error accessing offline database.",
                   unsafe: false
               }
           ]);
       };
   }

 
