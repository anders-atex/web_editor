// -------------------------------------------
// -- DB management functions and helpers
//
var Persistor = (function() {
	var publicAPI = {};
	var pouchdb = null;
	var currentContentId = null;
	var currentRevision = null;

	// Initialize local Pouch store
	var createContentDB = function() {
		Pouch('idb://content', function(err, db) {
	   pouchdb = db;
	 	});
	} 

	// Save content in local DB
	var save = function(content, asNew) {

		if(asNew) {
			// NEW DOC. First save --> db.post
			pouchdb.post(content, function(err, response) {
				if(err) {
					console.log("SAVE NEW: ERROR Saving new doc");
					console.log(err);
					return;
				}
				if(response.ok) {
					console.log(response);
					currentContentId = response.id;
					currentRevision = response.rev;
					contentDirty = false;
				}
			});
		} else { 
			// Save a new revision of the content
			content._id = currentContentId;
			content._rev = currentRevision;

			pouchdb.put(content, function(err, response) {
				if(err) {
					console.log("SAVE: ERROR Saving");
					console.log(err);
					return;
				}
				if(response.ok) {
					console.log(response);
					currentContentId = response.id;
					currentRevision = response.rev;
					contentDirty = false;

				}
			});
		}
	}

	var loadImageAttachmentFromDB = function(docId, fileName, imageDivContainer) {
		FileDragDrop.clearData();
		console.log('Loading attachment: '+fileName);
		pouchdb.get(docId+'/'+fileName, function(err, result) {
			if(err) {
				console.log('ERROR loading attachment named '+fileName+' from doc id '+docId);
			} else {
				console.log('loading file '+fileName);
				dataArray.push({name : fileName, value : result});
				$('#file_list').append('<div class="" style="background: url('+result+'); width: 50px; height: 50px; background-size: cover;"> </div>'); 
			}
		});
	}

	// Needs separation of component names (hardcoded now)
	var populateContentEditor = function(doc) {
		$('#content_title').empty().append(doc.title).attr('content_id',doc._id).attr('component_name','title');
		$('#content_lead').empty().append(doc.lead).attr('content_id',doc._id).attr('component_name','lead');
		$('#content_body').empty().append(doc.body).attr('content_id',doc._id).attr('component_name','body');

		if(!doc._attachments)
			return;

		for(var file in doc._attachments) {
			loadImageAttachmentFromDB(currentContentId, file, $('#file_list'));
		}
	}

	// Populate document list from local DB.
	var listDocs = function(htmlElement) {

		// Clear the DOM holding the list
		htmlElement.empty();

		// Query DB for all documents and populate DOM			
		pouchdb.query({map: function(doc) {
    											emit(doc, null);
												}
									}, 
									{reduce: false}, function(err, response){
			if(err) return;
			$(response.rows).each(function(index) {
				var title = response.rows[index].key.title;
				var id = response.rows[index].key._id;
				var checked = "";
				if(index == 0) 
					checked = "checked";

				htmlElement.append('<label class="radio"><input type="radio" name="optionsRadios" id="optionsRadios1" value="'+id+'" '+checked+'><span class="text-info">'+title+'</span>&nbsp;&nbsp;&nbsp;<i class="icon-tags muted"> </i><span class="muted"><small>Ticket-name, Web-context: mySite.com/sports</small></span></label>');
			});
		});
	}

	// Load a document from the local DB into the edit view
	var loadLocal = function(itemId) {
		pouchdb.get(itemId, function(err, doc) {
			if(err) {
				console.log("Failed to load doc with id: "+itemId);
				console.log(err);
				alert("Could not load the requested document.");
			} else {
				console.log("Loading item: "+itemId);
				console.log(doc);
				populateContentEditor(doc);
				currentContentId = itemId;
				currentRevision = doc._rev;
			}
		});
	}

	// PUBLIC API BELOW
	//


	publicAPI.createContentDB = createContentDB;
	publicAPI.loadLocal = loadLocal;
	publicAPI.save = save;
	publicAPI.listDocs = listDocs;
	publicAPI.clearDB = createContentDB;
	publicAPI.getCurrentContentId = function() { return currentContentId; };
	publicAPI.getCurrentRevision = function() { return currentRevision; };
	publicAPI.clearState = function() { currentContentId = currentRevision = null; };

	return publicAPI;
}());