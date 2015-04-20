// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var gm = require('gm')
    .subClass({
        imageMagick: true
    }); // Enable ImageMagick integration. Built into Lambda
var util = require('util');

// constants
var sizeConfigs = [{
    postfix: '_w1000',
    width: 1000
}, {
    postfix: '_w480',
    width: 480,
}, {
    postfix: '_w200',
    width: 200
}, {
    postfix: '_w100',
    width: 100
}];

exports.handler = function(event, context) {

    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;
    var dstBucket = "destination-bucket";
    var elements = srcKey.split('.');
    var dstFolderName = elements[0];
    
    if(dstFolderName==null){
        return context.fail();
    }

    // Sanity check: validate that source and destination are different buckets.
    if (srcBucket == dstBucket) {
        console.error("Destination bucket must not match source bucket.");
        return context.fail();
    }

    var typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.error('unable to infer image type for key ' + srcKey);
        return context.fail();
    }
    
    var imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "jpeg" && imageType != "png") {
        console.log('skipping non-image ' + srcKey);
        return context.fail();
    }

    // Download the image from S3, transform, and upload to a different S3 bucket.
    async.waterfall([
        function download(next) {
            s3.getObject({
                    Bucket: srcBucket,
                    Key: srcKey
                },
                next);
        },
        function tranform(response, next) {
            async.map(sizeConfigs, resize, function(err, mapped) {
                next(err, mapped);
            });

            function resize(config, callback) {
                gm(response.Body)
                    .size(function(err, size) {
                        if(err){next(err);}
                        
                        var width = config.width;
                        var height = null;

                        this.resize(width, height)
                            .toBuffer('jpg', function(err, buffer) {
                                //  console.log('toBuffer');
                                if (err) {
                                    console.error(err);
                                    callback(err);
                                }
                                else {
                                    var obj = config;
                                    obj.contentType = 'image/jpeg';
                                    obj.data = buffer;
                                    var withPostFix = dstFolderName + config.postfix + '.' + 'jpg';
                                    obj.dstKey = dstFolderName + '/' + withPostFix;
                                    callback(null, obj);
                                }
                            });
                    });
            }
        },
        function upload(items, next) {

            async.each(items,
                function(item, callback) {
                    s3.putObject({
                        Bucket: dstBucket,
                        Key: item.dstKey,
                        Body: item.data,
                        ContentType: item.contentType
                    }, callback);
                },
                function(err) {
                    next(err);
                });

        }
    ], function(err) {
        if (err) {
            console.error(
                'Unable to resize ' + srcBucket + '/' + srcKey +
                ' and upload to ' + dstBucket + '/' + dstFolderName +
                ' due to an error: ' + err
            );
        }
        else {
            console.log(
                'Successfully resized ' + srcBucket + '/' + srcKey +
                ' and uploaded to ' + dstBucket + '/' + dstFolderName + '/'+dstFolderName+'[postFix].jpg'
            );
            context.done();
        }
    });
};