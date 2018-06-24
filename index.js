var express = require('express'); 
var syncrequest = require('sync-request');
var fs = require('fs');
var server = express(); 

var source1 = {
	url: 'https://api.meetup.com/find/upcoming_events',
	method: 'GET',
	name: 'meetup',
	qs: {
		key: '346937a3e532d585720c326427463',
		text: 'web',
		start_date_range: '2018-07-10T00:00:00',
		end_date_range: '2018-07-30T00:00:00',
		radius: '1',
		lon: '-122.42',
		lat: '37.78',
		page: '1000'
	}
};

var source2 = {
	url: 'https://www.eventbriteapi.com/v3/events/search',
	method: 'GET',
	name: 'eventbrite',
	qs: {
		token: 'JE5MH4JWLA4NGOFVDR7S',
		q: 'web',
		'start_date.range_start': '2018-07-10T00:00:00',
		'start_date.range_end': '2018-07-30T00:00:00',
		'location.within': '10km',
		'location.longitude': '-122.42',
		'location.latitude': '37.78',
		page: 1
	}
};

function remove_copies(js_meetup, js_eventbrite) {
	var num = 0;
	for (var i = 0; i < js_meetup.length; i++) {
		for (var j = 0; j < js_eventbrite.length; j++) {
			if ( js_meetup[i].name == js_eventbrite[j].name.text ) {
				js_eventbrite.splice(j, 1);
				num++;
			}
		}
	}
	console.log('Продублированные встречи: ' + num);
}

function getJS(data) {
	var req = syncrequest(data.method, data.url, data);
	var response = JSON.parse(req.getBody('utf8'));
	console.log(data.name+ ' : ' + response.events.length + ' встреч,');
	return response.events;
}

function collect(js_meetup, js_eventbrite) {
	var united = []; 
	for (var i = 0; i < js_meetup.length; i++) {
		var item = {
			'name': js_meetup[i].name,
			'link': js_meetup[i].link,
			'description': js_meetup[i].description,
			'date_time': js_meetup[i].local_date + ' Time: ' + js_meetup[i].local_time + ':00'
		}
	united = united.concat(item);
}
	for (var j = 0; j < js_eventbrite.length; j++) {
		var item = {
			'name': js_eventbrite[j].name.text,
			'link': js_eventbrite[j].url,
			'description': js_eventbrite[j].description.html,
			'date_time': js_eventbrite[j].start.local
		}
	united = united.concat(item);
}
return united;
}

function create_page() {
	for (var i = 0; i < united.length; i++) {
		united[i].date = new Date(Date.parse(united[i].date_time)).toLocaleString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
	}
	var thisdate = united[0].date;

	fs.writeFileSync('page.html', 
		'<!DOCTYPE html>' + 
		'<html lang="en">' + 
		'<head><meta charset="UTF-8"><title>Meetings in San Francisco</title>' +
		'<link rel="stylesheet" href="/public/css/main.css">' + 
		'</head>' + 
		'<body>' +
		'<div><h1>Meetings in San Francisco</h1>');

	for (var i = 1; i < united.length; i++) {

		if (united[i].date == thisdate) {
			
			fs.appendFileSync('page.html',
				'<h3 class="title"><a href=' + united[i].link + ' target=blank>' + united[i].name + '</a></h2><br>' + 
				'<div class="date">Date: </strong> ' + united[i].date_time + '</div><br>' +
				'<div class="gradient"><strong>Description:</strong> ' + united[i].description + '</div><br><br>'
			)
		} else { 
			thisdate = united[i].date;
			fs.appendFileSync('page.html', '<h2>' + '</h2>');
		}
	}
	fs.appendFileSync('page.html', '</body></html>');
	console.log('Итого встреч: ' + united.length);
}

var json_meetup = getJS(source1);
var json_eventbrite = getJS(source2);
remove_copies(json_meetup, json_eventbrite);
var united = collect(json_meetup, json_eventbrite);

united.sort(function(event1, event2) {
	return Date.parse(event1.date_time) - Date.parse(event2.date_time);
});
create_page();
server.use('/public', express.static('public'));
server.get('/', function(req, res) {
 	res.sendFile(__dirname + "/page.html");
 });
server.listen(10); //http://127.0.0.1:10

