            // fetching DOM references
			var min=0,sec=0;
			var duration=0;
			var timer;
            var btnStartRecording = document.querySelector('#btn-start-recording');
            var btnStopRecording  = document.querySelector('#btn-stop-recording');
            var preview=document.querySelector('#preview');
            var videoElement      = document.querySelector('video');
            
            var progressBar = document.querySelector('#progress-bar');
            var percentage = document.querySelector('#percentage');
            // global variables
            var currentBrowser = !!navigator.mozGetUserMedia ? 'gecko' : 'chromium';
            var videoFile;
            var fileName;
            var audioRecorder;
            var videoRecorder;
            var slides=[];
    		//var slide={'path':'','start_time':'','end_time':''};
            // Firefox can record both audio/video in single webm container
            // Don't need to create multiple instances of the RecordRTC for Firefox
            // You can even use below property to force recording only audio blob on chrome
            // var isRecordOnlyAudio = true;
            var isRecordOnlyAudio = !!navigator.mozGetUserMedia;
            //alert("recoder only="+isRecordOnlyAudio);
              //alert(currentBrowser);
            // if recording only audio, we should replace "HTMLVideoElement" with "HTMLAudioElement"
            if(isRecordOnlyAudio && currentBrowser == 'chromium') {
                var parentNode = videoElement.parentNode;
                parentNode.removeChild(videoElement);
              
                videoElement = document.createElement('audio');
                videoElement.style.padding = '.4em';
                videoElement.controls = true;
                parentNode.appendChild(videoElement);
            }
            // reusable helpers
            
            // this function submits both audio/video or single recorded blob to nodejs server
            function postFiles(audio, video) {
                // getting unique identifier for the file name
                //alert("post file");
                fileName = generateRandomString();
                
                // this object is used to allow submitting multiple recorded blobs
                var files = { };

                // recorded audio blob
                files.audio = {
                    name: fileName + '.' + audio.blob.type.split('/')[1],
                    type: audio.blob.type,
                    contents: audio.dataURL
                };
                
                if(video) {
                    files.video = {
                        name: fileName + '.' + video.blob.type.split('/')[1],
                        type: video.blob.type,
                        contents: video.dataURL
                    };
                }
                
                files.uploadOnlyAudio = !video;

                videoElement.src = '';
                videoElement.poster = '/ajax-loader.gif';

                xhr('/uploadvideo', JSON.stringify(files), function(_fileName) {
                    var href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
                    videoElement.src = href + 'upload/' + _fileName;
                    videoElement.play();
                    videoElement.muted = false;
                    videoElement.controls = true;
                    videoFile=_fileName;
                    $('#preview').removeAttr('disabled');
                    
                });
                
                if(mediaStream) mediaStream.stop();
            }
            
            // XHR2/FormData
            function xhr(url, data, callback) {
                var request = new XMLHttpRequest();
                request.onreadystatechange = function() {
                    if (request.readyState == 4 && request.status == 200) {
                        callback(request.responseText);
                    }
                };
                        
               /* request.upload.onprogress = function(event) {
                    progressBar.max = event.total;
                    progressBar.value = event.loaded;
                    progressBar.innerHTML = 'Upload Progress ' + Math.round(event.loaded / event.total * 100) + "%";
                };
                        
                request.upload.onload = function() {
                    percentage.style.display = 'none';
                    progressBar.style.display = 'none';
                };*/
                request.open('POST', url);
                request.send(data);
            }

            // generating random string
            function generateRandomString() {
                if (window.crypto) {
                    var a = window.crypto.getRandomValues(new Uint32Array(3)),
                        token = '';
                    for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
                    return token;
                } else {
                    return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
                }
            }
            
            // when btnStopRecording is clicked
            function onStopRecording() {
                audioRecorder.getDataURL(function(audioDataURL) {
                    var audio = {
                        blob: audioRecorder.getBlob(),
                        dataURL: audioDataURL
                    };
                    
                    // if record both wav and webm
                    if(!isRecordOnlyAudio) {
                        videoRecorder.getDataURL(function(videoDataURL) {
                            var video = {
                                blob: videoRecorder.getBlob(),
                                dataURL: videoDataURL
                            };
                            
                            postFiles(audio, video);
                        });
                    }
                    
                   // alert(audio.blob+audio.dataURL);
                    // if record only audio (either wav or ogg)
                    if (isRecordOnlyAudio) 
                    	{
                    	//alert("only audio");
                    	postFiles(audio);
                    	}
                });
            }
            var mediaStream = null;
            // reusable getUserMedia
            function captureUserMedia(success_callback) {
                var session = {
                    audio: true,
                    video: true
                };
                navigator.getUserMedia = ( navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia);
                if(navigator.getUserMedia){
                navigator.getUserMedia(session, success_callback, function(error) {
                    alert( error );
               
                });
                }
                else{
                	alert("doest not support getusermedia");
                }
            }
            preview.onclick=function(){
            	 var video={'path':'upload/'+videoFile,'duration':duration};
                 console.log(slides+' '+video);
                 for(var i=0;i<slides.length-1;i++){
                	 slides[i].end_time=slides[i+1].start_time;
                	 console.log(i+"  "+slides[i].path+"  "+slides[i].start_time+"  "+slides[i].end_time);
                 }
                 slides[i].end_time=duration;
                 var slides_data={'video':video,'slides':slides};
                // alert(slides_data);
                 upload_slides(slides_data);
                 duration=0;
            };
           btnStartRecording.onclick = function() {
                btnStartRecording.disabled = true;
                
                captureUserMedia(function(stream) {
                    mediaStream = stream;
                	    //alert(stream);
                    videoElement.src = window.URL.createObjectURL(stream);
                    videoElement.play();
                    videoElement.muted = true;
                    videoElement.controls = false;
                    timer=setInterval(function(){
                    	var str='0'+min+':0'+sec;
                    	var str1='0'+min+':'+sec;
                    	var str2=min+':0'+sec;
                    	document.getElementById('time_span').innerHTML=(min<10?(sec<10?str:str1):(sec<10?str2:min+':'+sec));
                    	sec++;
                        if(sec>=60)
                        	{
                        	min++;
                        	sec=0;
                        	}
                        duration++;
                    },1000);
                    //alert(videoElement.src);
                    // it is second parameter of the RecordRTC
                    var audioConfig = {};
                    if(!isRecordOnlyAudio) {
                        audioConfig.onAudioProcessStarted = function() {
                            // invoke video recorder in this callback
                            // to get maximum sync
                      	   videoRecorder.startRecording();
                        };
                    }
                    
                    audioRecorder = RecordRTC(stream, audioConfig);
                    
                    if(!isRecordOnlyAudio) {
                        // it is second parameter of the RecordRTC
                        var videoConfig = { type: 'video' };
                        videoRecorder = RecordRTC(stream, videoConfig);
                    }
                    
                    audioRecorder.startRecording();
                    
                    // enable stop-recording button
                    btnStopRecording.disabled = false;
                });
            };


            btnStopRecording.onclick = function() {
                btnStartRecording.disabled = false;
                btnStopRecording.disabled = true;
                clearInterval(timer);
                min=0;sec=0;
                if(isRecordOnlyAudio) {
                    audioRecorder.stopRecording(onStopRecording);
                }

                if(!isRecordOnlyAudio) {
                    audioRecorder.stopRecording(function() {
                        videoRecorder.stopRecording(function() {
                            onStopRecording();
                        });
                    });
                }
                
            };
            window.onbeforeunload = function() {
                startRecording.disabled = false;
            };
            function upload_slides(slides_data){
            	//alert('upload_slides');
            	xhr('/syncvideowithslides',JSON.stringify(slides_data),function(response){
            		//alert(response);
            		$.session.set('video_id',response);
            		$('#preview_modal').modal();
            		
            		//window.open('http://localhost:8000/preview.html');
            	});
            	/*$.post('syncvideowithslides',slides_data,function(data,status){
            		alert(status);
            	});*/
            }
        
