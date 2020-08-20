// Elements
var selectImagesId;
var selectObjectsId;

var canvasId;
var textHiddenId;

var aHiddenAId;

// Vars
var imageFiles = [];

var mContext;
var leftMouseStarted = false;
var leftMouseCount = 0;
var xVerteces = [];
var yVerteces = [];
var roiWidth;
var roiHeight;

function initMain() {
	mContext.clearRect(0, 0, canvasId.width, canvasId.height);
	leftMouseStarted = false;
	leftMouseCount = 0;
	xVerteces = [];
	yVerteces = [];
	roiWidth = 0;
	roiHeight = 0;
	textHiddenId.value = "";
}

function drawImage(img) {
	sx = 0;
	sy = 0;
	swidth = img.width;
	sheight = img.height;

	x = (canvasId.width - roiWidth) / 2;
	y = (canvasId.height - roiHeight) / 2;
	width = roiWidth;
	height = roiHeight;

	mContext.clearRect(0, 0, canvasId.width, canvasId.height);
	mContext.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
	mContext.beginPath();
}

function fileChange() {
	if (selectImagesId.length <= 0) {
		return;
	}
	// Load Image
	var file = imageFiles[selectImagesId.selectedIndex];
	var reader = new FileReader();

	reader.onload = function(){
		var dataURL = reader.result;
		var img = new Image;
		img.onload = function(){
			// initDrawing();
			// initDoc();
			aspect = img.height / img.width;
			roiWidth = canvasId.width;
			roiHeight = canvasId.height;
			if (aspect > 1.0 && img.height > canvasId.height) {
				// Portrait
				roiWidth = (canvasId.height / img.height) * img.width;
			} else if (aspect < 1.0 && img.width > canvasId.width) {
				// Landscape
				roiHeight = (canvasId.width / img.width) * img.height;
			} else {
				roiWidth = img.width;
				roiHeight = img.height;
			}
			drawImage(img);
		};
		img.src = dataURL;
	};

	reader.readAsDataURL(file);
}

/*
 * Relative BBOX calculation:
 * Ref:
 * https://github.com/AlexeyAB/Yolo_mark
 * https://github.com/pjreddie/darknet
*/

function annotateYoLo() {
	var index = selectObjectsId.selectedIndex;
	if (index < 0) {
		index = 0;
	}

	x1 = Math.min.apply(null, xVerteces.slice(0, leftMouseCount));
	y1 = Math.min.apply(null, yVerteces.slice(0, leftMouseCount));
	width = Math.max.apply(null, xVerteces.slice(0, leftMouseCount)) - x1;
	height = Math.max.apply(null, yVerteces.slice(0, leftMouseCount)) - y1;

	mContext.strokeRect(x1, y1, width, height);

	relative_x = x1 - ((canvasId.width - roiWidth) / 2);
	relative_y = y1 - ((canvasId.height - roiHeight) / 2);
	var relative_center_x = (relative_x	+ width / 2) / roiWidth;
	var relative_center_y = (relative_y + height / 2) / roiHeight;
	var relative_width = width / roiWidth;
	var relative_height = height / roiHeight;

	var txt = index
			+ " "
			+ relative_center_x
			+ " "
			+ relative_center_y
			+ " "
			+ relative_width
			+ " "
			+ relative_height
			+ "\n";
	textHiddenId.value += txt;
}

function selectObjectsPrev(e) {
	var index = selectObjectsId.selectedIndex;
	index--;
	if (index < 0) {
		selectObjectsId.selectedIndex = selectObjectsId.length - 1;
	} else {
		selectObjectsId.selectedIndex = index;
	}
}

function selectObjectsNext(e) {
	var index = selectObjectsId.selectedIndex;
	index++;
	if (index > selectObjectsId.length - 1) {
		selectObjectsId.selectedIndex = 0;
	} else {
		selectObjectsId.selectedIndex = index;
	}
}

function inputTextsChange(file) {
	// Max 1 KB allowed
	var input = file.target;
	var max_size_allowed = 1024
	if(input.files[0].size > max_size_allowed) {
		alert('Error : Large file (Max 1K)');
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e){
		var res = e.target.result.split("\n");
		if (res.length > 0) {
			for (i = selectObjectsId.length - 1; i >= 0; i--) {
				selectObjectsId.remove(i);
			}
		}
		for (i = 0; i < res.length; i++) {
			var option = document.createElement("option");
			option.text = res[i];
			selectObjectsId.add(option);
		}
	};
	reader.readAsText(input.files[0]);
}

