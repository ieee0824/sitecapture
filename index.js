var webshot = require('webshot');
var fs = require('fs');
var ARGV = require('argv');
var AWS = require('aws-sdk');
var crypto = require('crypto');
var async = require('async');

const URL = require('url');

var argsOptions = [
    {
        name: 'input_src',
        short: 'insrc',
        type: 'string',
        description: 'json を受け渡す入力ソース',
        example: '-insrc file or --input_src=file, src type: "file, Amazon SQS"'
    },
    {
	name: 'screen_size',
	short: 'ss',
	type: 'string',
	description: 'スクショを撮る時の大きさ',
	example: '-ss 1024x768 or --screen_size=1024x768'
    },
    {
	name: 'src',
	short: 's',
	type: 'string',
	description: 'スクショ取りたいURL',
	example: '-s http://example.com or --src=http://example.com formatはjsonでも良い[{"url":"http://example.com","option":{}}]'
    },
    {
        name: 'profile',
        short: 'p',
        type: 'string',
        description: 'credentialsに書いてる奴',
        example: '-p dev/developer'
    },
    {
        name: 'aws_access_key_id',
        type: 'string',
        description: 'aws access key id',
        example: '--aws_access_key_id ...'
    },
    {
        name: 'aws_secret_access_key_id',
        type: 'string',
        description: 'aws secret access key id',
        example: '--aws_secret_access_key_id ...'
    },
    {
        name: 'region',
        type: 'string',
        description: 'aws region',
        example: '--region ap-northeast-1'
    },
    {
        name: 'queue_url',
        type: 'string',
        description: 'queue url',
        example: '--queue_url https://foobarbaz.com'
    },
    {
        name: 's3_bucket_name',
	short: "bucket",
        type: 'string',
        description: 's3 bucket name',
        example: '-bucket hogehoge_bucket'
    },
    {
        name: 'path',
	short: "path",
        type: 'string',
        description: 'save path',
        example: '-path sitecapture/hogehoge'
    }
];

ARGV.option(argsOptions);
const args = ARGV.run().options;
const DEFAULT_SCREEN_SIZE = {
    width: 1024,
    height: 768
};

const SCREEN_SIZE = function(){
    if (args.screen_size == null) {
	return DEFAULT_SCREEN_SIZE;
    }
    const size = args.screen_size.split("x");
    if (size.length != 2) {
	return DEFAULT_SCREEN_SIZE;
    }
    return {width: size[0], height: size[1]};
}();



const OPTIONS = {
    windowSize: SCREEN_SIZE,
    screenSize: SCREEN_SIZE,
    shotSize: SCREEN_SIZE,
    streamType: 'png',
    defaultWhiteBackground: true
};

const S3_BUCKET = function(args){
    if (args.s3_bucket_name == null) {
	console.log("no input s3 bucket name.");
	process.exit()
    }
    return args.s3_bucket_name;
}(args);

const UPLOAD_PATH = function(args){
    if (args.path == null) {
	return "";
    }
    return args.path + "/";
}(args);


main(args);

function main(args){
    getURLsFromAamazonSQS(args, "./img", OPTIONS);
}


function getSQSClient(args){
    if (args.queue_url == null) {
	console.log("no queue url");
	process.exit();
    }

    if (args.profile != null) {
	var credentials = new AWS.SharedIniFileCredentials(
		{
		    profile: function(p){
			if (p = "") {
			    return "default";
			}
			return p;
		    }(args.profile)
		}
	);
	AWS.config.credentials = credentials;
    } else if (args.aws_access_key_id != null && args.aws_secret_access_key_id != null) {
	AWS.config.update({accessKeyId: args.aws_access_key_id, secretAccessKey: args.aws_secret_access_key_id});
    }

    var sqs;
    if (args.region == null) {
	sqs = new AWS.SQS({region:'ap-northeast-1'});
    } else {
        sqs = new AWS.SQS({region: args.region});
    }
    return sqs;
}


function getURLsFromAamazonSQS(args, output_dir, options){
    var sqs = getSQSClient(args);
    var sqsParamsReceive = {
	QueueUrl: args.queue_url,
	WaitTimeSeconds: 20,
	MaxNumberOfMessages: 10
    };
    sqs.receiveMessage(sqsParamsReceive, function(err, data) {
	if (err) {
	    console.log(err, err.stack);
	    process.exit();
	}
	data.Messages.forEach(function(v, i, arr){
            deleteSQSMessage(args, v.ReceiptHandle)
	});
        data.Messages.forEach(function(v, i, arr){
	    capture(v.Body, output_dir, options)
        });
    });
}

function deleteSQSMessage(args, receiptHandle) {
    var sqs = getSQSClient(args);
    var params = {
	QueueUrl: args.queue_url,
	ReceiptHandle: receiptHandle
    }
    sqs.deleteMessage(params, function(err, data) {
	if (err) {
	    console.log(err, err.stack);
	}
    });
}

function capture(srcs, output_dir, options) {
    if (!isJson(srcs)) {
	console.log("illegal format. please json format.");
	process.exit();
    }
    var urls = JSON.parse(srcs);
    async.eachLimit(urls, 2, function(v, next) {
        var out = getHost(v.url);
        if (out == "null") {
            out = v.url;
        }
	var renderStream = webshot(v.url, options);
	var file = fs.createWriteStream("img/" + getHash(v.url), {encoding: 'binary'});
	renderStream.on('data', function(data) {
	    file.write(data.toString('binary'), 'binary');
	})
	.on('error', function(e){
	    console.log(e);
	})
	.on('end', function(){
    	    var s3 = new AWS.S3({
	        params: {
		    Bucket: S3_BUCKET,
		    Key: UPLOAD_PATH + encodeBase64(v.url)
	        }
	    });
	    s3.upload({
	        Body: fs.createReadStream(file.path)
	    }, 
	    function(err, data) {
	        if(err)console.log(err);
		fs.unlink(file.path, function(err) {
		    if (err) console.log(err);
		    else console.log(file.path, "is delete");
                    next(null, v.url);
		});
	    });
	});
    });
}



function getHash(str){
    var sha512 = crypto.createHash('sha512');
    sha512.update(str);
    return sha512.digest('hex');
}

function encodeBase64(str) {
    var b = new Buffer(str);
    return b.toString('base64');
}

function getHost(url) {
    return URL.parse(url).hostname;
}

function isJson(str) {
    try {
	JSON.parse(str);
    } catch (e) {
	return false;
    }
    return true;
}

