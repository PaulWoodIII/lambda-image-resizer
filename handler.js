// dependencies
var AWS = require('aws-sdk');
var gm = require('gm').subClass({
    imageMagick: true
});
var fs = require("fs");
var tmp = require("tmp");
var async = require("async");

// get reference to S3 client
var s3 = new AWS.S3();

var _800px = {
    width: 800,
    destinationPath: "large"
};

var _500px = {
    width: 500,
    destinationPath: "medium"
};

var _200px = {
    width: 200,
    destinationPath: "small"
};

var _45px = {
    width: 45,
    destinationPath: "thumbnail"
};

var _sizesArray = [_800px, _500px, _200px, _45px];

var len = _sizesArray.length;

exports.AwsHandler = function(event) {
    // Read options from the event.
    var destinationBucket = 'shazart-images';
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;
    var dstnKey = srcKey;

    // create temporary directory
    var tmpobj = tmp.dirSync();

    // function to determine paths
    function _filePath(directory, i) {
        if (!directory) {
            return "dst/" + _sizesArray[i].destinationPath + "/" + dstnKey;
        }
        else {
            return directory + "/dst/" + _sizesArray[i].destinationPath + "/" + dstnKey;
        }
    };

    // Infer the image type.
    var typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.error('unable to infer image type for key ' + srcKey);
        return;
    };

    var imageType = typeMatch[1];

    if (imageType != "jpg" && imageType != "png") {
        console.log('skipping non-image ' + srcKey);
        return;
    };


    // Actually call resizeImage, the main pipeline function:
    resizeImage(function(err) {
        // Done. Manual cleanup of temporary directory
        tmpobj.removeCallback();
    })


    function resizeImage(callback) {
        var s3obj = {
            Bucket: srcBucket,
            Key: srcKey
        };
        download(s3obj, function(response) {
            var gmConfigs = sizesArray.map(function(size, i) {
                return {
                    width: size.width,
                    _Key: _filePath(tmpobj, i)
                }
            })

            async.eachSeries(gmConfigs,
                function(config, done) {
                    transform(response, config.width, config._Key, done)
                },
                function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        upLoad();
                        // Further work is required to identify if all the uploads worked,
                        // and to know when to call callback() here
                        // callback();
                    }
                })
        })
    }

    function download(s3obj, callback) {
        console.log("started!");

        s3.getObject(s3obj, function(err, response) {
            if (err) {
                console.error(err);
            }
            // call transform if successful
            callback(response);
        });
    };

    function transform(response, width, _Key, callback) {
        // resize images
        gm(response.Body, srcKey)
            .resize(width)
            .write(_Key, function(err) {
                if (err) {
                    console.error(err);
                }
                callback();
            });
    };

    function upLoad() {
        for (var i = 0; i < len; i++) {
            var readPath = _filePath(tmpobj, i);
            var writePath = _filePath(i);
            // read file from temp directory
            fs.readFile(readPath, function(err, data) {
                if (err) {
                    console.error(err);
                }

                // upload images to s3 bucket
                s3.putObject({
                        Bucket: destinationBucket,
                        Key: writePath,
                        Body: data,
                        ContentType: data.type
                    },
                    function(err) {
                        if (err) {
                            console.error(err);
                        }
                        console.log("Uploaded with success!");
                    });
            })
        }
    };

};