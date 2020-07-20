var roiImage;
var roiWidth;
var roiHeight;
var roiFile;
var start = {x:0, y:0};
var prev = {x:0, y:0};
var isStart = false;
var tempLength;
var xVerteces = [];
var yVerteces = [];
var cImage;
// Elements
var mCanvas;
var mContext;
var dim;
var leftX;
var topY;
var cc;
var mCc;
var annotation;
var adjust;
var objects;
var a;
var b;


function changeDim() {
	mContext.clearRect(0, 0, mCanvas.width, mCanvas.height);
	mContext.beginPath();
	if (roiImage) {
		drawImage();
	}
	drawROI();
}

function drawROI() {
	mContext.strokeStyle = '#ff0000';
	stX = (mCanvas.width - dim.value) / 2;
	stY = (mCanvas.height - dim.value) / 2;
	mContext.strokeRect(stX, stY, dim.value, dim.value);
}

function drawImage() {
	sx = 0;
	sy = 0;
	swidth = roiImage.width;
	sheight = roiImage.height;
	x = leftX.value;
	y = topY.value;
	width = roiWidth;
	height = roiHeight;
	mContext.drawImage(roiImage, sx, sy, swidth, sheight, x, y, width, height);

	mCc.canvas.width = dim.value;
	mCc.canvas.height = dim.value;
	var img = new Image;
	img.src = mCanvas.toDataURL("image/png");
	img.onload = function() {
		sx = (img.width - dim.value) / 2;
		sy = (img.height - dim.value) / 2;
		swidth = dim.value;
		sheight = dim.value;
		x = 0;
		y = 0;
		width = dim.value;
		height = dim.value;
		mCc.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
	};
}

function initDoc() {
	tempLength = 0;
	xVerteces = [];
	yVerteces = [];
	isStart = false;
	roiFile = "";

	mContext.clearRect(0, 0, mCanvas.width, mCanvas.height);

	mCc.clearRect(0, 0, cc.width, cc.height);

	annotation.value = "";

	adjust.value = "";
}

function openImage(file) {
	var input = file.target;
	var reader = new FileReader();

	reader.onload = function(){
		var dataURL = reader.result;
		var img = new Image;
		img.onload = function(){
			// initDrawing();
			initDoc();
			aspect = img.height / img.width;
			roiWidth = mCanvas.width;
			roiHeight = mCanvas.height;
			roiImage = img;
			if (aspect > 1.0 && img.height > mCanvas.height) {
				// Portrait
				roiWidth = (mCanvas.height / img.height) * img.width;
			} else if (aspect < 1.0 && img.width > mCanvas.width) {
				// Landscape
				roiHeight = (mCanvas.width / img.width) * img.height;
			} else {
				roiWidth = img.width;
				roiHeight = img.height;
			}
			leftX.value = (mCanvas.width - roiWidth) / 2;
			topY.value = (mCanvas.height - roiHeight) / 2;
			changeDim();
			var res = input.files[0].name.split(".");
			roiFile = res[0];
		};
		img.src = dataURL;
	};

	reader.readAsDataURL(input.files[0]);
}

function removeObjects() {
	for (i = objects.length - 1; i >= 0; i--) {
		objects.remove(i);
	}
}

function addObject(item) {
	var option = document.createElement("option");
	option.text = item;
	objects.add(option);
}

function parseObjects(text) {
	removeObjects();
	var res = text.split("\n");
	for (i = 0; i < res.length; i++) {
		addObject(res[i]);
	}
}

function openObject(file) {
	// Max 1 KB allowed
	var input = file.target;
	var max_size_allowed = 1024
	if(input.files[0].size > max_size_allowed) {
		alert('Error : Large file (Max 1K)');
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e){
		var text = e.target.result;
		parseObjects(text);
	};
	reader.readAsText(input.files[0]);
}

function saveAnnotation() {
	data = adjust.value;

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = roiFile + ".txt";
    a.click();
    window.URL.revokeObjectURL(url);
}

function saveImage() {
	cc.toBlob(function(blob) {
		b.href = window.URL.createObjectURL(blob);
		b.download = roiFile + ".png";
		b.click();
		window.URL.revokeObjectURL(b.href);
	},'image/png');
}

