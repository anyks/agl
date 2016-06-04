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
	// Ключ кладра
	const kladr = "57500faf0a69decc7d8b4568";
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
	 * parseAnswerGeoCoder Функция обработки результата полученного с геокодера
	 * @param  {Object} obj   ответ с геокодера
	 * @param  {Object} idObj идентификатор текущего объекта
	 * @return {Object}       результат обработки
	 */
	const parseAnswerGeoCoder = (obj, idObj) => {
		// Создаем промис для обработки
		return new Promise(resolve => {
			// Данные с геокодера
			let data = {}, result = false;
			// Определяем тип геокодера
			switch(obj.status){
				// OpenStreetMaps
				case "osm":
					// Получаем данные с геокодера
					data = (
						$.isArray(obj.data) && obj.data.length ? obj.data[0] :
						($.isset(obj.data) && $.isObject(obj.data) ? obj.data : false)
					);
					// Если данные существуют
					if($.isset(data)){
						// Получаем основные данные
						let lat			= $.fnShowProps(data, "lat");
						let lng			= $.fnShowProps(data, "lon");
						let city		= $.fnShowProps(data, "city");
						let code		= $.fnShowProps(data, "country_code");
						let street		= $.fnShowProps(data, "road");
						let region		= $.fnShowProps(data, "state");
						let country		= $.fnShowProps(data, "country");
						let district	= $.fnShowProps(data, "state_district");
						let boundingbox	= $.fnShowProps(data, "boundingbox");
						let description	= $.fnShowProps(data, "display_name");
						let zip			= parseInt($.fnShowProps(data, "postcode"), 10);
						let gps			= [parseFloat(lng), parseFloat(lat)];
						let id			= idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
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
					// Получаем массив данных
					data = $.fnShowProps(obj.data, "featureMember");
					// Если данные существуют
					if($.isArray(data) && data.length){
						// Получаем данные с геокодера
						data = data[0];
						// Получаем основные данные
						let lat			= $.fnShowProps(data, "pos").split(" ")[1];
						let lng			= $.fnShowProps(data, "pos").split(" ")[0];
						let city		= $.fnShowProps(data, "LocalityName");
						let code		= $.fnShowProps(data, "CountryNameCode").toLowerCase();
						let street		= $.fnShowProps(data, "ThoroughfareName");
						let region		= $.fnShowProps(data, "AdministrativeAreaName");
						let country		= $.fnShowProps(data, "CountryName");
						let district	= $.fnShowProps(data, "SubAdministrativeAreaName");
						let description	= $.fnShowProps(data, "text");
						let lowerCorner	= $.fnShowProps(data, "lowerCorner").split(" ");
						let upperCorner = $.fnShowProps(data, "upperCorner").split(" ");
						let boundingbox = [lowerCorner[1], upperCorner[1], lowerCorner[0], upperCorner[0]];
						let gps			= [parseFloat(lng), parseFloat(lat)];
						let id			= idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
						);
						// Формируем объект
						result = {
							id, lat, lng, gps,
							boundingbox, description,
							address: {city, code, street, region, country, district}
						};
					}
				break;
				// Google
				case "google":
					// Если данные существуют
					if($.isArray(obj.data.results)
					&& obj.data.results.length){
						// Получаем данные с геокодера
						data = obj.data.results[0];
						// Координаты запроса
						let lat	= $.fnShowProps(data.geometry.location, "lat");
						let lng	= $.fnShowProps(data.geometry.location, "lng");
						let gps	= [parseFloat(lng), parseFloat(lat)];
						// Описание адреса
						let description = data.formatted_address;
						// Переменные адреса
						let zip, city, code, street, region, country, district;
						// Переходим по всему массиву с компонентами адреса
						data.address_components.forEach(obj => {
							// Ищем почтовый индекс
							if(obj.types.indexOf('postal_code') > -1) zip = parseInt(obj.long_name, 10);
							// Ищем город
							else if(obj.types.indexOf('locality') > -1) city = obj.long_name;
							// Ищем код и название страны
							else if(obj.types.indexOf('country') > -1){
								// Получаем название страны
								country	= obj.long_name;
								// Получаем код страны
								code	= obj.short_name.toLowerCase();
							// Ищем название улицы
							} else if(obj.types.indexOf('route') > -1) street = obj.long_name;
							// Ищем название региона
							else if(obj.types.indexOf('administrative_area_level_1') > -1) region = obj.long_name;
							// Ищем название района
							else if(obj.types.indexOf('administrative_area_level_2') > -1) district = obj.long_name;
						});
						// Генерируем идентификатор объекта
						let id = idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
						);
						// Формируем объект
						result = {
							id, lat, lng, gps,
							description,
							address: {zip, city, code, street, region, country, district}
						};
					}
				break;
			}
			// Выводим результат
			resolve(result);
		});
	};
	/**
	 * getGPSForAddress Функция получения gps координат для указанного адреса
	 * @param  {Array}   arr     Массив с адресами для получения данных
	 * @param  {String}  address префикс для адреса
	 * @param  {Object}  idObj   идентификатор текущего объекта
	 * @param  {Object}  schema  схема для сохранения
	 * @return {Promise}         промис ответа
	 */
	const getGPSForAddress = (arr, address, idObj, schema) => {
		// Создаем промис для обработки
		return (new Promise(resolve => {
			/**
			 * getGPS Рекурсивная функция поиска gps координат для города
			 * @param  {Array} arr массив объектов для обхода
			 * @param  {Number} i  индекс массива
			 */
			const getGPS = (arr, i = 0) => {
				// Если данные не все получены
				if(i < arr.length){
					// Выполняем запрос данных
					idObj.getAddressFromString(
						address +
						" " +
						arr[i].name +
						" " +
						arr[i].type
					).then(res => {
						// Если результат найден
						if($.isset(res)){
							// Выполняем сохранение данных
							arr[i].lat = res.lat;
							arr[i].lng = res.lng;
							arr[i].gps = res.gps;
							// Сохраняем данные
							(new schema(arr[i])).save();
						}
						// Идем дальше
						getGPS(arr, i + 1);
					});
				// Сообщаем что все сохранено удачно
				} else resolve(true);
				// Выходим
				return;
			};
			// Выполняем запрос на получение gps данных
			getGPS(arr);
		}));
	};
	/**
	 * Класс Agl с базовыми методами
	 */
	class Agl {
		/**
		 * createModels Метод создания объектов
		 * @param  {Object} idObj идентификатор текущего объекта
		 */
		static createModels(idObj){
			// Подключаем модель адреса
			const ModelAddress = require('../models/address');
			// Подключаем модель регионов
			const ModelRegions = require('../models/regions');
			// Подключаем модель метро
			const ModelMetro = require('../models/metro');
			// Создаем модель адресов
			const modelAddress = (new ModelAddress("address")).getData();
			// Создаем модель регионов
			const modelRegions = (new ModelRegions("regions")).getData();
			// Создаем модель метро
			const modelMetro = (new ModelMetro("metro")).getData();
			// Создаем схему адресов
			const Address = idObj.clients.mongo.model("Address", modelAddress);
			// Создаем схему регионов
			const Regions = idObj.clients.mongo.model("Regions", modelRegions);
			// Создаем схему метро
			const Metro = idObj.clients.mongo.model("Metro", modelMetro);
			// Сохраняем схемы
			idObj.schemes = {Address, Regions, Metro};
		}
		/**
		 * constructor Конструктор класса
		 */
		constructor(){
			// Устанавливаем объект api anyks
			this.anyks = $;
			// Устанавливаем название системы
			this.name = name;
			// Устанавливаем объект клиентов
			this.clients = {};
			// Устанавливаем тип отладки
			this.debug = debug;
			// Устанавливаем ключ кладра
			this.keyKladr = kladr;
			// Устанавливаем версию системы
			this.version = version;
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
		 * searchRegion Метод поиска региона
		 * @param  {String} str строка запроса
		 * @return {Promise}    промис результата
		 */
		searchRegion(str){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						ContentName:	str,
						ContentType:	'region',
						WithParent:		0,
						Limit:			10
					}, (err, res) => {
						// Если возникает ошибка тогда выводим её
						if($.isset(err)){
							// Выводим сообщение об ошибке
							idObj.log(["произошла ошибка поиска в базе Kladr", err], "error");
							// Выводим результат
							resolve(false);
						// Если данные пришли
						} else if($.isObject(res) && $.isArray(res.result)){
							// Выполняем поиск GPS координат для текущего адреса
							getGPSForAddress(res.result, "Россия", idObj, idObj.schemes.Regions)
							.then(result => idObj.log([
								"получение gps координат для адреса:",
								res.result.reduce((sum, val) => {
									// Формируем строку отчета
									return ($.isString(sum) ? sum : sum.name + " " + sum.typeShort + ".")
									+ ", " + val.name + " " + val.typeShort + ".";
								}),
								result
							], "info"));
							// Выводим результат
							resolve(res.result);
						}
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
			}));
		}
		/**
		 * searchDistrict Метод поиска района
		 * @param  {String} str      строка запроса
		 * @param  {String} parentId идентификатор родителя
		 * @return {Promise}         промис результата
		 */
		searchDistrict(str, parentId){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;

			}));
		}
		/**
		 * searchCity Метод поиска города
		 * @param  {String} str      строка запроса
		 * @param  {String} parentId идентификатор родителя
		 * @return {Promise}         промис результата
		 */
		searchCity(str, parentId){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;

			}));
		}
		/**
		 * searchStreet Метод поиска улицы
		 * @param  {String} str      строка запроса
		 * @param  {String} parentId идентификатор родителя
		 * @return {Promise}         промис результата
		 */
		searchStreet(str, parentId){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;

			}));
		}
		/**
		 * searchHouse Метод поиска дома
		 * @param  {String} str      строка запроса
		 * @param  {String} parentId идентификатор родителя
		 * @return {Promise}         промис результата
		 */
		searchHouse(str, parentId){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;

			}));
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
			// Создаем промис для обработки
			return (new Promise(resolve => {
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
					// Выполняем обработку результата геокодера
					parseAnswerGeoCoder(obj, idObj).then(result => {
						// Сохраняем результат в базу данных
						if(result) (new idObj.schemes.Address(result)).save();
						// Создаем индексы
						// db.address.createIndex({id: 1}, {name: "id", unique: true, dropDups: true});
						// db.address.createIndex({lat: 1, lng: 1}, {name: "gps"});
						// db.address.createIndex({"address.zip": 1}, {name: "zip"});
						// db.address.createIndex({"address.district": 1}, {name: "district"});
						// db.address.createIndex({"address.region": 1, "address.country": 1, "address.street": 1, "address.city": 1}, {name: "address"});
						// db.address.createIndex({gps: "2dsphere"}, {name: "locations"});
						// Выводим результат
						resolve(result);
					});
				};
				/**
				 * *getData Генератор для получения данных с геокодеров
				 * @return {Boolean} результат запроса из базы
				 */
				const getData = function * (){
					// Выполняем запрос с геокодера Yandex
					const yandex = yield fetch(urlsGeo[0]).then(
						res => (res.status === 200 ? res.json() : false),
						err => false
					);
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
			}));
		}
		/**
		 * getAddressFromGPS Метод получения данных адреса по строке
		 * @param  {String}   address строка запроса
		 * @return {Promise}          промис содержащий объект с адресом
		 */
		getAddressFromString(address){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
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
					// Выполняем обработку результата геокодера
					parseAnswerGeoCoder(obj, idObj).then(result => {
						// Сохраняем результат в базу данных
						if(result) (new idObj.schemes.Address(result)).save();
						// Создаем индексы
						// db.address.createIndex({id: 1}, {name: "id", unique: true, dropDups: true});
						// db.address.createIndex({lat: 1, lng: 1}, {name: "gps"});
						// db.address.createIndex({"address.zip": 1}, {name: "zip"});
						// db.address.createIndex({"address.district": 1}, {name: "district"});
						// db.address.createIndex({"address.region": 1, "address.country": 1, "address.street": 1, "address.city": 1}, {name: "address"});
						// db.address.createIndex({gps: "2dsphere"}, {name: "locations"});
						// Выводим результат
						resolve(result);
					});
				};
				/**
				 * *getData Генератор для получения данных с геокодеров
				 * @return {Boolean} результат запроса из базы
				 */
				const getData = function * (){
					// Выполняем запрос с геокодера Yandex
					const yandex = yield fetch(urlsGeo[0]).then(
						res => (res.status === 200 ? res.json() : false),
						err => false
					);
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
			}));
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
					return (new idObj.schemes.Metro(obj)).save();
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
					const connection = () => {
						// Подключаем основные модели
						Agl.createModels(idObj);
						// Выводим результат
						resolve(idObj.clients.mongo);
					}
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