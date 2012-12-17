// The main code entry.
// Add handlers to buttons and menues. 
// Create DB and anything else that has to be initialized after lage load.
$(document).ready(function() {
	var contentDirty = false;
	var syncServer = 'http://localhost:5984/content'; // Currently not used (need to work around CORS)

	Persistor.createContentDB();

	// -------------------------------------------
	// -- DOM setup and adding event handlers
	//

	var getCurrentContentId = function() {
		return $("input[name=optionsRadios]:checked").attr("value");
	}

	// Decode content component name from element id attribute.
	// Ex. id="content_title" --> "title"
	var getComponentName = function(item) {
		// TODO: Not the most robust way... use own attributes
		return item.attr("id").split('_')[1]
	}

	// Add load handler to the method called by the modal open-dialog.
	var _localLocal = function() {
		Persistor.loadLocal(getCurrentContentId());
		contentDirty = false;
		// Make sure visuals are consistent with the state
		$("#save_text").removeClass("muted");
		$('*[id^="content"]').each(function(index) {
			$(this).removeClass("muted");
		});	
	}

	loadLocal = _localLocal;

	// Enable editor on content_ fields
	Aloha.ready(function() {
		var $ = Aloha.jQuery;
		$('*[id^="content"]').aloha();
	});

	// Helper.
	var clearImagesList = function() {
		DropTray.clearData();
	}

	// Sets the DOM up for new document.
	var newDoc = function() {
		$('*[id^="content"]').each(function(index) {
			$(this).addClass("muted").empty().append("Add text here.").removeAttr("content_id");
			$("#save_text").addClass("muted");
			contentDirty = false;
			Persistor.clearState();
		});
		DropTray.clearData();
	}

	// Helper
	var prepareContentForSave = function() {
		var content = {};
		// Collect all components (title, lead, ...)
		$('*[id^="content"]').each(function(index) {
			prop = $(this);
			content[getComponentName(prop)] = prop.text();
		});
		// Add attachments (images)
		if(!DropTray.isEmpty()) {
			var attachments = {};
			DropTray.createAttachments(attachments);
			content._attachments = attachments;
		}
		return content;
	}

	// Save button handler
	$("#action_save").on("click", function(event){
		var content = prepareContentForSave();

		// Is this a document we already fetched from DB?
		// if not, then save as new, else update 
		var isNew = true;
		if(Persistor.getCurrentContentId())
			isNew = false;

		Persistor.save(content, isNew);
	});

	// Save button handler
	$("#action_save_new").on("click", function(event){
		var content = prepareContentForSave();
		Persistor.save(content, true);		
	});

	$("#action_new").on("click", function(event){
		newDoc();			
	});


	$("#action_open").on("click", function(event){
		Persistor.listDocs($('#db_list'));			
	});

	$("#action_clearDB").on("click", function(event){
		// Erase DB
		Pouch.destroy("idb://content", function(err,info) {
			// Clear div keeping list of DB
			$('#db_list').empty();			
		});

		// Create empty DB, replacing the old we just destroyed
		Persistor.clearDB();
	});

	$("#action_sync").on("click", function(event){
		console.log("Replicating local DB to server");

		Pouch.replicate('idb://content', syncServer, function(err, changes) {
  		if(err) { 
  			console.log("ERROR Replicating DB");
  			console.log(err);
  			alert("Sync failed!")
  		} else {
  			console.log(changes);
  		}
		});
			
	});

	// Add handlers to manage "first edit" scenario. 
	// Remove muted text color, clear dummy texts, mark content dirty (unsaved) 
	// and activate the save button.
	$('*[id^="content"]').each(function(index) {
		$(this).on("click", function(event) {
			if(!contentDirty && (!Persistor.getCurrentContentId())) {
				$('*[id^="content"]').each(function(index) {
					$(this).empty().removeClass("muted");
				});
				$("#save_text").removeClass("muted");
				contentDirty = true;
			} else
				contentDirty = true;
		});
	});

	$('#action_fullscreen').on("click", function() {
		$('#main_editor').fullScreen();
	});


	if($.support.fullscreen)
		console.log("FULLSCREEN SUPPORTED");
	else
		$('#action_fullscreen').hide();

});