function adjustAnnotation() {
	val = parseInt(dim.value);
	stX = parseInt((mCanvas.width - val)) / 2;
	stY = parseInt((mCanvas.height - val)) / 2;
	var index = objects.selectedIndex;
	if (index < 0) {
		index = 0;
	}
	var vertices = "";
	var tempX = 0;
	var tempY = 0;
	for (var i = 0; i < tempLength; i++) {
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
	var adjustText = index
			+ " "
			+ vertices
			+ "\n";
	adjust.value += adjustText;
}

function annotate() {
	var index = objects.selectedIndex;
	if (index < 0) {
		index = 0;
	}
	var vertices = "";
	for (var i = 0; i < tempLength; i++) {
		vertices += xVerteces[i] + " "
			+ yVerteces[i] + " ";
	}
	x1 = Math.min.apply(null, xVerteces.slice(0, tempLength));
	y1 = Math.min.apply(null, yVerteces.slice(0, tempLength));
	width = Math.max.apply(null, xVerteces.slice(0, tempLength)) - x1;
	height = Math.max.apply(null, yVerteces.slice(0, tempLength)) - y1;
	var annText = index
			+ " "
			+ x1
			+ " "
			+ y1
			+ " "
			+ width
			+ " "
			+ height
			+ " "
			+ vertices
			+ "\n";
	annotation.value += annText;
}

function mouseup(e) {
	var rect = e.target.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	if(e.which == 1) {
		mContext.fillRect(x, y, 2, 2);
		if (!isStart) {
			isStart = true;
			tempLength = 0;
			for (var i = 0; i < xVerteces.length; i++) {
				xVerteces[i] = 0;
				yVerteces[i] = 0;
			}
			start.x = x;
			start.y = y;
		} else {
			mContext.moveTo(prev.x, prev.y);
			mContext.lineTo(x, y);
			mContext.stroke();
		}
		prev.x = x;
		prev.y = y;
		xVerteces[tempLength] = x;
		yVerteces[tempLength] = y;
		tempLength++;
	} else if(e.which == 3) {
		isStart = false;
		mContext.moveTo(start.x, start.y);
		mContext.lineTo(prev.x, prev.y);
		mContext.stroke();
		x1 = Math.min.apply(null, xVerteces.slice(0, tempLength));
		y1 = Math.min.apply(null, yVerteces.slice(0, tempLength));
		width = Math.max.apply(null, xVerteces.slice(0, tempLength)) - x1;
		height = Math.max.apply(null, yVerteces.slice(0, tempLength)) - y1;
		mContext.strokeRect(x1, y1, width, height);
		annotate();
		adjustAnnotation();
	}
}

function mousedown(e) {
	// alert(e.which);
}

function mousemove(e) {
	// alert(e.which);
}

function contextmenu(e) {
	e.preventDefault();
}

function init() {
	var x = document.getElementById("types");
	var option = document.createElement("option");
	option.text = "PolyGon";
	x.add(option);
	var option = document.createElement("option");
	option.text = "BBox (N/A)";
	x.add(option);

    a = document.getElementById("a");
    b = document.getElementById("b");
	objects = document.getElementById("objects");
	annotation = document.getElementById("annotation");
	adjust = document.getElementById("adjust");
	cc = document.getElementById("cc");
	mCc = cc.getContext('2d');
	leftX = document.getElementById("x");
	topY = document.getElementById("y");
	mCanvas = document.getElementById("canvas");
	mContext = mCanvas.getContext('2d');
	dim = document.getElementById("dim");
	dim.value = 500;
	drawROI();
	// initDrawing();
	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	mCanvas.addEventListener('mouseup', mouseup, false);
	mCanvas.addEventListener('mousedown', mousedown, false);
	mCanvas.addEventListener('mousemove', mousemove, false);
	mCanvas.addEventListener('contextmenu', contextmenu, false);
}

/***
YoLo conversion
*/
/*
	// Convert to YoLo
	var relative_center_x = (
			yoloRect.x1
			+ (yoloRect.x2 - yoloRect.x1) / 2)
			/ canvas.width;
	var relative_center_y = (
			yoloRect.y1
			+ (yoloRect.y2 - yoloRect.y1) / 2)
			/ canvas.height;
	var relative_width = (yoloRect.x2 - yoloRect.x1) / canvas.width;
	var relative_height = (yoloRect.y2 - yoloRect.y1) / canvas.height;
*/