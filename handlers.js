// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// Source Code   - github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC/RecordRTC-to-Nodejs

var fs = require('fs'),
    sys = require('sys'),
    exec = require('child_process').exec;

function home(response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    response.end(fs.readFileSync('./static/index.html'));
}
function ifWin(response, files) {
    // following command tries to merge wav/webm files using ffmpeg
    var merger = __dirname + '\\merger.bat';
    var audioFile = __dirname + '\\uploads\\' + files.audio.name;
    var videoFile = __dirname + '\\uploads\\' + files.video.name;
    var mergedFile = __dirname + '\\uploads\\' + files.audio.name.split('.')[0] + '-merged.webm';

    // if a "directory" has space in its name; below command will fail
    // e.g. "c:\\dir name\\uploads" will fail.
    // it must be like this: "c:\\dir-name\\uploads"
    var command = merger + ', ' + audioFile + " " + videoFile + " " + mergedFile + '';
    exec(command, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: ' + error.code);
            console.log('Signal received: ' + error.signal);
        } else {
            response.statusCode = 200;
            response.writeHead(200, {
                'Content-Type': 'application/json'
            });
            response.end(files.audio.name.split('.')[0] + '-merged.webm');

            fs.unlink(audioFile);
            fs.unlink(videoFile);
        }
    });
}

function ifMac(response, files) {
    // its probably *nix, assume ffmpeg is available
    var audioFile = __dirname + '/uploads/' + files.audio.name;
    var videoFile = __dirname + '/uploads/' + files.video.name;
    var mergedFile = __dirname + '/uploads/' + files.audio.name.split('.')[0] + '-merged.webm';
    
    var util = require('util'),
        exec = require('child_process').exec;

    var command = "ffmpeg -i " + audioFile + " -i " + videoFile + " -map 0:0 -map 1:0 " + mergedFile;

    exec(command, function (error, stdout, stderr) {
        if (stdout) 
        	{
        	console.log(stdout);
        	}
        if (stderr){
        	console.log(stderr);
        }

        if (error) {
            console.log('exec error: ' + error);
            response.statusCode = 404;
            response.end();

        } else {
            response.statusCode = 200;
            response.writeHead(200, {
                'Content-Type': 'application/json'
            });
            response.end(files.audio.name.split('.')[0] + '-merged.webm');

            // removing audio/video files
            fs.unlink(audioFile);
            fs.unlink(videoFile);
        }

    });
}


//this function merges wav/webm files
function merge(response, files) {
    // detect the current operating system
    var isWin = !!process.platform.match( /^win/ );

    if (isWin) {
        ifWin(response, files);
    } else {
        ifMac(response, files);
    }
}
function _upload(response, file) {
    var fileRootName = file.name.split('.').shift(),
        fileExtension = file.name.split('.').pop(),
        filePathBase = './public/upload/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,
        fileID = 2,
        fileBuffer;

    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    file.contents = file.contents.split(',').pop();

    fileBuffer = new Buffer(file.contents, "base64");
console.log("file path="+filePath);
fs.writeFileSync(filePath, fileBuffer);
}

// this function uploads files

function upload(response, postData) {
    var files = JSON.parse(postData);

    // writing audio file to disk
    _upload(response, files.audio);

    if (files.uploadOnlyAudio) {
        response.statusCode = 200;
        response.writeHead(200, { 'Content-Type': 'application/json' });
        console.log("files.audio="+files.audio.name);
        response.end(files.audio.name);
    }

    if (!files.uploadOnlyAudio) {
        // writing video file to disk
        _upload(response, files.video);

        merge(response, files);
    }
}




function hasMediaType(type) {
    var isHasMediaType = false;
    ['audio/wav', 'audio/ogg', 'video/webm', 'video/mp4'].forEach(function(t) {
      if(t===type)
    	  {
    	  isHasMediaType = true;
    	  }
    });
    
    return isHasMediaType;
}

function serveStatic(response, pathname) {

    var extension = pathname.split('.').pop(),
        extensionTypes = {
            'js': 'application/javascript',
            'webm': 'video/webm',
            'mp4': 'video/mp4',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'gif': 'image/gif'
        };

    response.writeHead(200, {
        'Content-Type': extensionTypes[extension]
    });
    if (hasMediaType(extensionTypes[extension]))
    	{
        response.end(fs.readFileSync('.' + pathname));
    	}
    else
    	{
        response.end(fs.readFileSync('./static' + pathname));
    	}
    	}


function insertData(database,postData,userid,res){
	console.log('insertData');
	var slides_data = JSON.parse(postData);
	console.log(slides_data);
	//var database=JSON.parse((fs.readFileSync("./database/kvapp.json")).toString());
	var video_id=(database.video.length>0?database.video.length+1:1);
	var video={"video_id":video_id,"duration":slides_data.video.duration,"path":slides_data.video.path,"userid":userid};
	database.video.push(video);
	var slides=slides_data.slides;
	var slide_id=(database.slides.length>0?database.slides.length+1:1);
	for(var i=0;i<slides.length;i++){
		var slide={"slide_id":slide_id,"path":slides[i].path,"video_id":video_id,"start_time":slides[i].start_time,"end_time":slides[i].end_time};
		database.slides.push(slide);
		slide_id++;
	}
	fs.writeFileSync('./database/kvapp.json',JSON.stringify(database));
	res.end(''+video_id);
//	slides=slides_data['slides'];
//	var video=slides_data['video'];
//	var path=video['path'];
//	var duration=video['duration'],video_id;
//	var id=0;
//	connection.query("insert into video values("+id+","+duration+",'"+path+"','"+userid+"')",function(){
//		connection.query("select video_id from video where path='"+path+"'",function(error,row){
//			if(!error)
//				{
//			for(var i=0;i<row.length;i++)
//				{
//				video_id=row[i].video_id;
//				console.log(video_id);
//				}
//			for(var j=0;j<slides.length;j++){
//				var slide_path=slides[j].path,
//				start_time=slides[j].start_time,
//				end_time=slides[j].end_time,
//				slide_id=0;
//				connection.query("insert into slides values("+slide_id+",'"+slide_path+"',"+video_id+","+start_time+","+end_time+")",function(error){
//					console.log('inserted'+j+error);
//				});
//			}
//			res.end(''+video_id);
//				}
//			else
//				{
//				res.end('error');
//				}
//		});
//		
//	});
}

exports.home = home;
exports.upload = upload;
exports.serveStatic = serveStatic;
exports.insertData=insertData;