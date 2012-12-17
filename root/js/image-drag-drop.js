// -------------------------------------------
// -- Drag & Drop upload
// Much/most of the code from example at http://www.inserthtml.com/2012/08/file-uploader/
// Should probably switch to jquery.upload

// Makes sure the dataTransfer information is sent when we
// Drop the item in the drop box.
var DropTray = (function(dropTarget, fileList) {
	jQuery.event.props.push('dataTransfer');

	// used to hold drag-dropped image data before upload
	var dataArray = [];
	var publicAPI = {};

	// Bind the drop event to the dropzone.
	dropTarget.bind('drop', function(e) {
		
		e.preventDefault();
		var files = e.dataTransfer.files;

		// For each file
		$.each(files, function(index, file) {
						
			// Some error messaging
			if (!files[index].type.match('image.jpeg')) {
				fileList.html('<p id="image_err_msg" class="alert-error text-error">Hey! Images only</p>');
				$('#image_err_msg').fadeOut(1500);
				return false;
			}
						
			// Start a new instance of FileReader
			var fileReader = new FileReader();
				
			// When the filereader loads initiate a function
			fileReader.onload = (function(file) {
				return function(e) {
				
					// Push the data URI into an array
					dataArray.push({name : file.name, value : this.result});
					
					var image = this.result;
										
					// Place the image inside the dropzone
					fileList.append('<div class="" style="background: url('+image+'); width: 70px; height: 70px; background-size: cover;"> </div>'); 
					console.log("Added: "+file.name);
				}; 
					
			})(files[index]);
				
			// For data URI purposes
			fileReader.readAsDataURL(file);

		}); // end .each file
	}); // end bind event

	var createAttachments = function(attachments) {
		$(dataArray).each(function(index, elem) {
			attachments[elem.name] = {};
			attachments[elem.name].content_type = "image/jpeg"; // TODO: Set correct type based on file ext.
			attachments[elem.name].data = elem.value;
		});
	}

	// PUBLIC API BELOW
	//

	publicAPI.clearData = function() {
		dataArray = [];
		fileList.empty();
	};

	publicAPI.isEmpty = function() {
		return (dataArray.length > 0);
	}

	publicAPI.createAttachments = createAttachments;

	return publicAPI;

}($('#drop_target'), $('#file_list')));	
