// Aspect Ratio: Actual Width / Canvas Width
// Aspect Ratio: Actual Height / Canvas Height
var point;
var start;
var yoloRect;
var tempLength = 0;
var xVerteces = [];
var yVerteces = [];
var xAspect = 1;
var yAspect = 1;
var fileName = "";
var roi_width;
var roi_height;

function parseFile(name) {
	var res = name.split(".");
	fileName = res[0] + ".txt";
}

function initDrawing() {
	point = {x:0, y:0};
	start = {x:0, y:0};

	var canvas = document.getElementById("canvas");
	yoloRect = {x1:canvas.width, y1:canvas.height, x2:0, y2:0};

	tempLength = 0;
	for (var i = 0; i < xVerteces.length; i++) {
		xVerteces[i] = 0;
		yVerteces[i] = 0;
	}
}

function initDoc() {
	var canvas = document.getElementById("canvas");
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var annotation = document.getElementById("annotation")
	annotation.value = "";
	
	var bbox = document.getElementById("bbox");
	bbox.value = "";
}

function saveData(data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    var json = JSON.stringify(data),
        blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

function saveFile(e) {
	var annotation = document.getElementById("annotation")
	saveData(annotation.value, fileName);
}

function addObject(item) {
	var x = document.getElementById("objects");
	var option = document.createElement("option");
	option.text = item;
	x.add(option);
}

function removeObjects() {
	var x = document.getElementById("objects");
	for (i = x.length - 1; i >= 0; i--) {
		x.remove(i);
	}
}

function selectObject() {
}

function selectType() {
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

function openImage(file) {
	var input = file.target;
	var reader = new FileReader();
	
	reader.onload = function(){
		var dataURL = reader.result;
		var img = new Image;
		img.onload = function(){
			initDrawing();
			initDoc();
			var canvas = document.getElementById("canvas");
			var ctx = canvas.getContext('2d');
			xAspect = this.width / canvas.width;
			yAspect = this.height / canvas.height;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img,0,0,canvas.width,canvas.height);
			ctx.beginPath();
		};
		img.src = dataURL;
	};
	reader.readAsDataURL(input.files[0]);
	parseFile(input.files[0].name);
}

function adjustYoloRect(x, y) {
	if (yoloRect.x1 > x) {
		yoloRect.x1 = x;
	}
	if (yoloRect.y1 > y) {
		yoloRect.y1 = y;
	}
	if (yoloRect.x2 < x) {
		yoloRect.x2 = x;
	}
	if (yoloRect.y2 < y) {
		yoloRect.y2 = y;
	}
	xVerteces[tempLength] = x;
	yVerteces[tempLength] = y;
	tempLength++;

	var bbox = document.getElementById("bbox");
	bbox.value = yoloRect.x1 + " " + yoloRect.y1 + " " + yoloRect.x2 + " " + yoloRect.y2;
}

function annotate() {
	var vertices = "";
	for (var i = 0; i < tempLength; i++) {
		vertices += xVerteces[i] + " " 
				+ yVerteces[i] + " ";
	}
	var x = document.getElementById("objects")
	var objectId  = x.selectedIndex;
	if (objectId < 0) {
		objectId = 0;
	}
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

	var str = "" + objectId + " " +
			relative_center_x + " " +
			relative_center_y + " " +
			relative_width + " " +
			relative_height;
	var type = document.getElementById("types");

	// Convert to Ploy
	if (type.selectedIndex > 0) {
		str += " " + vertices;
	}
	str += "\n";

	var annotation = document.getElementById("annotation")
	annotation.value += str;
	initDrawing();
}

function mouseup(e) {
	var canvas = document.getElementById("canvas");			
	var ctx = canvas.getContext('2d');
	if(e.which == 1) {
		var rect = e.target.getBoundingClientRect();
		x = e.clientX - rect.left;
		y = e.clientY - rect.top;
		ctx.fillRect(x, y, 2, 2);
		if (point.x == 0 && point.y == 0) {
			start.x = x;
			start.y = y;
		} else {
			ctx.moveTo(point.x, point.y);
			ctx.lineTo(x, y);
			ctx.stroke();		
		}
		point.x = x;
		point.y = y; 		
		adjustYoloRect(point.x, point.y);
	} else if(e.which == 3) {
		ctx.moveTo(point.x, point.y);
		ctx.lineTo(start.x, start.y);
		ctx.stroke();		
		ctx.strokeRect(yoloRect.x1, yoloRect.y1, (yoloRect.x2 - yoloRect.x1), (yoloRect.y2 - yoloRect.y1));
		annotate();
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
	var canvas = document.getElementById("canvas");
	roi_width = canvas.width;
	roi_height = canvas.height;

	initDrawing();
	// canvas.addEventListener('click', click, false);
	// canvas.addEventListener('dblclick', dblclick, false);
	canvas.addEventListener('mouseup', mouseup, false);
	canvas.addEventListener('mousedown', mousedown, false);
	canvas.addEventListener('mousemove', mousemove, false);
	canvas.addEventListener('contextmenu', contextmenu, false);
}