function buttonSaveText() {
	if (selectImagesId.length <= 0 || selectObjectsId.length <= 0) {
		return;
	}
	data = textHiddenId.value;
	if (data.trim().length == 0) {
		return;
	}

	var file = imageFiles[selectImagesId.selectedIndex].name.split(".")[0];

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    aHiddenAId.href = url;
    aHiddenAId.download = file + ".txt";
    aHiddenAId.click();
    window.URL.revokeObjectURL(url);
}

function mouseup(e) {
	if (selectImagesId.length <= 0 || selectObjectsId.length <= 0) {
		return;
	}
	if(e.which == 3) {
		leftMouseStarted = false;
		mContext.moveTo(xVerteces[0], yVerteces[0]);
		mContext.lineTo(xVerteces[leftMouseCount - 1], yVerteces[leftMouseCount - 1]);
		mContext.stroke();
		annotateYoLo();
	}
}

function mousedown(e) {
	if (selectImagesId.length <= 0 || selectObjectsId.length <= 0) {
		alert("Load both Images & Objects!");
		return;
	}
	var rect = e.target.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	if(e.which == 1) {
		mContext.fillRect(x, y, 2, 2);
		if (!leftMouseStarted) {
			leftMouseStarted = true;
			leftMouseCount = 0;
			for (var i = 0; i < xVerteces.length; i++) {
				xVerteces[i] = 0;
				yVerteces[i] = 0;
			}
		} else {
			mContext.moveTo(xVerteces[leftMouseCount - 1], yVerteces[leftMouseCount - 1]);
			mContext.lineTo(x, y);
			mContext.stroke();
		}
		xVerteces[leftMouseCount] = x;
		yVerteces[leftMouseCount] = y;
		leftMouseCount++;
	}
}

function mousemove(e) {
	// alert(e.which);
}

function contextmenu(e) {
	e.preventDefault();
}

function selectImagesChange(e) {
	buttonSaveText();
	initMain();
	index = selectImagesId.selectedIndex;
	if (index >= 0) {
		fileChange();
	}
}

function selectImagesNext(e) {
	buttonSaveText();
	initMain();
	index = selectImagesId.selectedIndex;
	index++;
	if (index >= imageFiles.length) {
		selectImagesId.selectedIndex = 0;
	} else {
		selectImagesId.selectedIndex = index;
	}
	fileChange();
}

function selectImagesPrev(e) {
	buttonSaveText();
	initMain();
	index = selectImagesId.selectedIndex;
	index--;
	if (index < 0) {
		selectImagesId.selectedIndex = imageFiles.length - 1;
	} else {
		selectImagesId.selectedIndex = index;
	}
	fileChange();
}

function inputFilesChange(e) {
	let files = e.target.files;

	var j = 0;
	for (let i = 0; i < files.length; i++) {
		var option = document.createElement("option");
		fName = files[i].name;
		if (fName.endsWith(".jpeg")
			|| fName.endsWith(".jpg")
			|| fName.endsWith(".png")) {
			option.text = fName;
			selectImagesId.add(option);
			imageFiles[j] = files[i];
			j++;
		}
	};
	if (imageFiles.length >= 0) {
		selectImagesId.selectedIndex = 0;
		fileChange();
	}
}

function init() {
	selectImagesId = document.getElementById("selectImages");
	selectObjectsId = document.getElementById("selectObjects");
	canvasId = document.getElementById("canvas");

	textHiddenId = document.getElementById("textHidden");
    aHiddenAId = document.getElementById("aHiddenA");

	mContext = canvasId.getContext('2d');

	// initDrawing();
	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	canvasId.addEventListener('mouseup', mouseup, false);
	canvasId.addEventListener('mousedown', mousedown, false);
	canvasId.addEventListener('mousemove', mousemove, false);
	canvasId.addEventListener('contextmenu', contextmenu, false);
}
/*
			var res = file.name.split(".");
			roiFile = res[0];

*/
