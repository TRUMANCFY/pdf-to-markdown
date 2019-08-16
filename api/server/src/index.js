import Parser from './Parser'

import express from 'express'
import bodyParser from 'body-parser'
import multer from 'multer'
import cors from 'cors'

var app = express();
var port = process.env.PORT || 3000;
var upload = multer({});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cors())

app.listen(port);

var parser = new Parser()

console.log('todo list RESTful API server started on: ' + port);

app.post('/api/pdf2md', upload.any(), async (req, res) => {
    var file = req.files[0]
    var fileBuffer = file.buffer
    console.log(fileBuffer)
    
    await parser.readBuffer(fileBuffer)
    res.send(parser.text)
})