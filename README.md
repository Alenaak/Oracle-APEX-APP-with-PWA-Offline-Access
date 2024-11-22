# **Steps to Create an Oracle APEX APP PWA for Offline Access**

### **1. Create a New Oracle APEX Workspace**
1. **Sign in to Oracle APEX**:
   - Log in to your Oracle APEX account.
2. **Create a Workspace**:
   - If not already created, set up a new workspace.
   - Configure the database schema and workspace settings.

---

### **2. Build a New Application**
1. Navigate to the **App Builder** in your workspace.
2. Select **Create** → **New Application**.
3. Provide the following details:
   - **Name**: Set a meaningful name for the app.
   - **Features**: Enable **Progressive Web App (PWA)**.
   - **Navigation**: Configure pages for navigation.

---

### **3. Configure Static Files**
1. Go to **Shared Components** → **Static Application Files**.
2. Upload:
   - **`service-worker.js`**: Handles caching and offline availability.
   - **`app.js`**: Manages IndexedDB and data caching.
3. Ensure the files are correctly linked to your application.

---

### **4. Set Up the Service Worker**
1. **Incorporate the Service Worker**:
   - Include the script in your application template or `app.js`:
     ```javascript
     if ('serviceWorker' in navigator) {
         navigator.serviceWorker.register('service-worker.js')
             .then(reg => console.log('Service Worker Registered:', reg))
             .catch(err => console.error('Service Worker Registration Failed:', err));
     }
     ```
2. Configure caching strategies in `service-worker.js`:
   - Define which assets (HTML, CSS, JS) and API responses are cached.

---

### **5. Create Data Entry Functionality**
1. **Add a Form Page**:
   - Create a form page with fields like **Name**, **City**, and **Phone**.
2. **Add a Button**:
   - Label the button as **"Create"** or similar.
   - Set its action to execute a JavaScript function:
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

### **6. Set Up IndexedDB for Offline Data**
1. Use `IndexedDB` to save data locally when the user is offline:
   ```javascript
   function saveDataToIndexedDb() {
       const data = { x01: $v("P4_CITY"), x02: $v("P4_NAME"), x03: $v("P4_PHONE") };
       const request = indexedDB.open("offline-forms", 1);
       request.onupgradeneeded = (event) => {
           const db = event.target.result;
           if (!db.objectStoreNames.contains("forms")) {
               db.createObjectStore("forms", { keyPath: "id", autoIncrement: true });
           }
       };
       request.onsuccess = (event) => {
           const db = event.target.result;
           const tx = db.transaction("forms", "readwrite");
           const store = tx.objectStore("forms");
           store.add(data);
       };
   }
