
'use strict';
var fs = require('fs');
var unzip=require("unzip2");
var fstream=require("fstream");
var cloudconvert = new (require('cloudconvert'))('fyBicM0wsFpuSInEngnHMkCIIGgmO3bzAXshgPZPztOXSnP0RYigUe-39cUjpMmmmvr_ZaB-I75paFF4FlTbJQ');
/*
fs.createReadStream('appt.ppt').pipe(cloudconvert.convert({
    inputformat: 'ppt',
    outputformat: 'jpg',
    converteroptions: {
        quality : 75,
    }
}).on('error', function(err) {
    console.error('Failed: ' + err);
}).on('finished', function(data) {
    console.log('Done: ' + data.message);
    this.pipe(fs.createWriteStream('out.zip'));
}).on('downloaded', function(destination) {
    console.log('Downloaded to: ' + destination.path);
}));
*/
fs.mkdirSync("public/upload/appt");
var read=fs.createReadStream('appt.zip');
read.pipe(unzip.Extract({ path: 'public/upload/appt' }));
read.on('end',function(){
	fs.readdir('public/upload/appt', function(err, files) {
		for(var i=0;i<files.length;i++){
			console.log(files[i]);
		}
	});
});



