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
	// Подключаем модуль файловой системы
	const fs = require('fs');
	/**
	 * fileExists Функция проверки на существование файла
	 * @param  {String} path адрес файла
	 * @return {Boolean}     результат проверки на существование файла
	 */
	const fileExists = path => {
		try {
			// Выводим сообщение что файл существует
			return fs.statSync(path).isFile();
		// Если возникает ошибка то обрабатываем ее
		} catch(e) {
			// Обрабатываем ошибку
			if(e.code === "ENOENT"){
				// Выводим в консоль сообщение что файл не найден
				console.error("File does not exist.");
				// Сообщаем что файл не найден
				return false;
			}
			// Выводим в консоль сообщение об ошибке
			console.error("Exception fs.statSync (", path, "): ", e);
			// Генерируем ошибку
			throw e;
		}
	};
	// Адрес конфигурационного файла
	const configFile = process.argv[1].replace(/\/\w+\.\w+$/i, "") + "/../config/config.json";
	// Считываем файл конфигурации
	const config = (fileExists(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : false);
	// Если конфигурационный файл не найден тогда выходим
	if(!config){
		// Сообщаем что конфигурационный файл не найден
		console.error("Конфигурационный файл не найден");
		// Выходим из приложения
		process.exit(1);
	}
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
						let gps			= [parseFloat(lat), parseFloat(lng)];
						let _id			= idObj.generateKey(description);
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
						let gps			= [parseFloat(lat), parseFloat(lng)];
						let _id			= idObj.generateKey(description);
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
						let gps	= [parseFloat(lat), parseFloat(lng)];
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
								country = obj.long_name;
								// Получаем код страны
								code = obj.short_name.toLowerCase();
							// Ищем название улицы
							} else if(obj.types.indexOf('route') > -1) street = obj.long_name;
							// Ищем название региона
							else if(obj.types.indexOf('administrative_area_level_1') > -1) region = obj.long_name;
							// Ищем название района
							else if(obj.types.indexOf('administrative_area_level_2') > -1) district = obj.long_name;
						});
						// Генерируем идентификатор объекта
						let _id = idObj.generateKey(description);
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
	 * searchAddressInCache Функция поиска данных в кеше
	 * @param  {String} str        строка запроса
	 * @param  {String} type       тип запроса
	 * @param  {String} parentId   идентификатор родительский
	 * @param  {String} parentType тип родителя
	 * @param  {Number} limit      лимит результатов для выдачи
	 * @param  {Object} idObj      идентификатор текущего объекта
	 * @return {Promise}           промис содержащий результат
	 */
	const searchAddressInCache = (str, type, parentId, parentType, limit = 1, idObj) => {
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Ключ запроса
			const key = "address:subjects:" + type;
			// Считываем данные из кеша
			Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
				// Если данные не найдены, сообщаем что в кеше ничего не найдено
				if(!$.isset(cache)) resolve(false);
				// Если данные пришли
				else {
					// Создаем ключ названия
					const char = str[0].toLowerCase();
					// Выполняем парсинг ответа
					cache = JSON.parse(cache);
					// Если такая буква не существует тогда выходим
					if(!$.isset(cache[char])) resolve(false);
					// Если данные существуют продолжаем дальше
					else {
						// Индекс итераций
						let i = 0;
						// Результат ответа
						let result = [];
						// Создаем регулярное выражение для поиска
						let reg = new RegExp("^" + str, "i");
						// Переходим по всем ключам
						for(let val in cache[char]){
							// Если станции метро не найдены то удаляем ключ
							if($.isset(cache[char][val].metro)
							&& !cache[char][val].metro.length)
								// Удаляем ненужные ключи станций метро
								delete cache[char][val].metro;
							// Если родительский элемент передан
							if($.isset(parentId) && $.isset(parentType)){
								// Если родительский элемент найден
								if(((cache[char][val][parentType + "Id"] === parentId)
								|| (val === parentId)) && reg.test(cache[char][val].name)){
									// Запоминаем результат
									result.push(cache[char][val]);
									// Увеличиваем значение индекса
									if(i < (limit - 1)) i++;
									// Выходим
									else break;
								}
							// Если родительский элемент не существует тогда просто ищем по названию
							} else if(reg.test(cache[char][val].name)){
								// Запоминаем результат
								result.push(cache[char][val]);
								// Увеличиваем значение индекса
								if(i < (limit - 1)) i++;
								// Выходим
								else break;
							}
						}
						// Выводим результат
						resolve(result.length < 1 ? false : result);
					}
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log(["getRedis in searchAddressInCache", err], "error");
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getGPSForAddress Функция получения gps координат для указанного адреса
	 * @param  {Array}   arr       Массив с адресами для получения данных
	 * @param  {String}  address   префикс для адреса
	 * @param  {Object}  idObj     идентификатор текущего объекта
	 * @param  {Object}  scheme    схема для сохранения
	 * @return {Promise}           промис ответа
	 */
	const getGPSForAddress = (arr, address, idObj, scheme) => {
		// Создаем промис для обработки
		return (new Promise(resolve => {
			/**
			 * getCache Функция извлечения данных кеша
			 * @param  {Object} obj объект данных для запроса из кеша
			 * @return {Promise}    промис содержащий объект из кеша
			 */
			const getCache = obj => {
				// Создаем промис для обработки
				return (new Promise(resolve => {
					// Ключ запроса
					const key = "address:subjects:" + obj.contentType;
					// Считываем данные из кеша
					Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
						// Создаем ключ названия
						const char = obj.name[0].toLowerCase();
						// Если данные не найдены
						if(!$.isset(cache)) cache = {};
						// Выполняем парсинг ответа
						else cache = JSON.parse(cache);
						// Если идентификатор на такую букву не существует то создаем его
						if(!$.isset(cache[char])) cache[char] = {};
						// Если идентификатор объекта не существует то создаем его
						if(!$.isset(cache[char][obj._id])) cache[char][obj._id] = {};
						// Выводим результат
						resolve({id: obj._id, char: char, key: key, src: cache});
					// Если происходит ошибка тогда выходим
					}).catch(err => {
						// Выводим ошибку метода
						idObj.log(["getRedis in getGPSForAddress", err], "error");
						// Выходим
						resolve(false);
					});
				}));
			};
			/**
			 * updateDB Функция обновления данных в базе
			 * @param  {Object} obj      объект для обновления данных
			 * @param  {Object} callback функция обратного вызова
			 */
			const updateDB = (obj, callback) => {
				// Запрашиваем все данные из базы
				scheme.findOne({_id: obj._id})
				// Выполняем запрос
				.exec((err, data) => {
					/**
					 * saveCache Функция сохранения данных в кеше
					 */
					const saveCache = () => {
						// Получаем данные из кеша
						getCache(obj).then(cache => {
							// Сохраняем данные в кеше
							cache.src[cache.char][cache.id] = Object.assign({}, obj);
							// Сохраняем данные в кеше
							Agl.setRedis(idObj, "set", cache.key, cache.src)
							// Если все удачно то выходим
							.then(callback)
							// Если нет то тоже выходим
							.catch(callback);
						// Если происходит ошибка тогда выходим
						}).catch(callback);
					};
					// Если ошибки нет
					if(!$.isset(err) && $.isset(data) && $.isObject(data)){
						// Если метро не найдено
						if(!$.isset(obj.metro)) obj.metro = data.metro;
						// Если временная зона была не найдена
						if(!$.isset(obj.timezone)) obj.timezone = data.timezone;
						// Выполняем обновление
						scheme.update({_id: obj._id}, obj, {upsert: true}, saveCache);
					// Просто добавляем новый объект
					} else (new scheme(obj)).save(saveCache);
				});
			};
			/**
			 * getGPS Рекурсивная функция поиска gps координат для города
			 * @param  {Array} arr массив объектов для обхода
			 * @param  {Number} i  индекс массива
			 */
			const getGPS = (arr, i = 0) => {
				// Если данные не все получены
				if(i < arr.length){
					// Изменяем идентификатор данных
					arr[i]._id = arr[i].id;
					// Удаляем основной идентификатор
					arr[i].id = undefined;
					// Получаем данные из кеша
					getCache(arr[i]).then(cache => {
						// Если в объекте не найдена временная зона или gps координаты или станции метро
						if(!cache || (!$.isArray(cache.src[cache.char][cache.id].gps)
						|| !$.isArray(cache.src[cache.char][cache.id].metro)
						|| !$.isset(cache.src[cache.char][cache.id].timezone))){
							// Выполняем запрос данных
							idObj.getAddressFromString({
								"address": address + " " +
								arr[i].name + " " +
								arr[i].type
							}).then(res => {
								// Если результат найден
								if($.isset(res)){
									// Выполняем сохранение данных
									arr[i].lat	= res.lat;
									arr[i].lng	= res.lng;
									arr[i].gps	= res.gps;
									arr[i].code	= res.address.code;
									// Выполняем поиск временную зону
									idObj.getTimezone({lat: arr[i].lat, lng: arr[i].lng}).then(timezone => {
										// Если временная зона найдена
										if(timezone) arr[i].timezone = timezone;
										// Если объект внешних ключей существует тогда добавляем их
										if($.isArray(arr[i].parents)){
											// Переходим по всему массиву данных
											arr[i].parents.forEach(val => {
												// Определяем тип контента
												switch(val.contentType){
													// Формируем внешние ключи
													case 'region':		arr[i].regionId		= val.id;	break;
													case 'district':	arr[i].districtId	= val.id;	break;
													case 'city':		arr[i].cityId		= val.id;	break;
													case 'street':		arr[i].streetId		= val.id;	break;
												}
											});
											// Удаляем родительские объекты
											arr[i].parents = undefined;
										}
										// Если это улица или дом то ищем ближайшие станции метро
										if((arr[i].contentType === 'city')
										|| (arr[i].contentType === 'street')
										|| (arr[i].contentType === 'building')){
											// Параметры запроса
											const query = {
												lat:		parseFloat(arr[i].lat),
												lng:		parseFloat(arr[i].lng),
												distance:	(arr[i].typeShort === "г" ? 150000 : 3000)
											};
											// Выполняем поиск ближайших станций метро
											idObj.searchMetroFromGPS(query).then(metro => {
												// Если метро передано
												if($.isArray(metro) && metro.length){
													// Создаем пустой массив с метро
													arr[i].metro = [];
													// Переходим по всему массиву данных
													metro.forEach(val => arr[i].metro.push(val._id));
												}
												// Сохраняем данные
												updateDB(arr[i], () => getGPS(arr, i + 1));
											// Если происходит ошибка тогда выходим
											}).catch(err => {
												// Выводим ошибку метода
												idObj.log(["searchMetroFromGPS in getGPSForAddress", err], "error");
												// Сохраняем данные и выходим
												updateDB(arr[i], () => getGPS(arr, i + 1));
											});
										// Сохраняем данные
										} else updateDB(arr[i], () => getGPS(arr, i + 1));
									// Если происходит ошибка тогда выходим
									}).catch(err => {
										// Выводим ошибку метода
										idObj.log(["getAddressFromString in getGPSForAddress", err], "error");
										// Выходим
										getGPS(arr, i + 1);
									});
								// Идем дальше
								} else getGPS(arr, i + 1);
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log(["getRedis in getGPSForAddress", err], "error");
								// Выходим
								getGPS(arr, i + 1);
							});
						// Идем дальше
						} else getGPS(arr, i + 1);
					// Если происходит ошибка тогда выходим
					}).catch(err => {
						// Выводим ошибку метода
						idObj.log(["getCache in getGPSForAddress", err], "error");
						// Выходим
						resolve(arr);
					});
				// Сообщаем что все сохранено удачно
				} else resolve(arr);
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
	 * @param  {Object}   scheme   объект схемы базы данных
	 * @param  {Object}   idObj    идентификатор текущего объекта
	 * @param  {Function} callback функция обратного вызова
	 */
	const processResultKladr = (err, res, scheme, idObj, callback) => {
		// Если возникает ошибка тогда выводим её
		if($.isset(err) && !$.isset(res)){
			// Выводим сообщение об ошибке
			idObj.log(["произошла ошибка поиска в базе Kladr", err], "error");
			// Выводим результат
			callback(false);
		// Если данные пришли
		} else if($.isObject(res) && $.isArray(res.result) && res.result.length){
			// Формируем первоначальную строку адреса
			let address = "Россия" + ", "
			+ ($.isArray(res.result[0].parents)
			&& res.result[0].parents.length ? (res.result[0].parents.length > 1 ?
			res.result[0].parents.reduce((sum, val) => {
				// Формируем строку отчета
				return ($.isString(sum) ? sum : sum.name + " " + sum.type)
				+ ", " + val.name + " " + val.type;
			}) : res.result[0].parents[0].name + " " + res.result[0].parents[0].type) + "," : "");
			// Выполняем поиск GPS координат для текущего адреса
			getGPSForAddress(res.result, address, idObj, scheme)
			.then(result => {
				// Выводим сообщение в консоль
				idObj.log([
					"получение gps координат для адреса:",
					(res.result.length ? (res.result.length > 1 ? res.result.reduce((sum, val) => {
						// Формируем строку отчета
						return ($.isString(sum) ? sum : sum.name + " " + sum.typeShort + ".")
						+ ", " + val.name + " " + val.typeShort + ".";
					}) : res.result[0].name + " " + res.result[0].typeShort + ".") : ""),
					(result.length ? "Ok" : "Not ok")
				], "info");
				// Выводим результат
				callback(result);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log(["getGPSForAddress in processResultKladr", err], "error");
				// Выходим
				callback(false);
			});
		// Если данные не найдены то сообщаем об этом
		} else {
			// Выводим сообщение об ошибке
			idObj.log(["адрес в базе Kladr не найден", res.searchContext], "error");
			// Выводим результат
			callback(false);
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
		 * getRedis Метод чтения из Redis данных
		 * @param  {Object}   idObj    текущий идентификатор объекта
		 * @param  {String}   command  название комманды (get или hgetall)
		 * @param  {String}   key      ключ в базе
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат извлечения данных из базы
		 */
		static getRedis(idObj, command, key, expire = 0){
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если такая комманда существует
				if($.isset(idObj.clients.redis[command])){
					// Преобразуем время жизни
					expire = parseInt(Math.ceil(parseFloat(expire)), 10);
					// Устанавливаем время жизни
					if($.isset(expire)) idObj.clients.redis.multi([["EXPIRE", key, expire]]).exec();
					// Считываем данные
					idObj.clients.redis[command](key, (err, cache) => resolve({err, cache}));
				// Сообщаем что такая комманда не найдена
				} else resolve({err: "not found", cache: false});
			}));
		}
		/**
		 * setRedis Метод записи в Redis данных
		 * @param  {Object}   idObj    текущий идентификатор объекта
		 * @param  {String}   command  комманда для редиса (hmset или set)
		 * @param  {String}   key      ключ в базе
		 * @param  {String}   value    значение для записи
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат записи данных в базу
		 */
		static setRedis(idObj, command, key, value, expire = 0){
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Параметры запроса
				let params = [];
				/**
				 * setParams Функция формирования параметров
				 * @param  {String} command команда redis
				 * @param  {String} key     ключ запроса
				 * @param  {String} value   значение запроса
				 */
				const setParams = (command, key, value) => {
					// Преобразуем время жизни
					expire = parseInt(Math.ceil(parseFloat(expire)), 10);
					// Формируем массив запроса
					if($.isset(expire)){
						// Устанавливаем время жизни данных
						params = [
							[command, key, value],
							["EXPIRE", key, expire]
						];
					// Записываем параметры без времени жизни
					} else params = [[command, key, value]];
				};
				// Если нужно записать массив
				if((command !== "hmset") && $.isObject(value)){
					// Формируем блок параметров
					setParams(command, key, JSON.stringify(value));
				// Формируем блок параметров
				} else setParams(command, key, value);
				// Записываем данные в редисе
				idObj.clients.redis.multi(params)
				.exec((err, cache) => resolve({err, cache}));
			}));
		}
		/**
		 * rmRedis Метод удаления из Redis данных
		 * @param  {Object}   idObj текущий идентификатор объекта
		 * @param  {String}   key   ключ для поиска
		 * @return {Promise}        результат удаления данных из базы
		 */
		static rmRedis(idObj, key){
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * getKeys Функция для поиска ключей
				 * @param  {String}   key      ключ для поиска
				 * @param  {Function} callback результат работы функции
				 */
				var getKeys = (key, callback) => {
					// Создаем промис для обработки
					return (new Promise(resolve => {
						// Ищем ключи
						idObj.clients.redis.multi([["keys", key]])
						.exec((error, result) => {
							// Если данные пришли
							if($.isArray(result)
							&& result.length
							&& $.isArray(result[0])
							&& result[0].length){
								// Выводим найденный ключ
								resolve(result[0]);
							// Выводим результат что ничего не найдено
							} else resolve(false);
						});
					}));
				};
				// Запрашиваем данные удаляемого ключа
				getKeys(key).then(result => {
					// Если данные пришли
					if($.isArray(result)){
						// Массив для удаления ключей
						const removes = [];
						// Собираем массив для удаления ключей
						result.forEach(val => removes.push(["del", val]));
						// Удаляем данные
						idObj.clients.redis.multi(removes)
						.exec((err, cache) => resolve({err, cache}));
					// Выводим что ничего не удалено
					} else resolve({err: "not found", cache: false});
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getKeys in rmRedis", err], "error");
					// Выходим
					resolve({err: "not found", cache: false});
				});
			}));
		}
		/**
		 * constructor Конструктор класса
		 */
		constructor(){
			// Устанавливаем объект api anyks
			this.anyks = $;
			// Устанавливаем объект клиентов
			this.clients = {};
			// Устанавливаем название системы
			this.name = config.name;
			// Устанавливаем тип отладки
			this.debug = config.debug;
			// Устанавливаем ключ кладра
			this.keyKladr = config.kladr;
			// Устанавливаем версию системы
			this.version = config.version;
			// Устанавливаем копирайт
			this.copyright = config.copyright;
			// Устанавливаем пароль системы
			this.password = this.generateKey(config.password);
		}
		/**
		 * getVersionSystem Метод получения версии и копирайта системы
		 * @return {Promise} промис результата ответа
		 */
		getVersionSystem(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выводим результат
				const object = {
					version:	idObj.version,
					copyright:	idObj.copyright,
					text:		"\u00A9 " + idObj.copyright + " ver." + idObj.version
				};
				// Выводи данные в консоль
				idObj.log(["\x1B[0;31m\x1B[1m\u00A9", idObj.copyright, "ver.", idObj.version, "\x1B[0m"], "info");
				// Выводим результат
				resolve(object);
			}));
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
		 * parseAddress Метод парсинга адреса
		 * @param  {String} address адрес для парсинга
		 * @return {Object}         объект ответа
		 */
		parseAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Результат работы функции
				let result = false;
				// Регулярные выражения для поиска
				// Области
				const regR = /(?:область|край|республика|респ\.|обл\.|кр\.)/i;
				// Районы
				const regD = /(?:район|р\.)/i;
				// Города
				const regC = /(?:деревня|город|округ|село|поселение|поселок|посёлок|товарищество|поселение городского типа|тов\.|пгт\.|д\.|г\.|окр\.|с\.|п\.)/i;
				// Улицы
				const regS = /(?:улица|площадь|проспект|авеню|ул\.|пл\.|пр\.|ав\.)/i;
				// Квартиры
				const regA = /(?:квартира|офис|комната|кв\.|ком\.|оф\.)/i;
				// Дома
				const regH = /(?:дом|д\.)/i
				// Создаем объект с адресом
				const addObject = {address};
				// Исправляем адрес
				addObject.address = addObject.address.replace(/\./ig, ". ").anyks_trim();
				/**
				 * getZip Функция поиска почтового индекса
				 * @return {String}           почтовый индекс
				 */
				const getZip = () => {
					// Определяем почтовый индекс
					const result = /\d{6}/.exec(addObject.address);
					// Создаем почтовый индекс
					let zip = false;
					// Если почтовый индекс найден то выводим его
					if($.isset(result)) zip = result[0];
					// Заменяем в основном адресе параметры
					if($.isset(zip)) addObject.address = addObject.address.replace(zip, "{zip}");
					// Выводим результат
					return zip;
				};
				/**
				 * getCountry Функция извлечения страны
				 * @return {String}           название страны
				 */
				const getCountry = () => {
					// Определяем страну
					const result = /^([А-ЯЁё\-\s]+),?\s*\{(?:zip|region|district|city|street|house)\}/i.exec(addObject.address);
					// Создаем название страны
					let country = false;
					// Если это массив
					if($.isset(result) && (result.length === 2))
						// Выводим название страны
						country = result[1].anyks_trim().anyks_ucwords();
					// Заменяем в основном адресе параметры
					if($.isset(country)) addObject.address = addObject.address.replace(country, "{country}");
					// Выводим результат
					return country;
				};
				/**
				 * getAddress Функция поиска области
				 * @param  {RegExp} reg       регулярное выражение
				 * @param  {String} name      название поискового элемента
				 * @return {Object}           объект с адресом
				 */
				const getAddress = (reg, name) => {
					// Разбиваем на массив
					const arr = addObject.address.split(",");
					// Объект с данными
					let data = false;
					// Ищем адрес
					arr.forEach((val, i) => {
						// Удаляем пробелы
						val = val.anyks_trim();
						// Если мы нашли адрес
						if(reg.test(val)){
							// Создаем объект
							if(!data) data = {name: "", type: ""};
							// Разбиваем на массив
							const param = val.split(" ");
							// Выполняем поиск по массиву
							param.forEach((val, i) => {
								// Если мы нашли адрес
								if(reg.test(val)){
									// Запоминаем тип адреса
									data.type = val;
								// Запоминаем тип
								} else data.name += val + " ";
							});
							// Исправляем название улицы
							data.name = data.name.anyks_trim().anyks_ucwords();
							// Запоминаем значение
							data.src = val;
							// Удаляем из массива наш регион
							arr.splice(i, 1);
							// Выходим из функции
							arr.length = 0;
						}
					});
					// Заменяем в основном адресе параметры
					if(data){
						// Изменяем адрес
						addObject.address = addObject.address.replace(data.src, "{" + name + "}");
						// Запоминаем значение
						data.src = data.src.replace(/\.\s+/ig, ".");
					}
					// Выводим результат
					return data;
				};
				/**
				 * getHouse Функция поиска номера дома
				 * @return {String}           номер дома
				 */
				const getHouse = () => {
					/**
					 * searchHouse Функция поиска дома
					 * @return {String} название и номер дома
					 */
					const searchHouse = () => {
						// Разбиваем на массив
						const arr = addObject.address.split(",").reverse();
						// Дома
						const regH1 = /(?:дом|строение|корпус|д\.|стр\.|с\.|корп\.|к\.)/i;
						// Дома второй вариант
						const regH2 = /(?:\d+)\s*(?:к|с)?\s*(?:\d+)?\s*(?:к|с)?\s*(?:\d+)?/i;
						// Объект с данными
						let house = false;
						// Ищем адрес
						arr.forEach((val, i) => {
							// Если дом найден
							if(regH1.test(val) || regH2.test(val)){
								// Запоминаем номер дома
								house = val.anyks_trim();
								// Выходим
								arr.length = 0;
							}
						});
						// Заменяем в основном адресе параметры
						if(house) addObject.address = addObject.address.replace(house, "{house}");
						// Выводим номер дома
						return house;
					};
					// Получаем данные дома
					const house = getAddress(regH, "house");
					// Если дом найден тогда выводим его данные
					if($.isset(house)) return house;
					// Генерируем другой номер дома
					else {
						// Получаем название дома
						const name = searchHouse();
						// Возвращаем результат
						return ($.isset(name) ? {
							name:	name,
							type:	"д.",
							src:	"д." + " " + name
						} : false);
					}
				};
				// Если запятые найдены
				if(/\,/i.test(addObject.address)){
					// Формируем блок результата
					result = {
						"region":		getAddress(regR, "region"),
						"district":		getAddress(regD, "district"),
						"city":			getAddress(regC, "city"),
						"street":		getAddress(regS, "street"),
						"apartment":	getAddress(regA, "apartment"),
						"house":		getHouse(),
						"zip":			getZip(),
						"country":		getCountry(),
						"address":		addObject.address
					};
				}
				// Выводим в консоль результат
				idObj.log(["строка адреса интерпретирована", result], "info");
				// Выводим результат
				resolve(result);
			}));
		}
		/**
		 * searchRegion Метод поиска региона
		 * @param  {String}  str      строка запроса
		 * @param  {Number}  limit    количество результатов к выдаче
		 * @param  {Boolean} noCache  отключить кеш
		 * @return {Promise}          промис результата
		 */
		searchRegion({str, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'region';
				const WithParent	= 0;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				searchAddressInCache(ContentName, ContentType, null, null, Limit, idObj).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
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
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["searchAddressInCache in searchRegion", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * searchDistrict Метод поиска района
		 * @param  {String}  str        строка запроса
		 * @param  {String}  regionId   идентификатор региона
		 * @param  {Number}  limit      количество результатов к выдаче
		 * @param  {Boolean} noCache    отключить кеш
		 * @return {Promise}            промис результата
		 */
		searchDistrict({str, regionId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'district';
				const ParentType	= ($.isset(regionId) ? 'region' : undefined);
				const ParentId		= ($.isset(regionId) ? regionId : undefined);
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				searchAddressInCache(ContentName, ContentType, ParentId, ParentType, Limit, idObj).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
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
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["searchAddressInCache in searchDistrict", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * searchCity Метод поиска города
		 * @param  {String}  str        строка запроса
		 * @param  {String}  regionId   идентификатор региона
		 * @param  {String}  districtId идентификатор района
		 * @param  {Number}  limit      количество результатов к выдаче
		 * @param  {Boolean} noCache    отключить кеш
		 * @return {Promise}            промис результата
		 */
		searchCity({str, regionId, districtId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
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
				// Ищем данные адреса сначала в кеше
				searchAddressInCache(ContentName, ContentType, ParentId, ParentType, Limit, idObj).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
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
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["searchAddressInCache in searchCity", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * searchStreet Метод поиска улицы
		 * @param  {String} str    строка запроса
		 * @param  {String} cityId идентификатор города
		 * @param  {Number} limit  количество результатов к выдаче
		 * @return {Promise}       промис результата
		 */
		searchStreet({str, cityId, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'street';
				const ParentType	= 'city';
				const ParentId		= cityId;
				const WithParent	= 1;
				const Limit			= limit;
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;
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
			}));
		}
		/**
		 * searchHouse Метод поиска дома
		 * @param  {String} str      строка запроса
		 * @param  {String} streetId идентификатор улицы
		 * @param  {Number} limit    количество результатов к выдаче
		 * @return {Promise}         промис результата
		 */
		searchHouse({str, streetId, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'building';
				const ParentType	= 'street';
				const ParentId		= streetId;
				const WithParent	= 1;
				const Limit			= limit;
				// Подключаем модуль кладра
				const kladr = require("kladrapi").ApiQuery;
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
			}));
		}
		/**
		 * getAddressFromGPS Метод получения данных адреса по GPS координатам
		 * @param  {Float}   lat    широта
		 * @param  {Float}   lng    долгота
		 * @return {Promise}        промис содержащий объект с адресом
		 */
		getAddressFromGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша адреса
				const key = "address:gps:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis(idObj, "get", key, 3600).then(({err, result}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(result)) resolve(JSON.parse(result));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * getDataFromGeocoder Функция запроса данных с геокодера
						 */
						const getDataFromGeocoder = () => {
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
									// Выводим сообщение об удачном приведении типов
									idObj.log(["приведение типов выполнено", result], "info");
									// Сохраняем результат в базу данных
									if(result) (new idObj.schemes.Address(result)).save();
									// Отправляем в Redis на час
									Agl.setRedis(idObj, "set", key, result, 3600).then();
									// Выводим результат
									resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log(["parseAnswerGeoCoder in getAddressFromGPS", err], "error");
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log(["выполняем запрос с геокодера,", "lat =", lat + ",", "lng =", lng], "info");
								// Выполняем запрос с геокодера Yandex
								const yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с yandex api', err], "error")
								);
								// Выполняем запрос с геокодера Google
								const google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с google api', err], "error")
								) : false);
								// Выполняем запрос с геокодера OpenStreet Maps
								const osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с osm api', err], "error")
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} : false))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log([
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm ? "Ok" : "Not")
								], "info");
								// Выполняем инициализацию
								init(obj);
							};
							// Запускаем коннект
							exec(getData());
						};
						// Запрашиваем все данные из базы
						idObj.schemes.Address.findOne({
							'gps': {
								$near: {
									$geometry: {
										type: 'Point',
										// Широта и долгота поиска
										coordinates: [lat, lng]
									},
									$maxDistance: 25
								}
							}
						// Выполняем запрос
						}).exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isset(data)
							&& $.isObject(data)) resolve(data);
							// Продолжаем дальше если данные не найдены
							else getDataFromGeocoder();
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getAddressFromGPS", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getAddressFromString Метод получения данных адреса по строке
		 * @param  {String}   address строка запроса
		 * @return {Promise}          промис содержащий объект с адресом
		 */
		getAddressFromString({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Преобразуем адрес
				address = address.anyks_trim();
				// Ключ кеша адреса
				const key = "address:string:" + idObj.generateKey(address.toLowerCase());
				// Ищем станции в кеше
				Agl.getRedis(idObj, "get", key, 3600).then(({err, result}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(result)) resolve(JSON.parse(result));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * getDataFromGeocoder Функция запроса данных с геокодера
						 */
						const getDataFromGeocoder = () => {
							// Подключаем модуль закачки данных
							const fetch = require('node-fetch');
							// Массив с геокодерами
							const urlsGeo = [
								'http://geocode-maps.yandex.ru/1.x/?format=json&geocode=$address',
								'http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false&language=ru',
								'http://nominatim.openstreetmap.org/search?q=$address&format=json&addressdetails=1&limit=1'
							].map(val => val.replace("$address", encodeURI(address)));
							/**
							 * getAddressOSM Функция преобразования адреса для геокодера OSM
							 * @return {String} новый вид адреса
							 */
							const getAddressOSM = address => {
								// Разбиваем адрес на составляющие
								const addrArr = address.split(", ");
								// Переходим по всему массиву адреса
								addrArr.forEach((val, i) => {
									// Если район найден, удаляем его
									if(/район/i.test(val)) addrArr.splice(i, 1);
								});
								// Переходим по всему массиву адреса
								addrArr.forEach((val, i) => {
									// Разделяем адрес на составляющие
									const words = val.split(" ");
									// Переходим по всему массиву
									words.forEach((val, i) => {
										// Регулярное выражение для поиска
										if(/(?:деревня|город|село|поселок|округ|посёлок|поселение|улица|площадь|проспект|авеню|дом|строение|корпус)/i
										.test(val)) words.splice(i, 1);
									});
									// Собираем обратно массив
									addrArr[i] = words.join(" ");
								});
								// Создаем строку обратно
								return encodeURI(addrArr.join(", "));
							};
							// Заменяем адрес OSM
							urlsGeo[2].replace(encodeURI(address), getAddressOSM(address));
							// Получаем объект запроса с геокодера
							const init = obj => {
								// Выполняем обработку результата геокодера
								parseAnswerGeoCoder(obj, idObj).then(result => {
									// Выводим сообщение об удачном приведении типов
									idObj.log(["приведение типов выполнено", result], "info");
									// Сохраняем результат в базу данных
									if(result) (new idObj.schemes.Address(result)).save();
									// Отправляем в Redis на час
									Agl.setRedis(idObj, "set", key, result, 3600).then();
									// Выводим результат
									resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log(["parseAnswerGeoCoder in getAddressFromString", err], "error");
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log(["выполняем запрос с геокодера,", "address =", address], "info");
								// Выполняем запрос с геокодера Yandex
								const yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с yandex api', err], "error")
								);
								// Выполняем запрос с геокодера Google
								const google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с google api', err], "error")
								) : false);
								// Выполняем запрос с геокодера OpenStreet Maps
								const osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log(['получения данных с osm api', err], "error")
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} : false))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log([
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm ? "Ok" : "Not")
								], "info");
								// Выполняем инициализацию
								init(obj);
							};
							// Запускаем коннект
							exec(getData());
						};
						// Выполняем интерпретацию адреса
						idObj.parseAddress({address}).then(result => {
							// Если данные пришли
							if($.isObject(result)){
								// Запрашиваем все данные из базы
								idObj.schemes.Address.findOne({
									"address.district": ($.isset(result.district)	? (new RegExp(result.district.name, "i"))	: null),
									"address.city":		($.isset(result.city)		? (new RegExp(result.city.name, "i")) 		: null),
									"address.region":	($.isset(result.region)		? (new RegExp(result.region.name, "i"))		: null),
									"address.street":	($.isset(result.street)		? (new RegExp(result.street.name, "i"))		: null)
								// Выполняем запрос
								}).exec((err, data) => {
									// Выводим результат поиска по базе
									idObj.log(["поиск адреса в базе", data], "info");
									// Если ошибки нет, выводим результат
									if(!$.isset(err) && $.isset(data)
									&& $.isObject(data)) resolve(data);
									// Продолжаем дальше если данные не найдены
									else getDataFromGeocoder();
								});
							// Продолжаем дальше
							} else getDataFromGeocoder();
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log(["parseAddress in getAddressFromString", err], "error");
							// Выходим
							getDataFromGeocoder();
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getAddressFromString", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegions Метод получения списка регионов
		 * @param  {Number}  limit количество результатов к выдаче
		 * @return {Promise}       промис результата
		 */
		getRegions({limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса
				const key = "address:subjects:region";
				// Считываем данные из кеша
				Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Запрашиваем все данные из базы
						idObj.schemes.Regions.find({})
						.sort({_id: 1})
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length) resolve(data);
							// Сообщаем что ничего не найдено
							else resolve(false);
						});
					// Если данные пришли
					} else {
						// Функция поиска данных в кеше
						const searchCache = () => {
							// Текущее значение итерации
							let i = 0;
							// Массив найденных регионов
							const regions = [];
							// Выполняем парсинг ответа
							cache = JSON.parse(cache);
							// Переходим по всему массиву регионов
							for(let val in cache){
								for(let key in cache[val]){
									// Добавляем в массив регион
									regions.push(cache[val][key]);
									// Увеличиваем значение индекса
									if(i < (limit - 1)) i++;
									// Выходим
									else return regions;
								}
							}
							// Выводим все регионы
							return regions;
						};
						// Выводим результат
						resolve(searchCache());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getRegions", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistricts Метод получения списка районов
		 * @param  {String}  regionId  идентификатор региона
		 * @param  {Number}  limit     количество результатов к выдаче
		 * @return {Promise}           промис результата
		 */
		getDistricts({regionId, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса
				const key = "address:subjects:district";
				// Считываем данные из кеша
				Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Запрашиваем все данные из базы
						idObj.schemes.Districts.find({regionId: regionId})
						.sort({_id: 1})
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length) resolve(data);
							// Сообщаем что ничего не найдено
							else resolve(false);
						});
					// Если данные пришли
					} else {
						// Функция поиска данных в кеше
						const searchCache = () => {
							// Текущее значение итерации
							let i = 0;
							// Массив найденных районов
							const districts = [];
							// Выполняем парсинг ответа
							cache = JSON.parse(cache);
							// Переходим по всему массиву районов
							for(let val in cache){
								for(let key in cache[val]){
									// Если родительский элемент передан
									if($.isset(regionId)){
										// Если родительский элемент найден
										if((cache[val][key].regionId === regionId) || (key === regionId)){
											// Добавляем в массив район
											districts.push(cache[val][key]);
											// Увеличиваем значение индекса
											if(i < (limit - 1)) i++;
											// Выходим
											else return districts;
										}
									// Если родительский элемент не существует тогда просто добавляем в список
									} else {
										// Добавляем в массив район
										districts.push(cache[val][key]);
										// Увеличиваем значение индекса
										if(i < (limit - 1)) i++;
										// Выходим
										else return districts;
									}
								}
							}
							// Выводим все районы
							return districts;
						};
						// Выводим результат
						resolve(searchCache());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getDistricts", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCities Метод получения списка городов
		 * @param  {String}  regionId    идентификатор региона
		 * @param  {String}  districtId  идентификатор района
		 * @param  {Number}  limit       количество результатов к выдаче
		 * @return {Promise}             промис результата
		 */
		getCities({regionId, districtId, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса
				const key = "address:subjects:city";
				// Считываем данные из кеша
				Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Запрашиваем все данные из базы
						idObj.schemes.Cities.find({
							regionId:	regionId,
							districtId:	districtId
						}).sort({_id: 1})
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length) resolve(data);
							// Сообщаем что ничего не найдено
							else resolve(false);
						});
					// Если данные пришли
					} else {
						// Функция поиска данных в кеше
						const searchCache = () => {
							// Текущее значение итерации
							let i = 0;
							// Массив найденных городов
							const cities = [];
							// Выполняем парсинг ответа
							cache = JSON.parse(cache);
							// Переходим по всему массиву городов
							for(let val in cache){
								for(let key in cache[val]){
									// Если родительский элемент передан
									if($.isset(regionId) || $.isset(districtId)){
										// Если родительский элемент найден
										if(((cache[val][key].districtId === districtId)
										|| (key === districtId))
										|| ((cache[val][key].regionId === regionId)
										|| (key === regionId))){
											// Добавляем в массив город
											cities.push(cache[val][key]);
											// Увеличиваем значение индекса
											if(i < (limit - 1)) i++;
											// Выходим
											else return cities;
										}
									// Если родительский элемент не существует тогда просто добавляем в список
									} else {
										// Добавляем в массив город
										cities.push(cache[val][key]);
										// Увеличиваем значение индекса
										if(i < (limit - 1)) i++;
										// Выходим
										else return cities;
									}
								}
							}
							// Выводим все города
							return cities;
						};
						// Выводим результат
						resolve(searchCache());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getCities", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getTimezone Метод получения данных временной зоны по GPS координатам
		 * @param  {Number} lat широта
		 * @param  {Number} lng долгота
		 * @return {Promise}    промис содержащий данные временной зоны
		 */
		getTimezone({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "timezone:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis(idObj, "get", key, 3600).then(({err, result}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(result)) resolve(JSON.parse(result));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						// Подключаем модуль закачки данных
						const fetch = require('node-fetch');
						// Создаем штамп времени
						const timestamp = Math.round((new Date()).valueOf() / 1000);
						// Адрес запроса
						const url = "https://maps.googleapis.com/maps/api/timezone/json?location=$lat,$lng&language=ru&timestamp=$tm";
						/**
						 * getData Функция обработки полученных данных временной зоны
						 * @param  {Object} json объект данных временной зоны
						 */
						const getData = json => {
							// Если ответ пришел
							if(json.status === "OK"){
								// Удаляем статус
								json.status = undefined;
								// Отправляем в Redis на час
								Agl.setRedis(idObj, "set", key, json, 3600).then();
								// Выводим результат
								resolve(json);
							// Сообщаем что ничего не найдено
							} else resolve(false);
						};
						// Выполняем запрос данных
						fetch(url
							.replace("$lat", lat)
							.replace("$lng", lng)
							.replace("$tm", timestamp)
						// Преобразуем полученный объект
						).then(
							res => (res.status === 200 ? res.json() : false),
							err => idObj.log(["get timezone", err], "error")
						// Обрабатываем полученные данные
						).then(getData, err => idObj.log(["parse timezone", err], "error"))
						// Если происходит ошибка тогда выходим
						.catch(err => {
							// Ошибка метода getTimezone
							idObj.log(["getTimezone", err], "error");
							// Сообщаем что дальше некуда
							resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in getTimezone", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * searchMetroFromGPS Метод поиска ближайшего метро по GPS координатам
		 * @param  {Number} lat      широта
		 * @param  {Number} lng      долгота
		 * @param  {Number} distance дистанция поиска в метрах
		 * @return {Promise}         промис содержащий найденные станции метро
		 */
		searchMetroFromGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "metro:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем станции в кеше
				Agl.getRedis(idObj, "get", key, 3600).then(({err, result}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(result)) resolve(JSON.parse(result));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						// Выполняем поиск ближайшего метро
						idObj.schemes.Metro_stations.find({
							'gps': {
								$near: {
									$geometry: {
										type: 'Point',
										// Широта и долгота поиска
										coordinates: [lat, lng]
									},
									$maxDistance: distance
								}
							}
						// Запрашиваем данные метро
						}).exec((err, data) => {
							// Результат ответа
							let result = false;
							// Если ошибки нет
							if(!$.isset(err) && $.isArray(data)) result = data;
							// Выводим в консоль сообщение что данные метро не найдены
							else idObj.log(["станции метро по gps координатам не найдены:", "lat =", lat, "lng =", lng, err, data], "error");
							// Отправляем в Redis на час
							Agl.setRedis(idObj, "set", key, result, 3600).then();
							// Выводим результат
							resolve(result);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log(["getRedis in searchMetroFromGPS", err], "error");
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * updateMetroCity Метод обновления данных метро в тех городах где оно не найдено
		 * @return {Promise} промис с данными результата обновлений станций метро
		 */
		updateMetroCity(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * updateDB Функция обновления данных в базе
				 * @param  {Object}   obj      объект для обновления данных
				 * @param  {Function} callback функция обратного вызова
				 */
				const updateDB = (obj, callback) => {
					/**
					 * Функция сохранения данных в кеше saveCache
					 */
					const saveCache = () => {
						// Ключ запроса
						const key = "address:subjects:" + obj.contentType;
						// Считываем данные из кеша
						Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
							// Если данные не найдены
							if(!$.isset(cache)) cache = {};
							// Выполняем парсинг ответа
							else cache = JSON.parse(cache);
							// Создаем ключ названия
							const char = obj.name[0].toLowerCase();
							// Если такого блока данных нет тогда создаем его
							if(!$.isset(cache[char]))			cache[char]				= {};
							if(!$.isset(cache[char][obj._id]))	cache[char][obj._id]	= {};
							// Сохраняем данные в кеше
							cache[char][obj._id] = obj;
							// Сохраняем данные в кеше
							Agl.setRedis(idObj, "set", key, cache)
							// Если данные сохранены то выводим результат
							.then(callback)
							// Если происходит ошибка то также выводим результат
							.catch(callback);
						// Если происходит ошибка тогда выходим
						}).catch(callback);
					};
					// Запрашиваем все данные из базы
					idObj.schemes.Cities.findOne({_id: obj._id})
					// Выполняем запрос
					.exec((err, data) => {
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)
						&& $.isObject(data)){
							// Выполняем обновление
							idObj.schemes.Cities.update({_id: obj._id}, obj, {upsert: true}, saveCache);
						// Просто добавляем новый объект
						} else (new idObj.schemes.Cities(obj)).save(saveCache);
					});
				};
				// Запрашиваем все данные городов
				idObj.schemes.Cities.find({metro: {$size: 0}, typeShort: "г"})
				// Запрашиваем данные регионов
				.exec((err, data) => {
					// Если ошибки нет
					if(!$.isset(err) && $.isArray(data) && data.length){
						/**
						 * getData Рекурсивная функция перехода по массиву
						 * @param  {Number} i индекс текущего значения массива
						 */
						const getData = (i = 0) => {
							// Если не все данные пришли тогда продолжаем загружать
							if(i < data.length){
								// Параметры запроса
								const query = {
									lat:		data[i].lat,
									lng:		data[i].lng,
									distance:	150000
								};
								// Получаем данные метро
								idObj.searchMetroFromGPS(query).then(metro => {
									// Если метро передано
									if($.isArray(metro) && metro.length){
										// Создаем пустой массив с метро
										data[i].metro = [];
										// Переходим по всему массиву данных
										metro.forEach(val => data[i].metro.push(val._id));
										// Сохраняем метро
										updateDB(data[i], () => getData(i + 1));
									// Просто продолжаем дальше
									} else getData(i + 1);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log(["searchMetroFromGPS in updateMetroCity", err], "error");
									// Выходим
									getData(i + 1);
								});
							// Если все загружено тогда сообщаем об этом
							} else {
								// Выводим в консоль сообщение
								idObj.log("все станции метро в городах установлены!", "info");
								// Выводим результат
								resolve(true);
							}
						};
						// Запускаем запрос данных
						getData();
					// Сообщаем что такие данные не найдены
					} else resolve(false);
				});
			}));
		}
		/**
		 * updateTimeZones Метод обновления временных зон у тех элементов адресов у которых ранее временная зона была не найдена
		 * @return {Promise} промис содержащий результат обновления временных зон
		 */
		updateTimeZones(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * updateDB Функция обновления данных в базе
				 * @param  {Object} obj      объект для обновления данных
				 * @param  {Object} scheme   схема базы данных
				 * @param  {Function}        callback функция обратного вызова
				 */
				const updateDB = (obj, scheme, callback) => {
					/**
					 * Функция сохранения данных в кеше saveCache
					 */
					const saveCache = () => {
						// Ключ запроса
						const key = "address:subjects:" + obj.contentType;
						// Считываем данные из кеша
						Agl.getRedis(idObj, "get", key).then(({err, cache}) => {
							// Если данные не найдены
							if(!$.isset(cache)) cache = {};
							// Выполняем парсинг ответа
							else cache = JSON.parse(cache);
							// Создаем ключ названия
							const char = obj.name[0].toLowerCase();
							// Если такого блока данных нет тогда создаем его
							if(!$.isset(cache[char]))			cache[char]				= {};
							if(!$.isset(cache[char][obj._id]))	cache[char][obj._id]	= {};
							// Сохраняем данные в кеше
							cache[char][obj._id] = obj;
							// Сохраняем данные в кеше
							Agl.setRedis(idObj, "set", key, cache)
							// Если вес удачно то выходим
							.then(callback)
							// Если происходит ошибка то выходим
							.catch(callback);
						// Если происходит ошибка тогда выходим
						}).catch(callback);
					};
					// Запрашиваем все данные из базы
					scheme.findOne({_id: obj._id})
					// Выполняем запрос
					.exec((err, data) => {
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)
						&& $.isObject(data)){
							// Выполняем обновление
							scheme.update({_id: obj._id}, obj, {upsert: true}, saveCache);
						// Просто добавляем новый объект
						} else (new scheme(obj)).save(saveCache);
					});
				};
				/**
				 * getTimezone Функция запроса временной зоны
				 * @param  {Object} scheme схема базы данных
				 * @return {Promise}       промис содержащий результат ответа
				 */
				const getTimezone = scheme => {
					// Создаем промис для обработки
					return (new Promise(resolve => {
						// Запрашиваем все данные городов
						scheme.find({timezone: {$exists: false}})
						// Запрашиваем данные регионов
						.exec((err, data) => {
							// Если ошибки нет
							if(!$.isset(err) && $.isArray(data) && data.length){
								/**
								 * getData Рекурсивная функция перехода по массиву
								 * @param  {Number} i индекс текущего значения массива
								 */
								const getData = (i = 0) => {
									// Если не все данные пришли тогда продолжаем загружать
									if(i < data.length){
										// Получаем данные временной зоны
										idObj.getTimezone({lat: data[i].lat, lng: data[i].lng}).then(timezone => {
											// Если временная зона пришла
											if(timezone){
												// Сохраняем временную зону
												data[i].timezone = timezone;
												// Сохраняем временную зону
												updateDB(data[i], scheme, () => getData(i + 1));
											// Просто продолжаем дальше
											} else getData(i + 1);
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log(["getTimezone in updateTimeZones", err], "error");
											// Выходим
											getData(i + 1);
										});
									// Если все загружено тогда сообщаем об этом
									} else {
										// Выводим в консоль сообщение
										idObj.log("все временные зоны установлены!", "info");
										// Выводим результат
										resolve(true);
									}
								};
								// Запускаем запрос данных
								getData();
							// Сообщаем что такие данные не найдены
							} else resolve(false);
						});
					}));
				};
				/**
				 * *getData Генератор для получения данных временной зоны
				 */
				const getData = function * (){
					// Выполняем запрос временной зоны для регионов
					const regions = yield getTimezone(idObj.schemes.Regions);
					// Выполняем запрос временной зоны для районов
					const districts = yield getTimezone(idObj.schemes.Districts);
					// Выполняем запрос временной зоны для городов
					const cities = yield getTimezone(idObj.schemes.Cities);
					// Выполняем запрос временной зоны для улиц
					const streets = yield getTimezone(idObj.schemes.Streets);
					// Выполняем запрос временной зоны для домов
					const houses = yield getTimezone(idObj.schemes.Houses);
					// Выводим в консоль что все данные временной зоны обновлены
					idObj.log("все временные зоны обновлены удачно!", "info");
					// Сообщаем что все выполнено
					resolve(true);
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
				// Удаляем данные из кеша
				Agl.rmRedis(idObj, "address:subjects:region");
				/**
				 * getRegion Рекурсивная функция загрузки региона
				 * @param  {Number} i текущий индекс массива
				 */
				const getRegion = (i = 0) => {
					// Если данные не все загружены то загружаем дальше
					if(i < regionsChar.length){
						// Формируем параметры запроса
						const query = {
							str:		regionsChar[i],
							limit:		100,
							noCache:	true
						};
						// Выполняем загрузку данных
						idObj.searchRegion(query).then(result => {
							// Если это массив
							if($.isArray(result) && result.length){
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
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log(["searchRegion in updateRegions", err], "error");
							// Выходим
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
						// Выводим в консоль сообщение
						idObj.log("все регионы установлены!", "info");
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
				// Удаляем данные из кеша
				Agl.rmRedis(idObj, "address:subjects:district");
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
										// Параметры запроса
										const query = {
											str:		districsChar[j],
											limit:		100,
											noCache:	true,
											regionId:	data[i]._id
										};
										// Выполняем поиск района
										idObj.searchDistrict(query).then(result => {
											// Если это массив
											if($.isArray(result) && result.length){
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
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log(["searchDistrict in updateDistricts", err], "error");
											// Выходим
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
								// Выводим в консоль сообщение
								idObj.log("все районы установлены!", "info");
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
				// Удаляем данные из кеша
				Agl.rmRedis(idObj, "address:subjects:city");
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
										// Параметры запроса
										const query = {
											str:		citiesChar[j],
											limit:		100,
											noCache:	true,
											regionId:	data[i]._id,
											districtId:	null
										};
										// Выполняем поиск городов
										idObj.searchCity(query).then(result => {
											// Если это массив
											if($.isArray(result) && result.length){
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
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log(["searchCity in updateCities", err], "error");
											// Выходим
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
								// Выводим в консоль сообщение
								idObj.log("все города установлены!", "info");
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
					// Объект с данными метро для кеша
					const cacheObject = {};
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
								station.gps = [station.lat, station.lng];
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
							idObj.schemes.Cities.findOne({name: arr[i].name, typeShort: "г"})
							// Запрашиваем данные регионов
							.exec((err, data) => {
								// Если ошибки нет
								if(!$.isset(err) && $.isset(data) && $.isObject(data)){
									// Изменяем идентификатор записи
									arr[i]._id		= data._id;
									arr[i].linesIds	= [];
									// Запоминаем данные в кеше
									cacheObject[arr[i]._id] = {};
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
											station.gps = [station.lat, station.lng];
											// Формируем массив станций для линии
											line.stationsIds.push(station._id);
											// Создаем ключ станции
											const keyChar = station.name[0].toLowerCase();
											// Создаем объект метро для хранения данных
											if(!$.isArray(cacheObject[arr[i]._id][keyChar])) cacheObject[arr[i]._id][keyChar] = [];
											// Добавляем в кеш данные
											cacheObject[arr[i]._id][keyChar].push({
												id:		station._id,
												name:	station.name,
												lat:	station.lat,
												lng:	station.lng,
												order:	station.order,
												line:	line.name,
												color:	line.color,
												city:	arr[i].name
											});
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
							// Ключа кеша метро
							const key = "metro:stations";
							// Записываем данные в кеш
							Agl.setRedis(idObj, "set", key, cacheObject).then();
							// Выводим в консоль сообщение
							idObj.log("все метро установлены!", "info");
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
				.then(
					res => (res.status === 200 ? res.json() : false),
					err => idObj.log(["get metro", err], "error")
				// Обрабатываем полученные данные
				).then(getData, err => idObj.log(["parse metro", err], "error"))
				// Если происходит ошибка тогда выходим
				.catch(err => {
					// Ошибка метода getTimezone
					idObj.log(["updateMetro", err], "error");
					// Сообщаем что дальше некуда
					resolve(false);
				});
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
				/**
				 * *updateDB Генератор для получения обновления данных
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
						// Выполняем загрузку станций метро для городов
						const metroCity = yield idObj.updateMetroCity();
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
						// Выводим в консоль сообщение
						idObj.log("все работы выполнены!", "info");
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
					// Если вывод ошибок разрешен
					if(this.debug.errors){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим сообщение об ошибке
						console.error(
							'\x1B[0;31m\x1B[1mError\x1B[0m\x1B[0;31m',
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m',
							($.isArray(message) ? message.anyks_toObjString().join(" ") : message)
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				break;
				// Если это информационные сообщения
				case "info":
					// Если вывод информационных сообщений разрешен
					if(this.debug.message){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим информационное сообщение
						console.info(
							'\x1B[38;5;148m\x1B[1mInfo\x1B[0m\x1B[38;5;148m',
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m',
							($.isArray(message) ? message.anyks_toObjString().join(" ") : message)
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				break;
			}
		}
	};
	// Создаем модуль для Node.js
	module.exports = Agl;
})(anyks);