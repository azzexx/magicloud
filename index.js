const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const JSONdb = require('simple-json-db');
const db = new JSONdb('./db.json');

const app = express();
//limit is in hours instead of days, weeks or months (gives more control)
const limitResetPeriod = process.env.LIMITRESET;
//Upload limit is currently at 4 uploads a day.

//TBH, I think we should publicly display the limit, even if people decide to game it (if we do it right it won't affect us much). We should also have a total upload limit, in which people have to delete files to add more - Baconman321
const uploadLimit = process.env.UPLOADLIMIT;
app.use(
	fileUpload({
		createParentPath: true
	})
);


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render('home.html');
});

app.get('/home', (req, res) => {
	res.render('home.html');
});

app.get('/support', (req, res) => {
  res.redirect('https://discord.gg/hmJKG7ssZf');
});

app.post('/upload', (req, res) => {
	var file = req.files.file;
	var name = file.name;
	var originame = file.name;
	var type = file.mimetype;
	var size = file.size;
	var dimensions = file.image - size;
	if (size > 10000000) {
		res.send('Sorry, that file is too large.');
	} else {
		number = 0;
		if (Object.keys(db.storage).includes(name)) {
			while (true) {
				number += 1;
				name = originame + '-' + String(number);
				if (!Object.keys(db.storage).includes(name)) break;
			}
		}
		db.set(name, { name: name, type: type, size: size });
		file.mv('./uploads/' + name);
		res.redirect('/file/' + name);
	}
});

app.get('/file/:filename', (req, res) => {
	filename = req.params.filename;
	if (Object.keys(db.storage).includes(filename)) {
		info = db.get(filename);
		size = info.size;
		if (size > 10000000) {
			size = String(Math.round(size / 100000) / 1000) + ' MB';
		} else if (size > 1000) {
			size = String(Math.round(size / 100) / 1000) + ' KB';
		} else {
			size = String(size) + ' Bytes';
		}
		res.render('file.html', {
			filename: info.name,
			type: info.type,
			size: size
		});
	} else {
		res.redirect('/');
	}
});

app.get('/file/:filename/download', (req, res) => {
	filename = req.params.filename;
	if (Object.keys(db.storage).includes(filename)) {
		res.download(process.cwd() + '/uploads/' + filename);
	} else {
		res.redirect('/');
	}
});

app.get('/uploads/:filename', (req, res) => {
	filename = req.params.filename;
	if (Object.keys(db.storage).includes(filename)) {
		res.sendFile(process.cwd() + '/uploads/' + filename);
	} else {
		res.redirect('/');
	}
});

app.get('/*', (req, res) => {
	res.render('404.html');
});

app.listen(3000, () => {
	console.clear();
	console.log('Server Online.');
});
