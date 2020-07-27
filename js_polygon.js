// Vars
var mContext;
var mCc;

var roiImage;
var roiWidth;
var roiHeight;

var leftMouseStarted = false;
var leftMouseCount = 0;
var xVerteces = [];
var yVerteces = [];

// Elements
var aImageNameId;
var canvasId;
var inputDimId;
var inputZoomId;
var inputXId;
var inputYId;

var textHiddenId;
var aHiddenAId;
var canvasHiddenId;


function drawROI() {
	mContext.strokeStyle = '#ff0000';
	stX = (canvasId.width - inputDimId.value) / 2;
	stY = (canvasId.height - inputDimId.value) / 2;
	mContext.strokeRect(stX, stY, inputDimId.value, inputDimId.value);
}

function drawImage() {
	sx = 0;
	sy = 0;
	swidth = roiImage.width;
	sheight = roiImage.height;
	x = inputXId.value;
	y = inputYId.value;
	zoomFactor = inputZoomId.value / 100;
	width = roiWidth * zoomFactor;
	height = roiHeight * zoomFactor;
	mContext.drawImage(roiImage, sx, sy, swidth, sheight, x, y, width, height);

	mCc.canvas.width = inputDimId.value;
	mCc.canvas.height = inputDimId.value;
	var img = new Image;
	img.src = canvasId.toDataURL("image/png");
	img.onload = function() {
		sx = (img.width - inputDimId.value) / 2;
		sy = (img.height - inputDimId.value) / 2;
		swidth = inputDimId.value;
		sheight = inputDimId.value;
		x = 0;
		y = 0;
		width = inputDimId.value;
		height = inputDimId.value;
		mCc.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
	};
}

function initMain() {
	leftMouseCount = 0;
	xVerteces = [];
	yVerteces = [];
	leftMouseStarted = false;

	mContext.clearRect(0, 0, canvasId.width, canvasId.height);

	mCc.clearRect(0, 0, canvasHiddenId.width, canvasHiddenId.height);

	textHiddenId.value = "";
}

function annotatePolygon() {
	x1 = Math.min.apply(null, xVerteces.slice(0, leftMouseCount));
	y1 = Math.min.apply(null, yVerteces.slice(0, leftMouseCount));
	width = Math.max.apply(null, xVerteces.slice(0, leftMouseCount)) - x1;
	height = Math.max.apply(null, yVerteces.slice(0, leftMouseCount)) - y1;
	mContext.strokeRect(x1, y1, width, height);
	
	val = parseInt(inputDimId.value);
	stX = parseInt((canvasId.width - val)) / 2;
	stY = parseInt((canvasId.height - val)) / 2;
	var vertices = "";
	var tempX = 0;
	var tempY = 0;
	for (var i = 0; i < leftMouseCount; i++) {
		if (xVerteces[i] < stX) {
			tempX = 0;
		} else if (xVerteces[i] > (stX + val)) {
			tempX = val;
		} else {
			tempX = xVerteces[i] - stX;
		}
		if (yVerteces[i] < stY) {
			tempY = 0;
		} else if (yVerteces[i] > (stY + val)) {
			tempY = val;
		} else {
			tempY = yVerteces[i] - stY;
		}
		vertices += tempX + " " + tempY + " ";
	}
	var txt = vertices
			+ "\n";
	textHiddenId.value += txt;
}

function mouseup(e) {
	if(e.which == 3) {
		leftMouseStarted = false;
		mContext.moveTo(xVerteces[0], yVerteces[0]);
		mContext.lineTo(xVerteces[leftMouseCount - 1], yVerteces[leftMouseCount - 1]);
		mContext.stroke();
		annotatePolygon();
	}
}

function mousedown(e) {
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

function buttonSaveText() {
	data = textHiddenId.value;
	var roiFile = aImageNameId.innerHTML.split(".")[0];

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    aHiddenAId.href = url;
    aHiddenAId.download = roiFile + ".txt";
    aHiddenAId.click();
    window.URL.revokeObjectURL(url);
}

function buttonSaveImage() {
	canvasHiddenId.toBlob(function(blob) {
		aHiddenAId.href = window.URL.createObjectURL(blob);
		aHiddenAId.download = aImageNameId.innerHTML;
		aHiddenAId.click();
		window.URL.revokeObjectURL(aHiddenAId.href);
	},'image/png');
}

function inputDimChange() {
	initMain();
	mContext.beginPath();
	if (roiImage) {
		drawImage();
	}
	drawROI();
}

function inputFileChange(file) {
	var reader = new FileReader();

	reader.onload = function(){
		aImageNameId.innerHTML = file.name;
		var dataURL = reader.result;
		var img = new Image;
		img.onload = function(){
			initMain();
			aspect = img.height / img.width;
			roiWidth = canvasId.width;
			roiHeight = canvasId.height;
			roiImage = img;
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
			inputXId.value = (canvasId.width - roiWidth) / 2;
			inputYId.value = (canvasId.height - roiHeight) / 2;
			inputDimChange();
		};
		img.src = dataURL;
	};

	reader.readAsDataURL(file);
}

function init() {
	aImageNameId = document.getElementById("aImageName");
	inputXId = document.getElementById("inputX");
	inputYId = document.getElementById("inputY");
	inputDimId = document.getElementById("inputDim");
	inputZoomId = document.getElementById("inputZoom");
	canvasId = document.getElementById("canvas");

    aHiddenAId = document.getElementById("aHiddenA");
	textHiddenId = document.getElementById("textHidden");
	canvasHiddenId = document.getElementById("canvasHidden");

	mContext = canvasId.getContext('2d');
	mCc = canvasHiddenId.getContext('2d');
	inputDimId.value = 500;
	inputZoomId.value = 100;

	drawROI();
	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	canvasId.addEventListener('mouseup', mouseup, false);
	canvasId.addEventListener('mousedown', mousedown, false);
	canvasId.addEventListener('mousemove', mousemove, false);
	canvasId.addEventListener('contextmenu', contextmenu, false);
}