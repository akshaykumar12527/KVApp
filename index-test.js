var express=require("express");
var session=require("express-session");
var multer=require("multer");
var bodyParser=require('body-parser');
var app=express();
var db=require('./dbconfig');
var handle=require("./handlers");
var unzip=require("unzip2");
var cloudconvert = new (require('cloudconvert'))('fyBicM0wsFpuSInEngnHMkCIIGgmO3bzAXshgPZPztOXSnP0RYigUe-39cUjpMmmmvr_ZaB-I75paFF4FlTbJQ');
var port=5000;
var fs = require("fs");
var file_path=false;
var file_name=false;
var done=false;
var slide_files=[];
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: 'ssshhhhh'}));
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
// views is directory for all template files


/*
app.get('/', function(request, response) {
  response.render('pages/index');
});
*/
app.post("/upload",function(req,res){
		console.log("file name="+file_name);
		fs.createReadStream(file_path).pipe(cloudconvert.convert({
		    inputformat: file_name.split('.').pop(),
		    outputformat: 'jpg',
		    converteroptions: {
		        quality : 25,
		    }
		}).on('error', function(err) {
		    console.error('Failed: ' + err);
		}).on('finished', function(data) {
		    console.log('Done: ' + data.message);
		    this.pipe(fs.createWriteStream('public/upload/'+file_name.split('.').shift()+'.zip'));
		}).on('downloaded', function(destination) {
		    console.log('Downloaded to: ' + destination.path);
		    fs.mkdirSync('public/upload/'+file_name.split(".").shift());
		    var read=fs.createReadStream(destination.path);
		    read.pipe(unzip.Extract({ path: 'public/upload/'+file_name.split(".").shift()+'/' }));
		    console.log(file_name.split(".").shift());
		    read.on('end',function(){
		    	fs.readdir('public/upload/'+file_name.split(".").shift()+'/', function(err, files) {
		    		if(!err){
		    		for(var i=0;i<files.length;i++){
		    			files[i]='upload/'+file_name.split('.').shift()+'/'+files[i];
		    			console.log(files[i]);
		    		}
		    		res.send({'slides':files});
		    		res.end();
		    		}
		    	});
		    });
		}));

		res.setTimeout(120000*10, function(){
	        console.log('Request has timed out.');
	            res.send({'status':408});
	            res.end();
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
app.post("/register",function(request,response){
    var postData = '';
console.log(request.url);
request.setEncoding('utf8');

request.addListener('data', function(postDataChunk) {
    postData += postDataChunk;
});

request.addListener('end', function() {
   
    postData=JSON.parse(postData);
    console.log(postData);
    var connection=db.createConnection();
    connection.connect();
    connection.query("insert into users(username,name,email,password) values(?,?,?,?)",[postData.username,postData.name,postData.email,postData.password],function(error){
    	if(error){
    	response.end('');	
    	}
    	else
    	{
    	response.end('register_success.html');
    	}
    });
});

});
app.post('/login',function(request,response){
	var username=request.body.username;
	var password=request.body.password;
	var ses=request.session;
	var connection=db.createConnection();
	connection.connect(function(error){
		console.log(error);
	});
	console.log('connected');
	connection.query("select * from users where username='"+username+"' && password='"+password+"'",function(error,row){
		if(error){
			console.log(error)
			response.end('error'+error);
		}
		else{
			if(row.length>0)
				{
				response.sendFile(__dirname+'/public/index.html');
				ses.username=username;
				ses.name=row[0].name;
				}
			else
			response.end('row 0');
		}
	});
	//response.end();
	
});
app.post('/getsession',function(request,response){
	response.send(request.session);
	response.end();
});
app.post('/syncvideowithslides',function(req,res){
	var postData = '';
	console.log(req.url);
	req.setEncoding('utf8');

	req.addListener('data', function(postDataChunk) {
	    postData += postDataChunk;
	});

	req.addListener('end', function() {
	   console.log(postData);
	   var connection=db.createConnection();
	   connection.connect(function(error){
		if(!error){
			console.log('connected');
			var ses=req.session;
			handle.insertData(connection,postData,ses.username,res);
		}   
		else
			{
			res.end('error'+error);
			}
	   });
	   
	});
	
});
app.get("/getSlide_Data",function(req,res){
	var video_id=req.url.split('=').pop();
	console.log(video_id);
	var connection=db.createConnection();
	connection.connect();
	connection.query("select * from video where video_id="+video_id,function(error,row){
		if(!error){
			var video=row[0];
			connection.query("select * from slides where video_id="+video_id,function(err,row2){
				var slides=row2;
				var slide_data={'video':video,'slides':slides};
				res.send(slide_data);
				res.end();
			});
			
		}
		else
			{
			res.end('error'+error);
			}
	});
	
});
app.listen(app.get('port'), function() {
	  console.log('KVApp node app is running on port', app.get('port'));
	});
