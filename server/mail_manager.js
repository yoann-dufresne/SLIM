const nodemailer = require('nodemailer');

const config = require ('./config.js');
const scheduler = require('./scheduler.js');


let transporter = null

if (config.mailer.auth.user == 'username') {
	console.warn('\nWarning: Mailer not configured ! Please fill the file server/config.js with your own mail address.\n');
} else {
	transporter = nodemailer.createTransport(config.mailer);
}



let send_mail = (token, subject, text) => {
	if (transporter == null) {
		console.warn("Mailer not configured !!!");
		return;
	}

	if (!exports.mails[token])
		return;

	let mail = exports.mails[token];
	if (mail == 'aaa') {
		console.warn ("Please only use this fake email only for debug !!");
		return;
	}

	let mailOptions = {
		from: 'Slim <' + config.mailer.__address + '>', // sender address
		to: mail, // list of receivers
		subject: '[No reply] ' + subject, // Subject line
		text: text
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			return;
		}

		console.log(token + ': email sent');
	});
};


exports.mails = {};


exports.send_address = (token) => {
	send_mail(
		token,
		'Your job ' + token,
		'Here is the link to follow the execution process.\n' +
		scheduler.urls[token] + '\n\n' +
		'The amplicon pipeline staff'
	);
};


exports.send_end_mail = (token) => {
	send_mail(
		token,
		'Your job ' + token + ' is over',
		'Your results are available at this address:\n' +
		scheduler.urls[token] + '\n\n' +
		'Your session will automatically deleted in 24h. Don\'t forget to download your results\n\n' +
		'The amplicon pipeline staff'
	);
}

exports.send_delete_reminder = (token) => {
	send_mail(
		token,
		'Your job ' + token + ' will be deleted in an hour',
		'Your results are still available at this address for one hour:\n' +
		scheduler.urls[token] + '\n\n' +
		'The amplicon pipeline staff'
	);
}


