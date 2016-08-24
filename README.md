# sitecapture

## これは何
指定したSQSにURLを積むとスクリーンショットをとってS3にあげてくれるやつ

### SQSにいれるメッセージの形式
```
[
	{"url":"http://www.google.com/","option":{}},
	{"url":"http://www.yahoo.co.jp/","option":{}}
]
```

## セットアップ
```
$ npm install
```

## 実行方法
```
% node index.js --queue_url=https://sqs.${REGION}.amazonaws.com/${AWS_UID}/${SQS_QUEUE_NAME} --aws_access_key_id=${ACCESS_KEY} --aws_secret_access_key_id=${SECRET_KEY} --s3_bucket_name=${S3_BUCKET_NAME} --path=${S3_PATH} --tmp=${WORKE_DIR}
```

細かいオプションに関しては `node index.js -h` で確認できる

# LICENSE

```
MIT License

Copyright (c) 2016 shirase_aoi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
