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

function changeDim() {
	drawImage();
	drawROI();
}

function drawROI() {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.strokeStyle = '#ff0000';
	ctx.beginPath();
	var dim = document.getElementById("dim");
	stX = (canvas.width - dim.value) / 2;
	stY = (canvas.height - dim.value) / 2;
	ctx.strokeRect(stX, stY, dim.value, dim.value);
}

function drawImage() {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	var left = document.getElementById("x");
	var top = document.getElementById("y");
	// ctx.drawImage(roiImage, left.value, top.value,  roiWidth, roiHeight);
	sx = 0;
	sy = 0;
	swidth = roiImage.width;
	sheight = roiImage.height;
	x = left.value;
	y = top.value;
	width = roiWidth;
	height = roiHeight;
	ctx.drawImage(roiImage, sx, sy, swidth, sheight, x, y, width, height);
	ctx.beginPath();
}

function initDoc() {
	tempLength = 0;
	xVerteces = [];
	yVerteces = [];
	isStart = false;
	roiFile = "";

	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var cc = document.getElementById("cc");
	var ctx = cc.getContext('2d');
	ctx.clearRect(0, 0, cc.width, cc.height);

	var annotation = document.getElementById("annotation");
	annotation.value = "";

	var adjust = document.getElementById("adjust");
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
			roiWidth = canvas.width;
			roiHeight = canvas.height;
			roiImage = img;
			if (aspect > 1.0 && img.height > canvas.height) {
				// Portrait
				roiWidth = (canvas.height / img.height) * img.width;
			} else if (aspect < 1.0 && img.width > canvas.width) {
				// Landscape
				roiHeight = (canvas.width / img.width) * img.height;
			} else {
				roiWidth = img.width;
				roiHeight = img.height;
			}
			var left = document.getElementById("x");
			left.value = (canvas.width - roiWidth) / 2;
			var top = document.getElementById("y");
			top.value = (canvas.height - roiHeight) / 2;
			changeDim();
			var res = input.files[0].name.split(".");
			roiFile = res[0];
		};
		img.src = dataURL;
	};

	reader.readAsDataURL(input.files[0]);
}

function removeObjects() {
	var x = document.getElementById("objects");
	for (i = x.length - 1; i >= 0; i--) {
		x.remove(i);
	}
}

function addObject(item) {
	var x = document.getElementById("objects");
	var option = document.createElement("option");
	option.text = item;
	x.add(option);
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
	var adjust = document.getElementById("adjust");
	data = adjust.value;
    var a = document.getElementById("a");

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = roiFile + ".txt";
    a.click();
    window.URL.revokeObjectURL(url);
}

function saveImage() {
    var b = document.getElementById("b");
	var canvas = document.getElementById("canvas");
	var cc = document.getElementById("cc");
	var ctx = cc.getContext('2d');
	var dim = document.getElementById("dim");
	ctx.canvas.width = dim.value;
	ctx.canvas.height = dim.value;
	var img = new Image;
	img.src = canvas.toDataURL("image/png");
	img.onload = function() {
		sx = (img.width - dim.value) / 2;
		sy = (img.height - dim.value) / 2;
		swidth = dim.value;
		sheight = dim.value;
		x = 0;
		y = 0;
		width = dim.value;
		height = dim.value;
		ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);

		cc.toBlob(function(blob) {
			b.href = window.URL.createObjectURL(blob);
			b.download = roiFile + ".png";
			b.click();
			window.URL.revokeObjectURL(b.href);
		},'image/png');
	};
}

function adjust() {
	var dim = document.getElementById("dim");
	val = parseInt(dim.value);
	stX = parseInt((canvas.width - val)) / 2;
	stY = parseInt((canvas.height - val)) / 2;
	var obj = document.getElementById("objects");
	var index = obj.selectedIndex;
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
	var adjustElem = document.getElementById("adjust");
	var adjustText = index
			+ " "
			+ vertices
			+ "\n";
	adjustElem.value += adjustText;
}

function annotate() {
	var obj = document.getElementById("objects");
	var index = obj.selectedIndex;
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
	var annElem = document.getElementById("annotation");
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
	annElem.value += annText;
}

function mouseup(e) {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	var rect = e.target.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	if(e.which == 1) {
		ctx.fillRect(x, y, 2, 2);
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
			ctx.moveTo(prev.x, prev.y);
			ctx.lineTo(x, y);
			ctx.stroke();
		}
		prev.x = x;
		prev.y = y;
		xVerteces[tempLength] = x;
		yVerteces[tempLength] = y;
		tempLength++;
	} else if(e.which == 3) {
		isStart = false;
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(prev.x, prev.y);
		ctx.stroke();
		x1 = Math.min.apply(null, xVerteces.slice(0, tempLength));
		y1 = Math.min.apply(null, yVerteces.slice(0, tempLength));
		width = Math.max.apply(null, xVerteces.slice(0, tempLength)) - x1;
		height = Math.max.apply(null, yVerteces.slice(0, tempLength)) - y1;
		ctx.strokeRect(x1, y1, width, height);
		annotate();
		adjust();
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

	var canvas = document.getElementById("canvas");
	var dim = document.getElementById("dim");
	dim.value = 500;
	drawROI();
	// initDrawing();
	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	canvas.addEventListener('mouseup', mouseup, false);
	canvas.addEventListener('mousedown', mousedown, false);
	canvas.addEventListener('mousemove', mousemove, false);
	canvas.addEventListener('contextmenu', contextmenu, false);
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