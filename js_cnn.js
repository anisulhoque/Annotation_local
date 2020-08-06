// Vars
var inImage;

var mContext;

var leftMouseStarted = false;
var leftMouseCount = 0;
var xVerteces = [];
var yVerteces = [];

// Elements
var aImageNameId;
var canvasId;
var textHiddenId;
var aHiddenAId;


function annotatePolygon() {
	x1 = Math.min.apply(null, xVerteces.slice(0, leftMouseCount));
	y1 = Math.min.apply(null, yVerteces.slice(0, leftMouseCount));
	width = Math.max.apply(null, xVerteces.slice(0, leftMouseCount)) - x1;
	height = Math.max.apply(null, yVerteces.slice(0, leftMouseCount)) - y1;

	mContext.strokeRect(x1, y1, width, height);
	
	var vertices = "";
	var tempX = 0.0;
	var tempY = 0.0;
	for (var i = 0; i < leftMouseCount; i++) {
		tempX = (xVerteces[i] / canvasId.width) * inImage.width;
		tempY = (yVerteces[i] / canvasId.height) * inImage.height;
		vertices += parseInt(tempX) + " " + parseInt(tempY);
		if (i < leftMouseCount - 1) {
			vertices += " ";
		} else {
			vertices += "\n";
		}
	}
	textHiddenId.value += vertices;
}

function mouseup(e) {
	if (!inImage) {
		return;
	}
	if(e.which == 3) {
		leftMouseStarted = false;
		mContext.moveTo(xVerteces[0], yVerteces[0]);
		mContext.lineTo(xVerteces[leftMouseCount - 1], yVerteces[leftMouseCount - 1]);
		mContext.stroke();
		annotatePolygon();
	}
}

function mousedown(e) {
	if (!inImage) {
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

function buttonSaveText() {
	data = textHiddenId.value.trim();
	if (data.length == 0) {
		return;
	}
	var roiFile = aImageNameId.innerHTML.split(".")[0];

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    aHiddenAId.href = url;
    aHiddenAId.download = roiFile + ".txt";
    aHiddenAId.click();
    window.URL.revokeObjectURL(url);
}

function inputFileChange(file) {
	var reader = new FileReader();

	reader.onload = function(){
		aImageNameId.innerHTML = file.name;
		var dataURL = reader.result;
		var img = new Image;
		img.onload = function(){
			leftMouseCount = 0;
			xVerteces = [];
			yVerteces = [];
			leftMouseStarted = false;

			mContext.clearRect(0, 0, canvasId.width, canvasId.height);
			textHiddenId.value = "";

			inImage = img;
			mContext.beginPath();
			mContext.drawImage(inImage, 0, 0, inImage.width, inImage.height, 0, 0, canvasId.width, canvasId.height);
		};
		img.src = dataURL;
	};

	reader.readAsDataURL(file);
}

function init() {
	aImageNameId = document.getElementById("aImageName");
	canvasId = document.getElementById("canvas");

    aHiddenAId = document.getElementById("aHiddenA");
	textHiddenId = document.getElementById("textHidden");

	mContext = canvasId.getContext('2d');
	mContext.strokeStyle = '#ff0000';
	mContext.fillStyle = "#FF0000";

	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	canvasId.addEventListener('mouseup', mouseup, false);
	canvasId.addEventListener('mousedown', mousedown, false);
	canvasId.addEventListener('mousemove', mousemove, false);
	canvasId.addEventListener('contextmenu', contextmenu, false);
}