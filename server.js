var express=require("express");
var session=require("express-session");
var multer=require("multer");
var app=express();
var formidable=require("formidable");
var AsposeCloud=require("asposecloud");
var handle=require("./handlers");
var port=8000;
var fs = require("fs");
var file_path=false;
var file_name=false;
var done=false;
var slide_files=[];
var aspose=new AsposeCloud({
	 appSID: "f99bea35-275d-44ac-a4f1-4ae5d9b476cf",
	  appKey: "1cba695b8d883dad0dc47f0d65aa9bfb",
	  baseURI: "http://api.aspose.com/v1.1/"
});
var slides=aspose.Slides();
var storage=aspose.Storage();
app.use(multer({ dest: 'public/upload/',
	 rename: function (fieldname, filename) {
	    return filename+Date.now();
	  },
	onFileUploadStart: function (file) {
	  console.log(file.originalname + ' is starting ...');
	},
	onFileUploadComplete: function (file) {
	  console.log(file.fieldname + ' uploaded to  ' + file.path);
	  file_path=file.path;
	  file_name=file.name;
	  done=true;
	}
	}));
app.use(express.static(__dirname+"/public"));
app.post("/upload",function(req,res){
		console.log("file name="+file_name);
		storage.uploadFile(file_path, "", "", function(result){
			console.log(result);
			convertSlidesToImages(file_path,res);	
		});
		
});
app.post("/uploadvideo",function(request,response){
    var postData = '';
console.log(request.url);
request.setEncoding('utf8');

request.addListener('data', function(postDataChunk) {
    postData += postDataChunk;
});

request.addListener('end', function() {
    handle.upload(response, postData);
});

});
app.get("/test",function(req,res){
	//console.log(req.file);
	res.end("success");
});
app.listen(port,function()
{
console.log("Server Listening at "+port);
});
function convert(i){
	slides.convertToImage(file_name,i,"png","","",function(buffer){
		var outputFile="public/upload/"+file_name+i+".png";
		fs.writeFileSync(outputFile,buffer);
		console.log("file saved"+outputFile);
		});
}
function convertSlides(count,callback)
{
	var x=1;
for(var i=1;i<=count;i++){
	slide_files[i-1]="/upload/"+file_name+i+".png";
	convert(i);
	}
callback.call();
}
function convertSlidesToImages(file_path,res){
	console.log(file_path);
	slides.getSlideCount(file_name,"","",function(count){
		convertSlides(count,function()
				{
			res.send({"slides":slide_files});
			res.end();
				});
		res.end();
	});
}
