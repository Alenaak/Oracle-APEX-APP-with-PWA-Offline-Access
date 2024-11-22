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
         saveDataToIndexedDb(); // Store locally when offline
     } else {
         // Send data to Oracle APEX database
         apex.server.process("insertion", { 
             x01: $v("P4_CITY"), 
             x02: $v("P4_NAME"), 
             x03: $v("P4_PHONE") 
         });
     }
     ```

---

### **6. Load Data from IndexedDB on Page Reload When User Gets Online**
1. Add the following code to be executed when the page reloads, so the data is synced when the user gets back online:
   ```javascript
   window.addEventListener('online', function () {
       syncIndexedDbToDatabase();
   });

   function syncIndexedDbToDatabase() {
       const dbRequest = indexedDB.open("offline-forms", 1);

       dbRequest.onsuccess = (event) => {
           const db = event.target.result;
           const transaction = db.transaction("forms", "readwrite");
           const store = transaction.objectStore("forms");

           store.getAll().onsuccess = function (event) {
               const unsyncedData = event.target.result;
               unsyncedData.forEach(data => {
                   apex.server.process("insertion", {
                       x01: data.x01,
                       x02: data.x02,
                       x03: data.x03
                   }, {
                       success: function () {
                           deleteFromIndexedDb(data.id);
                       },
                       error: function (err) {
                           console.error("Error syncing data:", err);
                       }
                   });
               });
           };
       };
   }

   function deleteFromIndexedDb(id) {
       const dbRequest = indexedDB.open("offline-forms", 1);

       dbRequest.onsuccess = (event) => {
           const db = event.target.result;
           const transaction = db.transaction("forms", "readwrite");
           const store = transaction.objectStore("forms");
           store.delete(id);
           transaction.oncomplete = () => {
               console.log("Data deleted from IndexedDB");
           };
       };
   }
