#!/usr/bin/env node
/* API системы Agl */
/*
*	автор:				Юрий Николаевич Лобарев
*	skype:				efrantick
*	телефон:			+7(910) 983-95-90
*	авторские права:	Все права принадлежат автору © Юрий Лобарев, 2016
*/
"use strict";

// Подключаем модули
const anyks = require("./lib.anyks");
// Функция активации сервера
(function($){
	// Название системы
	const name = "agl";
	// Версия системы
	const version = "1.0";
	// Интервал проверки обновления 24 часов
	const intUpdateMetro = (24 * 31);
	// Отладочная информация
	const debug = {
		// Отображать ошибки
		"errors":	true,
		// Отображать сообщения
		"message":	true
	};
	/**
	 * exec Функция управления генераторами
	 * @param  {Generator} gen      генератор
	 * @param  {Function}  callback функция обратного вызова при завершении работы
	 * @param  {Variant}   val      полученное значение
	 */
	const exec = (gen, callback, val) => {
		// Передаем первоначальные данные
		let next = gen.next(val);
		// Если генератор завершен не полностью
		if(!next.done){
			next.value.then(
				res => exec(gen, callback, res),
				err => gen.throw(err)
			);
		// Выполняем функцию обратного вызова
		} else callback(next.value);
	};
	/**
	 * Класс Agl с базовыми методами
	 */
	class Agl {
		/**
		 * constructor Конструктор класса
		 */
		constructor(){
			// Устанавливаем название системы
			this.name = name;
			// Устанавливаем версию системы
			this.version = version;
			// Устанавливаем тип отладки
			this.debug = debug;
			// Устанавливаем объект api anyks
			this.anyks = $;
			// Устанавливаем объект клиентов
			this.clients = {};
			// Запоминаем интервал обновления базы данных метро
			this.intervalUpdateMetro = intUpdateMetro  * 3600000;
		}
		/**
		 * generateKey Функция генерирования ключа
		 * @param  {String} str строка для генерации
		 * @return {String}     сгенерированный ключ
		 */
		generateKey(str = null){
			// Подключаем модуль md5
			const md5 = require('MD5');
			// Генерируем от текущего времени
			let mkey = md5((new Date()).valueOf().toString());
			// Если это строка
			if($.isString(str)) mkey = md5(str);
			// Формируем новый вид ключа
			let key = (mkey.substr(0, 8) + mkey.substr(24, 31));
			// Выводим результат
			return key.replace(key.substr(4, 8), mkey.substr(8, 16));
		}
		/**
		 * getAddressFromGPS Метод получения данных адреса по GPS координатам
		 * @param  {Float}   lat    широта
		 * @param  {Float}   lng    долгота
		 * @return {Promise}        промис содержащий объект с адресом
		 */
		getAddressFromGPS(lat, lng){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Подключаем модуль закачки данных
			const fetch = require('node-fetch');
			// Массив с геокодерами
			const urlsGeo = [
				'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=$lng,$lat',
				'http://maps.googleapis.com/maps/api/geocode/json?address=$lat,$lng&sensor=false&language=ru',
				'http://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&addressdetails=1&zoom=18'
			].map(val => val.replace("$lat", lat).replace("$lng", lng));
			// Получаем объект запроса с геокодера
			const init = obj => {
				// obj.data.response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData
				// obj.data.response.GeoObjectCollection.featureMember[0].GeoObject

				/*
				const nobj = obj.data.response.GeoObjectCollection.featureMember[0];

				const ya = {
					"pos":							idObj.anyks.fnShowProps(nobj, "pos").split(" "),
					"kind":							idObj.anyks.fnShowProps(nobj, "kind"),
					"text":							idObj.anyks.fnShowProps(nobj, "text"),
					"precision":					idObj.anyks.fnShowProps(nobj, "precision"),
					"AddressLine":					idObj.anyks.fnShowProps(nobj, "AddressLine"),
					"CountryNameCode":				idObj.anyks.fnShowProps(nobj, "CountryNameCode"),
					"CountryName":					idObj.anyks.fnShowProps(nobj, "CountryName"),
					"AdministrativeAreaName":		idObj.anyks.fnShowProps(nobj, "AdministrativeAreaName"),
					"SubAdministrativeAreaName":	idObj.anyks.fnShowProps(nobj, "SubAdministrativeAreaName"),
					"LocalityName":					idObj.anyks.fnShowProps(nobj, "LocalityName"),
					"ThoroughfareName":				idObj.anyks.fnShowProps(nobj, "ThoroughfareName"),
					"description":					idObj.anyks.fnShowProps(nobj, "description"),
					"name":							idObj.anyks.fnShowProps(nobj, "name")
				};

				console.log("+++++++++", obj.status, ya);
				*/
				
				/*
				const nobj = obj.data.results[0];

				const ga = {
					"location":				nobj.geometry.location,
					"location_type":		nobj.geometry.location_type,
					"address_components":	nobj.address_components,
					"formatted_address":	nobj.formatted_address
				};

				console.log("+++++++++", obj.status, JSON.stringify(ga));
				*/
				
				const nobj = obj.data;

				const osm = {
					"place_id":		idObj.anyks.fnShowProps(nobj, "place_id"),
					"boundingbox":	idObj.anyks.fnShowProps(nobj, "boundingbox"),
					"lat":			idObj.anyks.fnShowProps(nobj, "lat"),
					"lon":			idObj.anyks.fnShowProps(nobj, "lon"),
					"display_name": idObj.anyks.fnShowProps(nobj, "display_name"),
					"class":		idObj.anyks.fnShowProps(nobj, "class"),
					"type":			idObj.anyks.fnShowProps(nobj, "osm_type"),
					"id":			idObj.anyks.fnShowProps(nobj, "osm_id"),
					"importance":	idObj.anyks.fnShowProps(nobj, "importance"),
					"icon":			idObj.anyks.fnShowProps(nobj, "icon"),
					"address": {
						"road":				idObj.anyks.fnShowProps(nobj, "road"),
						"city":				idObj.anyks.fnShowProps(nobj, "city"),
						"town":				idObj.anyks.fnShowProps(nobj, "town"),
						"state_district":	idObj.anyks.fnShowProps(nobj, "state_district"),
						"state":			idObj.anyks.fnShowProps(nobj, "state"),
						"postcode":			idObj.anyks.fnShowProps(nobj, "postcode"),
						"country":			idObj.anyks.fnShowProps(nobj, "country"),
						"country_code":		idObj.anyks.fnShowProps(nobj, "country_code")
					}
				};

				console.log("+++++++++", obj.status, osm);

			};
			/**
			 * *getData Генератор для получения данных с геокодеров
			 * @return {Boolean} результат запроса из базы
			 */
			const getData = function * (){
				/*
				// Выполняем запрос с геокодера Yandex
				const yandex = yield fetch(urlsGeo[0]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				);
				*/
				
				const yandex = false;
				/*
				// Выполняем запрос с геокодера Google
				const google = (!yandex ? yield fetch(urlsGeo[1]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				) : false);
				*/
				
				const google = false;

				// Выполняем запрос с геокодера OpenStreet Maps
				const osm = (!google ? yield fetch(urlsGeo[2]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				) : false);
				// Создаем объект ответа
				const obj = (
					yandex ? {data: yandex, status: "yandex"} :
					(google ? {data: google, status: "google"} :
					(osm ? {data: osm, status: "osm"} : false))
				);
				// Выполняем инициализацию
				init(obj);
			};
			// Запускаем коннект
			exec(getData());
		}
		/**
		 * getAddressFromGPS Метод получения данных адреса по строке
		 * @param  {String}   address строка запроса
		 * @return {Promise}          промис содержащий объект с адресом
		 */
		getAddressFromString(address){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Подключаем модуль закачки данных
			const fetch = require('node-fetch');
			// Массив с геокодерами
			const urlsGeo = [
				'http://geocode-maps.yandex.ru/1.x/?format=json&geocode=$address',
				'http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false&language=ru',
				'http://nominatim.openstreetmap.org/search?q=$address&format=json&addressdetails=1&limit=1'
			].map(val => val.replace("$address", encodeURI(address)));
			// Получаем объект запроса с геокодера
			const init = obj => {
				// Данные с геокодера
				let data = {}, result = false;
				// Определяем тип геокодера
				switch(obj.status){
					// OpenStreetMaps
					case "osm":
						// Если данные существуют
						if($.isArray(obj.data) && obj.data.length){
							// Получаем данные с геокодера
							data = obj.data[0];
							// Получаем основные данные
							let lat			= $.fnShowProps(data, "lat");
							let lng			= $.fnShowProps(data, "lon");
							let zip			= $.fnShowProps(data, "postcode");
							let city		= $.fnShowProps(data, "city");
							let code		= $.fnShowProps(data, "country_code");
							let street		= $.fnShowProps(data, "road");
							let region		= $.fnShowProps(data, "state");
							let country		= $.fnShowProps(data, "country");
							let district	= $.fnShowProps(data, "state_district");
							let boundingbox	= $.fnShowProps(data, "boundingbox");
							let description	= $.fnShowProps(data, "display_name");
							let gps			= [parseFloat(lng), parseFloat(lat)];
							let id			= idObj.generateKey(
								country.toLowerCase() +
								region.toLowerCase() +
								city.toLowerCase() +
								street.toLowerCase()
							);
							// Формируем объект
							result = {
								id, lat, lng, gps,
								boundingbox, description,
								address: {zip, city, code, street, region, country, district}
							};
						}
					break;
					// Yandex
					case "yandex":

					break;
					// Google
					case "google":

						data = obj.data.results[0];

						const ga = {
							"location":				data.geometry.location,
							"location_type":		data.geometry.location_type,
							"address_components":	data.address_components,
							"formatted_address":	data.formatted_address
						};

						console.log("++++++", ga);

						return;
					break;
				}
				// Подключаем модель метро
				const Models = require('../models/address');
				// Создаем модель
				const model = (new Models("address")).getData();
				// Создаем схему
				const Address = idObj.clients.mongo.model("Address", model);
				// Сохраняем результат в базу данных
				if(result) (new Address(result)).save();
				// Создаем индексы
				// db.address.createIndex({id: 1}, {name: "id"});
				// db.address.createIndex({lat: 1, lng: 1}, {name: "gps"});
				// db.address.createIndex({"address.zip": 1}, {name: "zip"});
				// db.address.createIndex({"address.district": 1}, {name: "district"});
				// db.address.createIndex({"address.region": 1, "address.country": 1, "address.street": 1, "address.city": 1}, {name: "address"});
				// db.address.createIndex({gps: "2dsphere"}, {name: "locations"});
				// Выводим результат
				return result;




				/*
				const nobj = obj.data.response.GeoObjectCollection.featureMember[0];

				const ya = {
					"pos":							idObj.anyks.fnShowProps(nobj, "pos").split(" "),
					"kind":							idObj.anyks.fnShowProps(nobj, "kind"),
					"text":							idObj.anyks.fnShowProps(nobj, "text"),
					"precision":					idObj.anyks.fnShowProps(nobj, "precision"),
					"AddressLine":					idObj.anyks.fnShowProps(nobj, "AddressLine"),
					"CountryNameCode":				idObj.anyks.fnShowProps(nobj, "CountryNameCode"),
					"CountryName":					idObj.anyks.fnShowProps(nobj, "CountryName"),
					"AdministrativeAreaName":		idObj.anyks.fnShowProps(nobj, "AdministrativeAreaName"),
					"SubAdministrativeAreaName":	idObj.anyks.fnShowProps(nobj, "SubAdministrativeAreaName"),
					"LocalityName":					idObj.anyks.fnShowProps(nobj, "LocalityName"),
					"ThoroughfareName":				idObj.anyks.fnShowProps(nobj, "ThoroughfareName"),
					"description":					idObj.anyks.fnShowProps(nobj, "description"),
					"name":							idObj.anyks.fnShowProps(nobj, "name")
				};

				console.log("+++++++++", obj.status, ya);
				*/


			};
			/**
			 * *getData Генератор для получения данных с геокодеров
			 * @return {Boolean} результат запроса из базы
			 */
			const getData = function * (){
				const yandex = false;
				/*
				// Выполняем запрос с геокодера Yandex
				const yandex = yield fetch(urlsGeo[0]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				);
				*/
				// Выполняем запрос с геокодера Google
				const google = (!yandex ? yield fetch(urlsGeo[1]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				) : false);
				// Выполняем запрос с геокодера OpenStreet Maps
				const osm = (!google ? yield fetch(urlsGeo[2]).then(
					res => (res.status === 200 ? res.json() : false),
					err => false
				) : false);
				// Создаем объект ответа
				const obj = (
					yandex ? {data: yandex, status: "yandex"} :
					(google ? {data: google, status: "google"} :
					(osm ? {data: osm, status: "osm"} : false))
				);
				// Выполняем инициализацию
				init(obj);
			};
			// Запускаем коннект
			exec(getData());
		}
		/**
		 * updateMetro Метод обновления данных базы данных метро
		 */
		updateMetro(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Подключаем модуль закачки данных
			const fetch = require('node-fetch');
			// db.metro.find({"lines.name": "Автозаводская"})
			// db.metro.find({"lines": {$elemMatch: {"name": "Автозаводская"}}});
			// db.metro.find({"lines.stations.name": "Чистые пруды"})
			// db.metro.find({"lines": {$elemMatch: {"stations": {$elemMatch: {"name": "Горьковская"}}}}});
			/**
			 * getData Функция обработки полученных данных с интернета
			 * @param  {Array} arr объект данными метро
			 */
			const getData = arr => {
				// Подключаем модель метро
				const Models = require('../models/metro');
				// Создаем модель
				const model = (new Models("metro")).getData();
				// Создаем схему
				const Metro = idObj.clients.mongo.model("Metro", model);
				// Подключаемся к коллекции metro
				const metro = idObj.clients.mongo.connection.db.collection("metro");
				// Удаляем всю коллекцию
				metro.drop();
				// Переходим по всему массиву данных
				// arr.forEach(obj => (new Metro(obj)).save());
				arr.forEach(obj => {
					// Формируем нужного вида для нас массив
					obj.lines.forEach(line => {
						// Переходим по всем линиям метро
						line.stations.forEach(station => {
							// Формируемновый ключ gps;
							station.gps = [station.lng, station.lat];
							// Выводим результат
							return station;
						});
						// Выводим полученный массив
						return line;
					});
					// Сохраняем результат
					return (new Metro(obj)).save();
				});
				// Создаем индексы
				metro.createIndex({name: 1}, {name: "city"});
				metro.createIndex({"lines.hex_color": 1}, {name: "color"});
				metro.createIndex({"lines.name": 1}, {name: "lines"});
				metro.createIndex({"lines.stations.name": 1}, {name: "stations"});
				metro.createIndex({"lines.stations.order": 1}, {name: "order"});
				metro.createIndex({"lines.stations.lat": 1, "lines.stations.lng": 1}, {name: "gps"});
				metro.createIndex({"lines.stations.gps": "2dsphere"}, {name: "locations"});
				// Очищаем таймер обновления метро
				clearInterval(idObj.timerUpdateMetro);
				// Устанавливаем таймер на проверку данных
				idObj.timerUpdateMetro = setInterval(() => idObj.updateMetro(), idObj.intervalUpdateMetro);
			};
			// Закачиваем данные метро
			fetch('https://api.hh.ru/metro')
			// Преобразуем полученный объект
			.then(res => res.json(), e => idObj.log(["get metro", e], "error"))
			// Обрабатываем полученные данные
			.then(getData, e => idObj.log(["parse metro", e], "error"));
		}
		/**
		 * mongo Метод подключения к MongoDB
		 * @param  {Object} config параметры подключения к MongoDB
		 * @return {Promise}       объект MongoDB
		 */
		mongo(config){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return new Promise((resolve, reject) => {
				try {
					// Подключаем модуль Mongoose
					idObj.clients.mongo = require('mongoose');
					/**
					 * connection Функция обработки подключения к базе
					 */
					const connection = () => resolve(idObj.clients.mongo);
					// Подключаемся к сокету: http://mongoosejs.com/docs/connections.html
					idObj.clients.mongo.connect("mongodb://" + config.host + ":" + config.port + "/" + config.db, config.options);
					// Обработчик подключения к базе данных
					idObj.clients.mongo.connection.once('open', connection);
					// Обработчик ошибки
					idObj.clients.mongo.connection.on('error', err => {
						// Выводим в консоль данные
						idObj.log(['MongoDB', err], "error");
						// Выводим сообщение об ошибке
						if(err.code === "ETIMEDOUT"){
							// Отключаемся от MongoDB
							idObj.clients.mongo.connection.close();
							// Выполняем Reject
							reject(err);
						}
					});
				// Обрабатываем возникшие ошибки
				} catch(e) {idObj.log(["что-то с параметрами MongoDB", e], "error");}
			});
		}
		/**
		 * redis Метод подключения к Redis
		 * @param  {Object} config параметры подключения к Redis
		 * @return {Promise}       объект Redis
		 */
		redis(config){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return new Promise((resolve, reject) => {
				try {
					// Подключаемся к сокету
					idObj.clients.redis = (
						// Если хост указан
						$.isset(config.host) ?
						// Подключаемся к хосту и порту
						require("redis").createClient(config.port, config.host) :
						// Подключаемся к сокету
						require("redis").createClient(config.socket)
					);
					/**
					 * selectDB Функция выбора базы данных
					 */
					const selectDB = () => idObj.clients.redis.select(config.db, () => resolve(idObj.clients.redis));
					// Если у сервера есть авторизация
					if($.isset(config.password)){
						// Выполняем авторизацию
						idObj.clients.redis.auth(config.password, selectDB);
					// Выбираем базу данных
					} else selectDB();
					// Устанавливаем событие на получение ошибки
					idObj.clients.redis.on("error", err => {
						// Выводим в консоль данные
						idObj.log(['redis', err], "error");
						// Выводим сообщение об ошибке
						if(err.code === "ETIMEDOUT"){
							// Отключаемся от Redis
							idObj.clients.redis.end(true);
							// Выполняем Reject
							reject(err);
						}
					});
				// Обрабатываем возникшие ошибки
				} catch(e) {idObj.log(["что-то с параметрами Redis", e], "error");}
			});
		}
		/**
		 * log Метод вывода логов
		 * @param {Variant} message сообщение
		 * @param {String} type     тип логов
		 */
		log(message, type){
			// Определяем тип логов
			switch(type){
				// Если это вывод ошибок
				case "error":
					if(this.debug.errors) console.error(
						"Error",
						(new Date()).toLocaleString(),
						this.name + ":",
						($.isArray(message) ? message.join(" ") : message)
					);
				break;
				// Если это информационные сообщения
				case "info": if(this.debug.message) console.info(
					"Info",
					(new Date()).toLocaleString(),
					this.name + ":",
					($.isArray(message) ? message.join(" ") : message)
				);
				break;
			}
		}
	};
	// Создаем модуль для Node.js
	module.exports = Agl;
})(anyks);