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
						let _id			= idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
						);
						// Формируем объект
						result = {
							_id, lat, lng, gps,
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
						let _id			= idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
						);
						// Формируем объект
						result = {
							_id, lat, lng, gps,
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
						let _id = idObj.generateKey(
							($.isset(country) ? country.toLowerCase() : "") +
							($.isset(region) ? region.toLowerCase() : "") +
							($.isset(city) ? city.toLowerCase() : "") +
							($.isset(street) ? street.toLowerCase() : "")
						);
						// Формируем объект
						result = {
							_id, lat, lng, gps,
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
	 * @param  {Array}   arr       Массив с адресами для получения данных
	 * @param  {String}  address   префикс для адреса
	 * @param  {Object}  idObj     идентификатор текущего объекта
	 * @param  {Object}  schema    схема для сохранения
	 * @return {Promise}           промис ответа
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
							arr[i]._id		= arr[i].id;
							arr[i].lat 		= res.lat;
							arr[i].lng 		= res.lng;
							arr[i].gps 		= res.gps;
							arr[i].id		= undefined;
							// Если объект внешних ключей существует тогда добавляем их
							if($.isArray(arr[i].parents)){
								// Переходим по всему массиву данных
								arr[i].parents.forEach(val => {
									// Определяем тип контента
									switch(val.contentType){
										// Формируем внешние ключи
										case 'region':		arr[i].regionId = val.id;	break;
										case 'district':	arr[i].districtId = val.id;	break;
										case 'city':		arr[i].cityId = val.id;		break;
										case 'street':		arr[i].streetId = val.id;	break;
									}
								});
								// Удаляем родительский элемент
								arr[i].parents = undefined;
							}
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
	 * processResultKladr Функция обработки результата полученного с базы данных Кладр
	 * @param  {Object}   err      объект с ошибкой
	 * @param  {Object}   res      объект с результатом
	 * @param  {Object}   schema   объект схемы базы данных
	 * @param  {Object}   idObj    идентификатор текущего объекта
	 * @param  {Function} callback функция обратного вызова
	 */
	const processResultKladr = (err, res, schema, idObj, callback) => {
		// Если возникает ошибка тогда выводим её
		if($.isset(err) && !$.isset(res)){
			// Выводим сообщение об ошибке
			idObj.log(["произошла ошибка поиска в базе Kladr", err], "error");
			// Выводим результат
			callback(false);
		// Если данные пришли
		} else if($.isObject(res) && $.isArray(res.result)){
			// Формируем первоначальную строку адреса
			let address = "Россия" + ", "
			+ ($.isArray(res.result[0].parents) ? (res.result[0].parents.length > 1 ?
			res.result[0].parents.reduce((sum, val) => {
				// Формируем строку отчета
				return ($.isString(sum) ? sum : sum.name + " " + sum.type)
				+ ", " + val.name + " " + val.type;
			}) : res.result[0].parents[0].name + " " + res.result[0].parents[0].type) + "," : "");
			// Выполняем поиск GPS координат для текущего адреса
			getGPSForAddress(res.result, address, idObj, schema)
			.then(result => idObj.log([
				"получение gps координат для адреса:",
				(res.result.length > 1 ? res.result.reduce((sum, val) => {
					// Формируем строку отчета
					return ($.isString(sum) ? sum : sum.name + " " + sum.typeShort + ".")
					+ ", " + val.name + " " + val.typeShort + ".";
				}) : res.result[0].name + " " + res.result[0].typeShort + "."),
				(result ? "Ok" : "Not ok")
			], "info"));
			// Выводим результат
			callback(res.result);
		}
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
			// Подключаем модель района
			const ModelDistricts = require('../models/districts');
			// Подключаем модель городов
			const ModelCities = require('../models/cities');
			// Подключаем модель улиц
			const ModelStreets = require('../models/streets');
			// Подключаем модель домов
			const ModelHouses = require('../models/houses');
			// Подключаем модель метро
			const ModelMetro = require('../models/metro');
			// Подключаем модель метро с городами
			const ModelMetro_cities = require('../models/metro_cities');
			// Подключаем модель метро с линиями
			const ModelMetro_lines = require('../models/metro_lines');
			// Подключаем модель метро с станциями
			const ModelMetro_stations = require('../models/metro_stations');
			// Создаем модель адресов
			const modelAddress = (new ModelAddress("address")).getData();
			// Создаем модель регионов
			const modelRegions = (new ModelRegions("regions")).getData();
			// Создаем модель районов
			const modelDistricts = (new ModelDistricts("districts")).getData();
			// Создаем модель городов
			const modelCities = (new ModelCities("cities")).getData();
			// Создаем модель улиц
			const modelStreets = (new ModelStreets("streets")).getData();
			// Подключаем модель домов
			const modelHouses = (new ModelHouses("houses")).getData();
			// Создаем модель метро
			const modelMetro = (new ModelMetro("metro")).getData();
			// Создаем модель метро с городами
			const modelMetro_cities = (new ModelMetro_cities("metro_cities")).getData();
			// Создаем модель метро с линиями
			const modelMetro_lines = (new ModelMetro_lines("metro_lines")).getData();
			// Создаем модель метро с станциями
			const modelMetro_stations = (new ModelMetro_stations("metro_stations")).getData();
			// Создаем схему адресов
			const Address = idObj.clients.mongo.model("Address", modelAddress);
			// Создаем схему регионов
			const Regions = idObj.clients.mongo.model("Regions", modelRegions);
			// Создаем схему районов
			const Districts = idObj.clients.mongo.model("Districts", modelDistricts);
			// Создаем схему городов
			const Cities = idObj.clients.mongo.model("Cities", modelCities);
			// Создаем схему улиц
			const Streets = idObj.clients.mongo.model("Streets", modelStreets);
			// Создаем схему домов
			const Houses = idObj.clients.mongo.model("Houses", modelHouses);
			// Создаем схему метро
			const Metro = idObj.clients.mongo.model("Metro", modelMetro);
			// Создаем схему метро с городами
			const Metro_cities = idObj.clients.mongo.model("Metro_cities", modelMetro_cities);
			// Создаем схему метро с линиями
			const Metro_lines = idObj.clients.mongo.model("Metro_lines", modelMetro_lines);
			// Создаем схему метро с станциями
			const Metro_stations = idObj.clients.mongo.model("Metro_stations", modelMetro_stations);
			// Сохраняем схемы
			idObj.schemes = {
				Address,
				Regions,
				Districts,
				Cities,
				Streets,
				Houses,
				Metro,
				Metro_cities,
				Metro_lines,
				Metro_stations
			};
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
		 * @param  {String} str   строка запроса
		 * @param  {Number} limit количество результатов к выдаче
		 * @return {Promise}      промис результата
		 */
		searchRegion(str, limit = 10){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Создаем переменные
					const ContentName	= str;
					const ContentType	= 'region';
					const WithParent	= 0;
					const Limit			= limit;
					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						Limit,
						WithParent,
						ContentName,
						ContentType
					}, (err, res) => {
						// Выполняем обработку данных
						processResultKladr(err, res, idObj.schemes.Regions, idObj, resolve);
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
			}));
		}
		/**
		 * searchDistrict Метод поиска района
		 * @param  {String} str      строка запроса
		 * @param  {String} regionId идентификатор региона
		 * @param  {Number} limit    количество результатов к выдаче
		 * @return {Promise}         промис результата
		 */
		searchDistrict(str, regionId, limit = 10){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Создаем переменные
					const ContentName	= str;
					const ContentType	= 'district';
					const ParentType	= ($.isset(regionId) ? 'region' : undefined);
					const ParentId		= regionId;
					const WithParent	= 1;
					const Limit			= limit;
					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						Limit,
						ParentId,
						ParentType,
						WithParent,
						ContentName,
						ContentType
					}, (err, res) => {
						// Выполняем обработку данных
						processResultKladr(err, res, idObj.schemes.Districts, idObj, resolve);
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
			}));
		}
		/**
		 * searchCity Метод поиска города
		 * @param  {String} str        строка запроса
		 * @param  {String} regionId   идентификатор региона
		 * @param  {String} districtId идентификатор района
		 * @param  {Number} limit      количество результатов к выдаче
		 * @return {Promise}           промис результата
		 */
		searchCity(str, regionId, districtId = null, limit = 10){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Создаем переменные
					const ContentName	= str;
					const ContentType	= 'city';
					const ParentType = (
						$.isset(districtId) || $.isset(regionId) ?
						($.isset(districtId) ? 'district' : 'region') : undefined
					);
					const ParentId = (
						$.isset(districtId) || $.isset(regionId) ?
						($.isset(districtId) ? districtId : regionId) : undefined
					);
					const WithParent	= 1;
					const Limit			= limit;

					console.log("------", {Limit,
						ParentId,
						ParentType,
						WithParent,
						ContentType,
						ContentName
					});

					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						Limit,
						ParentId,
						ParentType,
						WithParent,
						ContentType,
						ContentName
					}, (err, res) => {
						// Выполняем обработку данных
						processResultKladr(err, res, idObj.schemes.Cities, idObj, resolve);
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
			}));
		}
		/**
		 * searchStreet Метод поиска улицы
		 * @param  {String} str    строка запроса
		 * @param  {String} cityId идентификатор города
		 * @param  {Number} limit  количество результатов к выдаче
		 * @return {Promise}       промис результата
		 */
		searchStreet(str, cityId, limit = 10){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Создаем переменные
					const ContentName	= str;
					const ContentType	= 'street';
					const ParentType	= 'city';
					const ParentId		= cityId;
					const WithParent	= 1;
					const Limit			= limit;
					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						Limit,
						ParentId,
						ParentType,
						WithParent,
						ContentName,
						ContentType
					}, (err, res) => {
						// Выполняем обработку данных
						processResultKladr(err, res, idObj.schemes.Streets, idObj, resolve);
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
			}));
		}
		/**
		 * searchHouse Метод поиска дома
		 * @param  {String} str      строка запроса
		 * @param  {String} streetId идентификатор улицы
		 * @param  {Number} limit    количество результатов к выдаче
		 * @return {Promise}         промис результата
		 */
		searchHouse(str, streetId, limit = 10){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					// Подключаем модуль кладра
					const kladr = require("kladrapi").ApiQuery;
					// Создаем переменные
					const ContentName	= str;
					const ContentType	= 'building';
					const ParentType	= 'street';
					const ParentId		= streetId;
					const WithParent	= 1;
					const Limit			= limit;
					// Выполняем поиск в кладре
					kladr(idObj.keyKladr, 'foontick', {
						Limit,
						ParentId,
						ParentType,
						WithParent,
						ContentName,
						ContentType
					}, (err, res) => {
						// Выполняем обработку данных
						processResultKladr(err, res, idObj.schemes.Houses, idObj, resolve);
					});
				// Обрабатываем возникшую ошибку
				} catch(e) {idObj.log(["что-то с параметрами Kladr", e], "error");}
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
		 * updateRegions Метод обновления данных базы регионов
		 */
		updateRegions(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Массив букв для названий регионов
				const regionsChar = [
					"А", "Б", "В", "Г", "Д", "E", "Ж",
					"З", "И", "К", "Л", "М", "Н", "О",
					"П", "Р", "С", "Т", "У", "Ф", "Х",
					"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
				];
				// Подключаемся к коллекции регионов
				const regions = idObj.clients.mongo.connection.db.collection("regions");
				// Удаляем колекцию регионов
				regions.drop();
				/**
				 * getRegion Рекурсивная функция загрузки региона
				 * @param  {Number} i текущий индекс массива
				 */
				const getRegion = (i = 0) => {
					// Если данные не все загружены то загружаем дальше
					if(i < regionsChar.length){
						// Выполняем загрузку данных
						idObj.searchRegion(regionsChar[i], 100).then(result => {
							// Если это массив
							if($.isArray(result)){
								// Переходим по всему массиву
								const str = (result.length > 1 ? result.reduce((sum, val) => {
									// Формируем строку отчета
									return ($.isString(sum) ? sum : sum.name + " " + sum.type)
									+ ", " + val.name + " " + val.type;
								}) : result[0].name + " " + result[0].type);
								// Выводим данные в консоль
								idObj.log(["регион(ы) загружен(ы) [", regionsChar[i], "]:", str], "info");
							}
							// Продолжаем загрузку дальше
							getRegion(i + 1);
						});
					// Если все данные загружены тогда создаем индексы
					} else {
						// Создаем индексы регионов
						regions.createIndex({name: 1}, {name: "region"});
						regions.createIndex({okato: 1}, {name: "okato"});
						regions.createIndex({type: 1}, {name: "type"});
						regions.createIndex({typeShort: 1}, {name: "typeShort"});
						regions.createIndex({lat: 1, lng: 1}, {name: "gps"});
						regions.createIndex({gps: "2dsphere"}, {name: "locations"});
						// Сообщаем что все удачно выполнено
						resolve(true);
					}
				};
				// Выполняем загрузку регионов
				getRegion();
			}));
		}
		/**
		 * updateDistricts Метод обновления данных районов
		 */
		updateDistricts(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Массив букв для названий районов
				const districsChar = [
					"А", "Б", "В", "Г", "Д", "E", "Ж",
					"З", "И", "К", "Л", "М", "Н", "О",
					"П", "Р", "С", "Т", "У", "Ф", "Х",
					"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
				];
				// Подключаемся к коллекции районов
				const districts = idObj.clients.mongo.connection.db.collection("districts");
				// Удаляем колекцию районов
				districts.drop();
				// Запрашиваем все данные регионов
				idObj.schemes.Regions.find({})
				// Запрашиваем данные регионов
				.exec((err, data) => {
					// Если ошибки нет
					if(!$.isset(err) && $.isArray(data)){
						/**
						 * getRegion Рекурсивная функция загрузки региона
						 * @param  {Number} i текущий индекс массива
						 */
						const getRegion = (i = 0) => {
							// Если регионы загружены не все тогда выполняем загрузку
							if(i < data.length){
								/**
								 * getDistrict Рекурсивная функция загрузки районов
								 * @param  {Number} j текущий индекс массива
								 */
								const getDistrict = (j = 0) => {
									// Если данные не все загружены то загружаем дальше
									if(j < districsChar.length){
										// Выполняем поиск района
										idObj.searchDistrict(districsChar[j], data[i]._id, 100).then(result => {
											// Если это массив
											if($.isArray(result)){
												// Переходим по всему массиву
												const str = (result.length > 1 ? result.reduce((sum, val) => {
													// Формируем строку отчета
													return ($.isString(sum) ? sum : sum.name + " " + sum.type)
													+ ", " + val.name + " " + val.type;
												}) : result[0].name + " " + result[0].type);
												// Выводим данные в консоль
												idObj.log(["район(ы) загружен(ы) [", districsChar[j], "]:", str], "info");
											}
											// Продолжаем загрузку дальше
											getDistrict(j + 1);
										});
									// Если все данные загружены, переходим к следующему району
									} else getRegion(i + 1);
								};
								// Выполняем запрос данных районов
								getDistrict();
							// Сообщаем что все регионы загружены
							} else {
								// Создаем индексы районов
								districts.createIndex({name: 1}, {name: "district"});
								districts.createIndex({regionId: 1}, {name: "region"});
								districts.createIndex({okato: 1}, {name: "okato"});
								districts.createIndex({zip: 1}, {name: "zip"});
								districts.createIndex({type: 1}, {name: "type"});
								districts.createIndex({typeShort: 1}, {name: "typeShort"});
								districts.createIndex({lat: 1, lng: 1}, {name: "gps"});
								districts.createIndex({gps: "2dsphere"}, {name: "locations"});
								// Сообщаем что все удачно выполнено
								resolve(true);
							}
						};
						// Извлекаем данные регионов
						getRegion();
					// Выводим сообщение в консоль
					} else idObj.log(["ошибка загрузки данных регионов", err], "error");
				});
			}));
		}
		/**
		 * updateCities Метод обновления данных городов
		 */
		updateCities(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Массив букв для названий городов
				const citiesChar = [
					"А", "Б", "В", "Г", "Д", "E", "Ж",
					"З", "И", "К", "Л", "М", "Н", "О",
					"П", "Р", "С", "Т", "У", "Ф", "Х",
					"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
				];
				// Подключаемся к коллекции городов
				const cities = idObj.clients.mongo.connection.db.collection("cities");
				// Удаляем колекцию городов
				cities.drop();
				// Запрашиваем все данные регионов
				idObj.schemes.Regions.find({})
				// Запрашиваем данные регионов
				.exec((err, data) => {
					// Если ошибки нет
					if(!$.isset(err) && $.isArray(data)){
						/**
						 * getRegions Рекурсивная функция загрузки региона
						 * @param  {Number} i текущий индекс массива
						 */
						const getRegions = (i = 0) => {
							// Если районы загружены не все тогда выполняем загрузку
							if(i < data.length){
								/**
								 * getCity Рекурсивная функция загрузки городов
								 * @param  {Number} j текущий индекс массива
								 */
								const getCity = (j = 0) => {
									// Если данные не все загружены то загружаем дальше
									if(j < citiesChar.length){
										// Выполняем поиск городов
										idObj.searchCity(citiesChar[j], data[i]._id, null, 100).then(result => {
											// Если это массив
											if($.isArray(result)){
												// Переходим по всему массиву
												const str = (result.length > 1 ? result.reduce((sum, val) => {
													// Формируем строку отчета
													return ($.isString(sum) ? sum : sum.name + " " + sum.type)
													+ ", " + val.name + " " + val.type;
												}) : result[0].name + " " + result[0].type);
												// Выводим данные в консоль
												idObj.log(["город(а) загружен(ы) [", citiesChar[j], "]:", str], "info");
											}
											// Продолжаем загрузку дальше
											getCity(j + 1);
										});
									// Если все данные загружены, переходим к следующему региону
									} else getRegions(i + 1);
								};
								// Выполняем запрос данных городов
								getCity();
							// Сообщаем что все города загружены
							} else {
								// Создаем индексы городов
								cities.createIndex({name: 1}, {name: "city"});
								cities.createIndex({regionId: 1}, {name: "region"});
								cities.createIndex({districtId: 1}, {name: "district"});
								cities.createIndex({okato: 1}, {name: "okato"});
								cities.createIndex({zip: 1}, {name: "zip"});
								cities.createIndex({type: 1}, {name: "type"});
								cities.createIndex({typeShort: 1}, {name: "typeShort"});
								cities.createIndex({lat: 1, lng: 1}, {name: "gps"});
								cities.createIndex({gps: "2dsphere"}, {name: "locations"});
								// Сообщаем что все удачно выполнено
								resolve(true);
							}
						};
						// Извлекаем данные регионов
						getRegions();
					// Выводим сообщение в консоль
					} else idObj.log(["ошибка загрузки данных регионов", err], "error");
				});
			}));
		}

		test(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Выполняем поиск городов
			idObj.searchCity("М", "7700000000000", null, 100).then(result => {
				console.log("++++++++++", result);
			});
		}

		/**
		 * updateMetro Метод обновления данных базы метро
		 */
		updateMetro(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Подключаем модуль закачки данных
				const fetch = require('node-fetch');
				/**
				 * getData Функция обработки полученных данных с интернета
				 * @param  {Array} arr объект данными метро
				 */
				const getData = arr => {
					// Подключаемся к коллекции метро
					const metro = idObj.clients.mongo.connection.db.collection("metro");
					// Подключаемся к коллекции метро городов
					const metro_cities = idObj.clients.mongo.connection.db.collection("metro_cities");
					// Подключаемся к коллекции метро линий
					const metro_lines = idObj.clients.mongo.connection.db.collection("metro_lines");
					// Подключаемся к коллекции метро станций
					const metro_stations = idObj.clients.mongo.connection.db.collection("metro_stations");
					// Удаляем все коллекции метро
					metro.drop();
					metro_cities.drop();
					metro_lines.drop();
					metro_stations.drop();
					// Переходим по всему массиву данных
					arr.forEach(obj => {
						// Копируем идентификатор метро
						obj._id = obj.id;
						// Формируем нужного вида для нас массив
						obj.lines.forEach(line => {
							// Переходим по всем станциям метро
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
						(new idObj.schemes.Metro(obj)).save();
					});
					/**
					 * getCities Рекурсивная функция запроса городов
					 * @param  {Number} i текущий индекс массива
					 */
					const getCities = (i = 0) => {
						// Если города не все загружены
						if(i < arr.length){
							// Запрашиваем все данные городов
							idObj.schemes.Cities.findOne({name: arr[i].name})
							// Запрашиваем данные регионов
							.exec((err, data) => {
								// Если ошибки нет
								if(!$.isset(err) && $.isset(data) && $.isObject(data)){
									// Изменяем идентификатор записи
									arr[i]._id		= data._id;
									arr[i].linesIds	= [];
									// Формируем идентификаторы линий
									arr[i].lines.forEach(line => {
										// Формируем линию метро
										line._id			= idObj.generateKey(line.id + arr[i]._id + line.name);
										line.cityId			= arr[i]._id;
										line.color			= line.hex_color;
										line.stationsIds	= [];
										// Формируем массив линий для города
										arr[i].linesIds.push(line._id);
										// Переходим по всем станциям метро
										line.stations.forEach(station => {
											// Формируем станцию метро
											station._id		= idObj.generateKey(station.id + line.id + arr[i]._id + station.name);
											station.cityId	= arr[i]._id;
											station.lineId	= line._id;
											// Формируемновый ключ gps;
											station.gps = [station.lng, station.lat];
											// Формируем массив станций для линии
											line.stationsIds.push(station._id);
											// Сохраняем станцию метро
											(new idObj.schemes.Metro_stations(station)).save();
										});
										// Сохраняем линию метро
										(new idObj.schemes.Metro_lines(line)).save();
									});
									// Сохраняем город метро
									(new idObj.schemes.Metro_cities(arr[i])).save();
								// Выводим сообщение в консоль
								} else idObj.log(["ошибка загрузки данных городов", err], "error");
								// Продолжаем дальше
								getCities(i + 1);
							});
						// Если все города загружены
						} else {
							// Создаем индексы метро
							metro.createIndex({name: 1}, {name: "city"});
							metro.createIndex({"lines.hex_color": 1}, {name: "color"});
							metro.createIndex({"lines.name": 1}, {name: "lines"});
							metro.createIndex({"lines.stations.name": 1}, {name: "stations"});
							metro.createIndex({"lines.stations.order": 1}, {name: "order"});
							metro.createIndex({"lines.stations.lat": 1, "lines.stations.lng": 1}, {name: "gps"});
							metro.createIndex({"lines.stations.gps": "2dsphere"}, {name: "locations"});
							// Создаем индексы для метро городов
							metro_cities.createIndex({name: 1}, {name: "city"});
							metro_cities.createIndex({linesIds: 1}, {name: "lines"});
							// Создаем индексы для метро линий
							metro_lines.createIndex({name: 1}, {name: "line"});
							metro_lines.createIndex({cityId: 1}, {name: "city"});
							metro_lines.createIndex({color: 1}, {name: "color"});
							metro_lines.createIndex({stationsIds: 1}, {name: "stations"});
							// Создаем индексы для метро станций
							metro_stations.createIndex({name: 1}, {name: "station"});
							metro_stations.createIndex({cityId: 1}, {name: "city"});
							metro_stations.createIndex({lineId: 1}, {name: "line"});
							metro_stations.createIndex({order: 1}, {name: "order"});
							metro_stations.createIndex({lat: 1, lng: 1}, {name: "gps"});
							metro_stations.createIndex({gps: "2dsphere"}, {name: "locations"});
							// Сообщаем что все удачно выполнено
							resolve(true);
						}
					};
					// Выполняем запрос данных городов
					getCities();
				};
				// Закачиваем данные метро
				fetch('https://api.hh.ru/metro')
				// Преобразуем полученный объект
				.then(res => res.json(), e => idObj.log(["get metro", e], "error"))
				// Обрабатываем полученные данные
				.then(getData, e => idObj.log(["parse metro", e], "error"));
			}));
		}
		/**
		 * initEmptyDatabases Метод инициализации чистой базы данных
		 */
		initEmptyDatabases(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				try {
					/**
					 * *updateDB Генератор для получения обновления данных
					 * @return {Boolean} результат запроса из базы
					 */
					const updateDB = function * (){
						// Выполняем обновление базы данных регионов
						const regions = yield idObj.updateRegions();
						// Выполняем обновление базы районов
						const districts = (regions ? yield idObj.updateDistricts() : false);
						// Выполняем обновление базы городов
						const cities = (districts ? yield idObj.updateCities() : false);
						// Выполняем обновление базы метро
						const metro = (cities ? yield idObj.updateMetro() : false);
						// Если метро загружено
						if(metro){
							// Подключаемся к коллекции address
							const address = idObj.clients.mongo.connection.db.collection("address");
							// Подключаемся к коллекции streets
							const streets = idObj.clients.mongo.connection.db.collection("streets");
							// Подключаемся к коллекции streets
							const houses = idObj.clients.mongo.connection.db.collection("houses");
							// Удаляем все колекции
							address.drop();
							streets.drop();
							houses.drop();
							// Создаем индексы для базы адресов
							// address.createIndex({id: 1}, {name: "id", unique: true, dropDups: true});
							address.createIndex({lat: 1, lng: 1}, {name: "gps"});
							address.createIndex({"address.zip": 1}, {name: "zip"});
							address.createIndex({"address.district": 1}, {name: "district"});
							address.createIndex({"address.region": 1, "address.country": 1, "address.street": 1, "address.city": 1}, {name: "address"});
							address.createIndex({gps: "2dsphere"}, {name: "locations"});
							// Создаем индексы для улиц
							streets.createIndex({name: 1}, {name: "street"});
							streets.createIndex({regionId: 1}, {name: "region"});
							streets.createIndex({districtId: 1}, {name: "district"});
							streets.createIndex({cityId: 1}, {name: "city"});
							streets.createIndex({okato: 1}, {name: "okato"});
							streets.createIndex({zip: 1}, {name: "zip"});
							streets.createIndex({type: 1}, {name: "type"});
							streets.createIndex({typeShort: 1}, {name: "typeShort"});
							streets.createIndex({lat: 1, lng: 1}, {name: "gps"});
							streets.createIndex({gps: "2dsphere"}, {name: "locations"});
							// Создаем индексы для домов
							houses.createIndex({name: 1}, {name: "house"});
							houses.createIndex({regionId: 1}, {name: "region"});
							houses.createIndex({districtId: 1}, {name: "district"});
							houses.createIndex({streetId: 1}, {name: "street"});
							houses.createIndex({cityId: 1}, {name: "city"});
							houses.createIndex({okato: 1}, {name: "okato"});
							houses.createIndex({zip: 1}, {name: "zip"});
							houses.createIndex({type: 1}, {name: "type"});
							houses.createIndex({typeShort: 1}, {name: "typeShort"});
							houses.createIndex({lat: 1, lng: 1}, {name: "gps"});
							houses.createIndex({gps: "2dsphere"}, {name: "locations"});
							// Сообщаем что работа завершена
							resolve(true);
						} else {
							// Выводим сообщение в консоль
							idObj.log([
								"база данных создана не полностью:",
								"регионы =", regions,
								"районы =", districts,
								"города =", cities,
								"метро =", metro
							], "error");
							// Сообщаем что работа завершена
							resolve(false);
						}
					};
					// Запускаем коннект
					exec(updateDB());
				} catch(e) {
					// Выводим сообщение в консоль
					idObj.log(["что-то с инициализацией базы данных", e], "error");
					// Сообщаем что работа завершена
					resolve(false);
				}
			}));
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
					idObj.clients.mongo.connect(
						"mongodb://" +
						config.host +
						":" +
						config.port +
						"/" + config.db,
						config.options
					);
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
					const selectDB = () => idObj.clients.redis
					.select(config.db, () => resolve(idObj.clients.redis));
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
				case "error": if(this.debug.errors) console.error(
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