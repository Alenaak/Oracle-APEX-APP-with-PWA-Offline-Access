// App.JS

// Listner to check if online status
window.addEventListener('online', function() {
    apex.message.showPageSuccess('You are back online!');
    uploadOfflineFormData();
});

// Listner to check if offline status
window.addEventListener('offline', function() {
  $('#t_Alert_Success').remove();
  apex.message.clearErrors();
  apex.message.showErrors([{
    type: 'error',
    location: 'page',
    message: 'You have lost connection'
  }]);
});

// Process call to insert data offline data back to server
function submitIndexdbData(formData) {
        apex.server.process( "syncInsertion", {
        x01: formData.get('City'),
        x02: formData.get('Name'),
        x03: formData.get('Phone')
        }, {
            success: function(data)  {
        },
            error: function( jqXHR, textStatus, errorThrown ) {
            apex.page.submit();  
            $('#t_Alert_Success').remove();
            apex.message.showPageSuccess("Submitted Offline Data")
        }
        });
}

// Cache management

function uploadOfflineFormData() {
    const request = indexedDB.open('offline-forms', 1);
    request.onerror = function(event) {
        console.error('Error opening IndexedDB:', event.target.error);
    };
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['forms'], 'readwrite');
        const objectStore = transaction.objectStore('forms');
        const getAllRequest = objectStore.getAll();
        getAllRequest.onerror = function(event) {
            console.error('Error retrieving form data from IndexedDB:', event.target.error);
        };
        getAllRequest.onsuccess = async function(event) {
            const formDataArray = event.target.result;
            for (const formDataEntry of formDataArray) {
                const formData = new FormData();
                Object.entries(formDataEntry).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                try {
                    await submitIndexdbData(formData);
                    objectStore.delete(formDataEntry.id);
                } catch (error) {
                    console.error('Error uploading form data:', error.message);
                }
            }
   };
};
}