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
	 * createSubjectKey Функция создания ключа в Redis
	 * @param  {String} key        основной ключ
	 * @param  {String} parentType родительский тип
	 * @param  {String} parentId   родительский идентификатор
	 * @param  {String} type       тип запроса
	 * @param  {String} name       название записи
	 * @param  {String} id         идентификатор записи
	 * @return {String}            готовый ключ
	 */
	const createSubjectKey = ({key, parentType, parentId, type, name = "*", id = "*"}) => {
		// Выполняем генерацию ключа
		return (function(){
			// Вид ключа: [address:subjects:parentType:parentId:city:char:id]
			// Создаем массив составного ключа
			const arrKey = [];
			// Ключ по умолчанию
			arguments[0][0] = "address:" + key;
			// Создаем буквы ключа
			if($.isset(name)) for(let i = 0; i < name.length; i++) arrKey.push(name[i].toLowerCase());
			// Добавляем идентификатор
			if($.isset(id)) arrKey.push(id);
			// Формируем первоначальное значение ключа
			return (arguments[0].join(":") + ":" + arrKey.join(":")).replace(/:{2,7}/g, ":");
		})([key, parentType, parentId, type], name, id);
	};
	/**
	 * createMetroKey Функция создания ключа для станций метро в Redis
	 * @param  {String} key     основной ключ
	 * @param  {String} cityId  родительский тип
	 * @param  {String} lineId  родительский идентификатор
	 * @param  {String} name    название записи
	 * @param  {String} id      идентификатор записи
	 * @return {String}         готовый ключ
	 */
	const createMetroKey = ({key, cityId, lineId, name = "*", id = "*"}) => {
		// Выполняем генерацию ключа
		return (function(){
			// Вид ключа: [address:metro:cityId:lineId:c:h:a:r:id]
			// Создаем массив составного ключа
			const arrKey = [];
			// Ключ по умолчанию
			arguments[0][0] = "address:" + key;
			// Создаем буквы ключа
			if($.isset(name)) for(let i = 0; i < name.length; i++) arrKey.push(name[i].toLowerCase());
			// Добавляем идентификатор
			if($.isset(id)) arrKey.push(id);
			// Формируем первоначальное значение ключа
			return (arguments[0].join(":") + ":" + arrKey.join(":")).replace(/:{2,7}/g, ":");
		})([key, cityId, lineId], name, id);
	};
	/**
	 * getKeyRedisForSubject Функция генерации ключа для объектов адресов
	 * @param  {Object} obj объект для генерации ключа
	 * @return {String}     сгенерированный ключ
	 */
	const getKeyRedisForSubject = obj => {
		// Родительский элемент
		let parentType = "", parentId = "", id = ($.isset(obj.id) ? obj.id : obj._id);
		// Если это элемент только пришел из базы Кладра
		if($.isArray(obj.parents) && obj.parents.length){
			parentId	= obj.parents[obj.parents.length - 1].id;
			parentType	= obj.parents[obj.parents.length - 1].contentType;
		// Если это существующий элемент
		} else {
			// Если есть идентификатор улицы значит это дом
			if($.isset(obj.streetId)){
				parentType	= 'street';
				parentId	= obj.streetId;
			// Если есть идентификатор города значит это улица
			} else if($.isset(obj.cityId)) {
				parentType	= 'city';
				parentId	= obj.cityId;
			// Если есть идентификатор района значит это город
			} else if($.isset(obj.districtId)) {
				parentType	= 'district';
				parentId	= obj.districtId;
			// Если есть идентификатор региона значит это город или район
			} else if($.isset(obj.regionId)) {
				parentType	= 'region';
				parentId	= obj.regionId;
			}
		}
		// Ключ запроса из Redis
		return createSubjectKey({
			id,
			parentId,
			parentType,
			key:	"subjects",
			name:	obj.name,
			type:	obj.contentType
		});
	};
	/**
	 * parseAnswerGeoCoder Функция обработки результата полученного с геокодера
	 * @param  {Object} obj   ответ с геокодера
	 * @return {Object}       результат обработки
	 */
	const parseAnswerGeoCoder = function(obj){
		// Получаем идентификатор текущего объекта
		const idObj = this;
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
						let gps			= [parseFloat(lng), parseFloat(lat)];
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
	 * getRedisByMaskKey Функция чтения данных из Redis с использованием масок ключей
	 * @param  {String} key ключ маска
	 * @return {Promise}    промис содержащий массив данных из Redis
	 */
	const getRedisByMaskKey = function(key){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Получаем список ключей
			Agl.getRedisKeys.call(idObj, key).then(keys => {
				// Если ключи найдены
				if($.isArray(keys)){
					// Массив данных результата
					const result = [];
					/**
					 * getRedis Функция поиска данных в базе
					 * @param  {Number} i индекс итераций
					 */
					const getRedis = (i = 0) => {
						// Если данные загружены не полностью
						if(i < keys.length){
							// Считываем данные из кеша
							Agl.getRedis.call(idObj, "get", keys[i]).then(({err, cache}) => {
								// Если данные не найдены, то пропускаем ключ
								if(!$.isset(cache)) getRedis(i + 1);
								// Если данные найдены
								else {
									// Переконвертируем объект
									cache = JSON.parse(cache);
									// Добавляем объект в массив
									result.push(cache);
									// Продолжаем дальше
									getRedis(i + 1);
								}
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("getRedis in getRedisByMaskKey", err).error();
								// Продолжаем дальше
								getRedis(i + 1);
							});
						// Если данные загружены полностью
						} else resolve(result);
					};
					// Выполняем загрузку данных из Redis
					getRedis();
				// Сообщаем что ничего не найдено
				} else resolve(false);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisKeys in getRedisByMaskKey", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * findAddressInCache Функция поиска данных в кеше
	 * @param  {String} str        строка запроса
	 * @param  {String} type       тип запроса
	 * @param  {String} parentId   идентификатор родительский
	 * @param  {String} parentType тип родителя
	 * @param  {Number} limit      лимит результатов для выдачи
	 * @return {Promise}           промис содержащий результат
	 */
	const findAddressInCache = function(str, type, parentId, parentType, limit = 1){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Ограничиваем максимальный лимит
			if(limit > 100) limit = 100;
			// Ключ запроса из Redis
			const key = createSubjectKey({
				type,
				parentId,
				parentType,
				name:	str,
				key:	"subjects"
			});
			// Получаем список ключей
			Agl.getRedisKeys.call(idObj, key).then(keys => {
				// Если ключи найдены
				if($.isArray(keys)){
					// Массив данных результата
					const result = [];
					/**
					 * getRedis Функция поиска данных в базе
					 * @param  {Number} i индекс итераций
					 */
					const getRedis = (i = 0) => {
						// Если данные загружены не полностью
						if(i < keys.length){
							// Считываем данные из кеша
							Agl.getRedis.call(idObj, "get", keys[i]).then(({err, cache}) => {
								// Если данные не найдены, то пропускаем ключ
								if(!$.isset(cache)) getRedis(i + 1);
								// Если данные найдены
								else {
									// Переконвертируем объект
									cache = JSON.parse(cache);
									// Создаем регулярное выражение для поиска
									let reg = new RegExp("^" + str, "i");
									// Если станции метро не найдены то удаляем ключ
									if($.isset(cache.metro)
									&& !cache.metro.length) delete cache.metro;
									// Запоминаем результат
									result.push(cache);
									// Увеличиваем значение индекса
									if(i < (limit - 1)) getRedis(i + 1);
									// Выводим результат
									else resolve(result);
								}
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("getRedis in findAddressInCache", err).error();
								// Продолжаем дальше
								getRedis(i + 1);
							});
						// Если данные загружены полностью
						} else resolve(result);
					};
					// Выполняем загрузку данных из Redis
					getRedis();
				// Сообщаем что ничего не найдено
				} else resolve(false);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisKeys in findAddressInCache", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getGPSForAddress Функция получения gps координат для указанного адреса
	 * @param  {Object}  scheme    схема для сохранения
	 * @param  {Array}   arr       Массив с адресами для получения данных
	 * @param  {String}  address   префикс для адреса
	 * @return {Promise}           промис ответа
	 */
	const getGPSForAddress = function(scheme, arr, address){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
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
						// Ключ запроса из Redis
						const key = getKeyRedisForSubject(obj);
						// Сохраняем данные в кеше
						Agl.setRedis.call(idObj, "set", key, obj).then(callback).catch(callback);
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
			 * getAddressCache Функция извлечения данных кеша
			 * @param  {Object} obj объект данных для запроса из кеша
			 * @return {Promise}    промис содержащий объект из кеша
			 */
			const getAddressCache = function(obj){
				// Получаем идентификатор текущего объекта
				const idObj = this;
				// Создаем промис для обработки
				return (new Promise(resolve => {
					// Ключ запроса из Redis
					const key = getKeyRedisForSubject(obj);
					// Считываем данные из кеша
					Agl.getRedis.call(idObj, "get", key).then(({err, cache}) => {
						// Если данные не найдены
						if(!$.isset(cache)) cache = {};
						// Выполняем парсинг ответа
						else cache = JSON.parse(cache);
						// Выводим результат
						resolve(cache);
					// Если происходит ошибка тогда выходим
					}).catch(err => {
						// Выводим ошибку метода
						idObj.log("getRedis in getAddressCache", err).error();
						// Выходим
						resolve(false);
					});
				}));
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
					getAddressCache.call(idObj, arr[i]).then(cache => {
						// Если в объекте не найдена временная зона или gps координаты или станции метро
						if(!cache || (!$.isArray(cache.gps) || !$.isArray(cache.metro) || !$.isset(cache.timezone))){
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
									idObj.getTimezoneByGPS({lat: arr[i].lat, lng: arr[i].lng}).then(timezone => {
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
											idObj.getMetroByGPS(query).then(metro => {
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
												idObj.log("getMetroByGPS in getGPSForAddress", err).error();
												// Сохраняем данные и выходим
												updateDB(arr[i], () => getGPS(arr, i + 1));
											});
										// Сохраняем данные
										} else updateDB(arr[i], () => getGPS(arr, i + 1));
									// Если происходит ошибка тогда выходим
									}).catch(err => {
										// Выводим ошибку метода
										idObj.log("getTimezoneByGPS in getGPSForAddress", err).error();
										// Выходим
										getGPS(arr, i + 1);
									});
								// Идем дальше
								} else getGPS(arr, i + 1);
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("getRedis in getGPSForAddress", err).error();
								// Выходим
								getGPS(arr, i + 1);
							});
						// Идем дальше
						} else getGPS(arr, i + 1);
					// Если происходит ошибка тогда выходим
					}).catch(err => {
						// Выводим ошибку метода
						idObj.log("getAddressCache in getGPSForAddress", err).error();
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
	 * @param  {Object}   scheme   объект схемы базы данных
	 * @param  {Object}   err      объект с ошибкой
	 * @param  {Object}   res      объект с результатом
	 * @param  {Function} callback функция обратного вызова
	 */
	const processResultKladr = function(scheme, err, res, callback){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Если возникает ошибка тогда выводим её
		if($.isset(err) && !$.isset(res)){
			// Выводим сообщение об ошибке
			idObj.log("произошла ошибка поиска в базе Kladr", err).error();
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
			getGPSForAddress.call(idObj, scheme, res.result, address)
			.then(result => {
				// Выводим сообщение в консоль
				idObj.log(
					"получение gps координат для адреса:",
					(res.result.length ? (res.result.length > 1 ? res.result.reduce((sum, val) => {
						// Формируем строку отчета
						return ($.isString(sum) ? sum : sum.name + " " + sum.typeShort + ".")
						+ ", " + val.name + " " + val.typeShort + ".";
					}) : res.result[0].name + " " + res.result[0].typeShort + ".") : ""),
					(result.length ? "Ok" : "Not ok")
				).info();
				// Выводим результат
				callback(result);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getGPSForAddress in processResultKladr", err).error();
				// Выходим
				callback(false);
			});
		// Если данные не найдены то сообщаем об этом
		} else {
			// Выводим сообщение об ошибке
			idObj.log("адрес в базе Kladr не найден", res.searchContext).error();
			// Выводим результат
			callback(false);
		}
	};
	/**
	 * getByGPS Метод поиска данных по GPS координатам
	 * @param  {Object} scheme   схема базы данных MongoDB
	 * @param  {String} key      ключ для запроса данных из Redis
	 * @param  {Number} lat      широта
	 * @param  {Number} lng      долгота
	 * @param  {Number} distance дистанция поиска в метрах
	 * @return {Promise}         промис содержащий найденные данные
	 */
	const getByGPS = function(scheme, key, lat, lng, distance = 3000){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Ищем данные в кеше
			Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
				// Если данные в кеше сть тогда выводим их
				if($.isset(cache)) resolve(JSON.parse(cache));
				// Если данные в кеше не найдены тогда продолжаем искать
				else {
					// Выполняем поиск ближайших данных
					scheme.find({
						'gps': {
							$near: {
								$geometry: {
									type:			'Point',
									coordinates:	[lat, lng]
								},
								$maxDistance: distance
							}
						}
					// Запрашиваем данные
					}).exec((err, data) => {
						// Результат ответа
						let result = false;
						// Если ошибки нет
						if(!$.isset(err) && $.isArray(data)) result = data;
						// Выводим в консоль сообщение что данные не найдены
						else idObj.log("поиск по gps координатам не дал результатов:", "lat =", lat, "lng =", lng, err, data).error();
						// Отправляем в Redis на час
						Agl.setRedis.call(idObj, "set", key, result, 3600).then();
						// Выводим результат
						resolve(result);
					});
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedis in getByGPS", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getAddressById Функция поиска данных адресов по id
	 * @param  {Object} scheme схема базы данных MongoDB
	 * @param  {String} key    ключ для запроса данных из Redis
	 * @param  {String} id     идентификатор искомого объекта
	 * @return {Promise}       промис содержащий найденные данные
	 */
	const getAddressById = function(scheme, key, id){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Считываем данные из кеша
			getRedisByMaskKey.call(idObj, key).then(result => {
				// Если данные в кеше сть тогда выводим их
				if($.isArray(result) && result.length) resolve(result[0]);
				// Если данные в кеше не найдены тогда продолжаем искать
				else {
					// Выполняем поиск идентификатора
					scheme.findOne({"_id": id}).exec((err, data) => {
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)){
							// Ключ запроса из Redis
							const key = getKeyRedisForSubject(data);
							// Сохраняем данные в кеше
							Agl.setRedis.call(idObj, "set", key, data).then();
							// Выводим результат
							resolve(data);
						// Выводим в консоль сообщение что данные не найдены
						} else {
							// Выводим сообщение об ошибке
							idObj.log("поиск по id не дал результатов:", "id =", id, err, data).error();
							// Выводим результат
							resolve(false);
						}
					});
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisByMaskKey in getAddressById", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getDataMetroById Функция поиска данных метро по id
	 * @param  {Object} scheme схема базы данных MongoDB
	 * @param  {String} key    ключ для запроса данных из Redis
	 * @param  {String} id     идентификатор искомого объекта
	 * @return {Promise}       промис содержащий найденные данные
	 */
	const getDataMetroById = function(scheme, key, id){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Ищем данные в кеше
			getRedisByMaskKey.call(idObj, key).then(result => {
				// Если данные в кеше сть тогда выводим их
				if($.isArray(result) && result.length) resolve(result[0]);
				// Если данные в кеше не найдены тогда продолжаем искать
				else {
					// Выполняем поиск идентификатора
					scheme.findOne({"_id": id}).exec((err, data) => {
						// Результат ответа
						let result = false;
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)) result = data;
						// Выводим в консоль сообщение что данные не найдены
						else idObj.log("поиск по id не дал результатов:", "id =", id, err, data).error();
						// Генерируем ключ метро
						const key = createMetroKey({
							id:		data._id,
							key:	"metro",
							name:	data.name,
							cityId:	data.cityId,
							lineId:	data.lineId
						});
						// Отправляем в Redis на час
						Agl.setRedis.call(idObj, "set", key, result).then();
						// Выводим результат
						resolve(result);
					});
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisByMaskKey in getDataMetroById", err).error();
				// Выходим
				resolve(false);
			});
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
		static createModels(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Подключаем модель адреса
			const ModelAddress = require('../models/address');
			// Подключаем модель стран
			const ModelCountries = require('../models/countries');
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
			// Создаем модель стран
			const modelCountries = (new ModelCountries("countries")).getData();
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
			// Создаем схему стран
			const Countries = idObj.clients.mongo.model("Countries", modelCountries);
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
				Countries,
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
		 * @param  {String}   command  название комманды (get или hgetall)
		 * @param  {String}   key      ключ в базе
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат извлечения данных из базы
		 */
		static getRedis(command, key, expire = 0){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если такая комманда существует
				if($.isset(idObj.clients.redis[command])){
					// Преобразуем время жизни
					expire = parseInt(Math.ceil(parseFloat(expire)), 10);
					// Параметры запроса
					const params = [[command, key]];
					// Устанавливаем время жизни
					if($.isset(expire)) params.push(["EXPIRE", key, expire]);
					// Считываем данные кеша
					idObj.clients.redis.multi(params)
					.exec((err, cache) => resolve({
						err,
						"cache": ($.isArray(cache) && cache.length ? cache[0] : false)
					}));
				// Сообщаем что такая комманда не найдена
				} else resolve({err: "not found", cache: false});
			}));
		}
		/**
		 * setRedis Метод записи в Redis данных
		 * @param  {String}   command  комманда для редиса (hmset или set)
		 * @param  {String}   key      ключ в базе
		 * @param  {String}   value    значение для записи
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат записи данных в базу
		 */
		static setRedis(command, key, value, expire = 0){
			// Получаем идентификатор текущего объекта
			const idObj = this;
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
		 * getKeys Функция для поиска ключей
		 * @param  {String}   key ключ для поиска
		 * @return {Promise}      промис содержащий список ключей по маске
		 */
		static getRedisKeys(key){
			// Получаем идентификатор текущего объекта
			const idObj = this;
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
		}
		/**
		 * rmRedis Метод удаления из Redis данных
		 * @param  {String}   key   ключ для поиска
		 * @return {Promise}        результат удаления данных из базы
		 */
		static rmRedis(key){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Запрашиваем данные удаляемого ключа
				Agl.getRedisKeys.call(idObj, key).then(result => {
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
					idObj.log("getKeys in rmRedis", err).error();
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
				idObj.log(
					"\x1B[31m\x1B[1m\u00A9"
					.anyks_clearColor(idObj.debug.console),
					idObj.copyright, "ver.",
					idObj.version,
					"\x1B[0m"
					.anyks_clearColor(idObj.debug.console)
				).info();
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
		 * @param  {String} options.address адрес для парсинга
		 * @return {Object}                 объект ответа
		 */
		parseAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * parseNativeAddress Функция парсинга адреса с помощью базы данных
				 * @param  {String} address строка адреса для парсинга (с любыми знаками препинания)
				 * @return {Object}         объект содержащий данные адреса
				 */
				const parseDBAddress = address => {
					// Создаем промис для обработки
					return (new Promise(resolve => {
						/**
						 * searchSubject Функция поиска соответствия
						 * @param  {String} str строка адреса для поиска
						 * @param  {Array}  arr массив котором производится поиск
						 * @param  {Number} i   итератор перебора массива
						 * @return {Object}     найденный объект данных
						 */
						const searchSubject = (str, arr, i = 0) => {
							// Если массив пройден не полностью
							if(i < arr.length){
								// Формируем регулярное выражение
								let reg = new RegExp(arr[i].name, "i");
								// Проверяем соотстветствие адреса
								if(reg.test(str)){
									// Выводим найденный результат
									return {
										"id":	arr[i]._id,
										"name":	arr[i].name,
										"type":	arr[i].type,
										"src":	arr[i].name + " " + arr[i].typeShort.toLowerCase()
									};
								// Продолжаем дальше
								} else return searchSubject(str, arr, i + 1);
							// Сообщаем что ничего не найдено
							} else return false;
						};
						/**
						 * getSubject Функция извлечения данных с базы
						 * @param  {String}   str   строка в которой происходит поиск
						 * @param  {Function} func  функция для запроса данных
						 * @param  {Object}   obj   объект с параметрами запроса
						 * @param  {Number}   i     текущий индекс итерации
						 * @param  {Number}   count максимальное количество страниц
						 * @return {Promise}        промис содержащий результат поиска
						 */
						const getSubject = (str, func, obj, i = 0, count = 1) => {
							// Создаем промис для обработки
							return (new Promise(resolve => {
								// Если данные загружены не полностью, начинаем загрузку
								if(i < count){
									// Формируем параметры запроса
									let query = Object.assign({page: i, limit: 100}, obj);
									// Закачиваем первую порцию данных
									func(query).then(result => {
										// Если данные пришли
										if($.isset(result)
										&& $.isArray(result.data)
										&& result.data.length){
											// Выполняем поиск субъекта
											let subject = searchSubject(str, result.data);
											// Если субъект найден
											if($.isset(subject)){
												// Удаляем из строки адреса найденный субъект
												str = str.replace(subject.name.toLowerCase(), "");
												// Выводим результат
												resolve({str, data: subject});
											// Продолжаем загрузку дальше
											} else getSubject(str, func, obj, i + 1, result.count).then(resolve);
										// Если данные не найдены тогда перепрыгиваем этот шаг
										} else getSubject(str, func, obj, i + 1, count).then(resolve);
									// Если возникает ошибка то просто перепрыгиваем
									}).catch(() => getSubject(str, func, obj, i + 1, count).then(resolve));
								// Сообщаем что ничего не найдено
								} else resolve(false);
							}));
						};
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Строка адреса
							let str = address.toLowerCase();
							// Страна
							let country = false;
							// Регион
							let region = false;
							// Район
							let district = false;
							// Город
							let city = false;
							// Улица
							let street = false;
							// Номер дома
							let house = false;
							// Почтовый индекс
							let zip = false;
							// Текущее значение субъекта
							let subject = false;
							// Запрашиваем данные стран
							subject = yield getSubject(str, idObj.getCountries, {});
							// Если данные существуют
							if($.isset(subject)){
								// Запоминаем данные строки
								str = subject.str;
								// Запоминаем данные страны
								country = subject.data;
							}
							// Запрашиваем данные регионов
							subject = yield getSubject(str, idObj.getRegions, {});
							// Если данные существуют
							if($.isset(subject)){
								// Запоминаем данные строки
								str = subject.str;
								// Запоминаем данные региона
								region = subject.data;
							}
							// Запрашиваем данные районов
							subject = yield getSubject(str, idObj.getDistricts, {
								// Передаем идентификатор региона
								regionId: ($.isset(region) ? region.id : undefined)
							});
							// Если данные существуют
							if($.isset(subject)){
								// Запоминаем данные строки
								str = subject.str;
								// Запоминаем данные района
								district = subject.data;
							}
							// Запрашиваем данные городов
							subject = yield getSubject(str, idObj.getCities, {
								// Передаем идентификаторы
								regionId:	($.isset(region)	? region.id		: undefined),
								districtId:	($.isset(district)	? district.id	: undefined)
							});
							// Если данные существуют
							if($.isset(subject)){
								// Запоминаем данные строки
								str = subject.str;
								// Запоминаем данные города
								city = subject.data;
							}
							// Запрашиваем данные улиц
							subject = yield getSubject(str, idObj.getCities, {
								// Передаем идентификатор города
								cityId:	($.isset(city) ? city.id : undefined)
							});
							// Если данные существуют
							if($.isset(subject)){
								// Запоминаем данные строки
								str = subject.str;
								// Запоминаем данные улицы
								street = subject.data;
							}
							// Регулярное выражение для извлечения данных дома
							const regHouse = new RegExp("(?:(?:№\\s*)?\\d+[А-ЯЁ]*\\s*(?:\\/|-)\\s*\\d+[А-ЯЁ]*)|"
							+ "(?:(?:№\\s*)?(?:\\d+)[А-ЯЁ]*\\s*(?:к|с)?\\s*(?:\\d+)?\\s*(?:к|с)?\\s*(?:\\d+)?)$", "i");
							// Извлекаем номер дома
							house = regHouse.exec(str);
							// Если дом найден то запоминаем его
							if($.isArray(house) && house.length) house = house[0];
							// Устанавливаем что дом не найден
							else house = false;
							// Определяем почтовый индекс
							zip = /\d{6}/.exec(str);
							// Если почтовый индекс найден то выводим его
							if($.isArray(zip) && zip.length) zip = zip[0];
							// Устанавливаем что индекс не найден
							else zip = false;
							// Формируем массив найденных данных
							const arrAddress = [], addrLightParam = [], addrFullParam = [];
							// Формируем маску адреса
							if($.isset(zip))		arrAddress.push("{zip}");
							if($.isset(district))	arrAddress.push("{district}");
							// Добавляем в адрес страну
							if($.isset(country)){
								arrAddress.push("{country}");
								addrLightParam.push(country.name);
								addrFullParam.push(country.name.ucwords() + " " country.type.toLowerCase());
							}
							// Добавляем в адрес регион
							if($.isset(region)){
								arrAddress.push("{region}");
								addrLightParam.push(region.name);
								addrFullParam.push(region.name.ucwords() + " " region.type.toLowerCase());
							}
							// Добавляем в адрес город
							if($.isset(city)){
								arrAddress.push("{city}");
								addrLightParam.push(city.name);
								addrFullParam.push(city.name.ucwords() + " " city.type.toLowerCase());
							}
							// Добавляем в адрес улицу
							if($.isset(street)){
								arrAddress.push("{street}");
								addrLightParam.push(street.name);
								addrFullParam.push(street.name.ucwords() + " " street.type.toLowerCase());
							}
							// Добавляем в адрес дом
							if($.isset(house)){
								arrAddress.push("{house}");
								addrLightParam.push(house.name);
								addrFullParam.push(house.name.ucwords() + " " house.type.toLowerCase());
							}
							// Формируем блок результата
							const result = {
								"zip":			zip,
								"city":			city,
								"house":		house,
								"apartment":	false,
								"river":		false,
								"community":	false,
								"street":		street,
								"region":		region,
								"country":		country,
								"address":		address,
								"district":		arrAddress.join(", "),
								"fullAddress":	addrFullParam.join(", "),
								"lightAddress":	addrLightParam.join(", ")
							};
							// Выводим результат
							resolve(result);
						};
						// Запускаем коннект
						exec(getData());
					}));
				};
				/**
				 * parseNativeAddress Функция нативного парсинга строки адреса
				 * @param  {String} address строка адреса для парсинга (с разделителями в виде запятых)
				 * @return {Object}         объект содержащий данные адреса
				 */
				const parseNativeAddress = address => {
					// Создаем промис для обработки
					return (new Promise(resolve => {
						// Результат работы функции
						let result = false;
						// Регулярное выражение для поиска рек
						const regRiver = /(река)|(?:^|\s)(р(?:-ка)?)(?:\s|\.|\,|$)/i;
						// Регулярное выражение для поиска домов
						const regHouse = /(дом)|(?:\s|\.|\,|^)(дм?)(?:\s|\.|\,|$)/i;
						// Регулярное выражение для поиска стран
						const regCountry = /(страна)|(?:\s|\.|\,|^)(стр?-?н?а?)(?:\s|\.|\,|$)/i;
						// Регулярное выражение для поиска квартир
						const regApartment = /(квартира|офис|комната)|(?:\s|\.|\,|^)(кв|ко?м|оф)(?:\s|\.|\,|$)/i;
						// Регулярное выражение для поиска микрорайонов
						const regCommunity = /(микрорайон|жилой\s+комплекс)|(?:\s|\.|\,|^)(мкр|жкс?)(?:\s|\.|\,|$)/i;
						// Регулярное выражение для поиска районов
						const regDistrict = new RegExp("(район|округ|улус|поселение)|(?:\\s|\\.|\\,|^)(р-н|окр|у|п)(?:\\s|\\.|\\,|$)", "i");
						// Регулярное выражение для поиска регионов
						const regRegion = new RegExp("(авт(?:ономный|\\.)\\s+окр?(?:уг|-г)?|область|край|республика)|(?:\\s|\\.|\\,|^)(респ?|ао(?:кр?)?|обл|кр)(?:\\s|\\.|\\,|$)", "i");
						// Регулярное выражение для поиска улицы
						const regStreet = new RegExp("(улица|площадь|переулок|гора|парк|тупик|канал|шоссе|проезд|набережная|километр|вал|бульвар|квартал|"
						+ "проспект|авеню|аллея|кольцо)|(?:\\s|\\.|\\,|^)(ул|пл|пр-?к?т?|ав|алл?|б-?р|вл|кнл|кв-л|к(?:м|л)|клц|на?б|пер|пр-зд|туп|ш|гор)(?:\\s|\\.|\\,|$)", "i");
						// Регулярное выражение для поиска города
						const regCity = new RegExp("((?:пос[её]л(?:ение|ок|ки)\\s+(?:городского\\s+типа|сельского\\s+типа|и\\(при\\)\\s+станция\\(и\\)|"
						+ "(?:при|и)\\s+станци(?:и|я)))|(?:(?:рабочий|курортный|дачный)\\s+пос[её]лок)|(?:(?:поселковый|сельский|дачный\\s+поселковый)\\s+совет)|"
						+ "(?:пром(?:ышленная|\.)?\s*(?:\\s+|-)\s*зона)|(?:сельское\\s+(?:муницип(?:\\.|альное)?\\s*(?:образование|поселение)))|(?:городской\\s+округ)|"
						+ "(?:насел[её]нный\\s+пункт)|(?:железнодорож(?:ный|ная)\\s+(?:пост|станция|разъезд))|(?:почтовое\\s+отделение)|(?:жилой\\s+район)|"
						+ "(?:коллективное\\s+хозяйство)|(?:садовое\\s+неком(?:-|мерческо)е\\s+товарищество)|(?:советское\\s+хозяйство)|(?:выселки\\(ок\\))|"
						+ "ж\\/д\\s+останов\\.?\\s+\\(обгонный\\)\\s+пункт|ж\\/д\\s+(?:останов(?:\\.?|очный)|обгонный)\\s+пункт|(?:поселение|заимка|аал|"
						+ "пос[её]лок|территория|хозяйство|товарищество|зимовье|район|кишлак|поссовет|сельсовет|сомон|волость|село|местечко|аул|станица|остров|"
						+ "автодорога|квартал|починок|жилрайон|массив|деревня|слобода|станция|хутор|разъезд|колхоз|улус|выселк(?:и|ок)|микрорайон|город(?:ок)?)|"
						+ "(?:п\\.г\\.т\\.|р\\.п\\.|к\\.п\\.|д\\.п\\.|н\\.п\\.|п\\.\\s+ст\\.|п\\.ст\\.|ж\\/д\\.\\s+ст\\.|ж\\/д\\s+ст\\.))|"
						+ "(?:\\s|\\.|\\,|^)(с\\/?с|п\\/(?:о|ст)|ж\\/д(?:ст|(?:\\_|\\.|-)?\s*(?:рзд|пост|оп))|с\\/(?:мо|п)|ст(?:-|\\.)\\s*ц?а|авто-а|кв-л|ма-в|"
						+ "р-?н|св?-т|за-ка|п(?:ромзона|ос-к|ст|гт|-к|к)|с(?:вх|мн|нт|вт|т|л|в)?|п(?:о?с)?|к(?:лх|п)?|т(?:ов|ер)|р(?:зд|п)|хз?|высел|зим|мкр|"
						+ "го|нп|вл|дп|м|д|у|г)(?:\\s|\\.|\\,|$)", "i");
						// Карта объектов
						const mapSubjects = {
							"р":		"Река",
							"оф":		"Офис",
							"гор":		"Гора",
							"у":		"Улус",
							"кр":		"Край",
							"с":		"Село",
							"туп":		"Тупик",
							"ш":		"Шоссе",
							"смн":		"Сомон",
							"г":		"Город",
							"р-н":		"Район",
							"окр":		"Округ",
							"ав":		"Авеню",
							"ал":		"Аллея",
							"алл":		"Аллея",
							"кнл":		"Канал",
							"ул":		"Улица",
							"х":		"Хутор",
							"за-ка":	"Заимка",
							"стр":		"Страна",
							"пр-зд":	"Проезд",
							"кл":		"Кольцо",
							"клц":		"Кольцо",
							"ма-в":		"Массив",
							"к":		"Кишлак",
							"д":		"Деревня",
							"пл":		"Площадь",
							"кв-л":		"Квартал",
							"б-р":		"Бульвар",
							"бр":		"Бульвар",
							"ком":		"Комната",
							"обл":		"Область",
							"п-к":		"Починок",
							"пос-к":	"Посёлок",
							"сл":		"Слобода",
							"ст":		"Станция",
							"ст-ца":	"Станица",
							"рзд":		"Разъезд",
							"зим":		"Зимовье",
							"вл":		"Волость",
							"м":		"Местечко",
							"км":		"Километр",
							"кв":		"Квартира",
							"пер":		"Переулок",
							"пр":		"Проспект",
							"пр-т":		"Проспект",
							"пр-кт":	"Проспект",
							"пос":		"Поселение",
							"с/с":		"Сельсовет",
							"с-т":		"Сельсовет",
							"св-т":		"Сельсовет",
							"свт":		"Сельсовет",
							"св":		"Сельсовет",
							"хз":		"Хозяйство",
							"п":		"Поселение",
							"авто-а":	"Автодорога",
							"тер":		"Территория",
							"респ":		"Республика",
							"наб":		"Набережная",
							"нб":		"Набережная",
							"мкр":		"Микрорайон",
							"рес":		"Республика",
							"жилрайон":	"Жилой район",
							"высел":	"Выселки(ок)",
							"тов":		"Товарищество",
							"cc":		"Сельский совет",
							"жк":		"Жилой комплекс",
							"жкс":		"Жилой комплекс",
							"дп":		"Дачный посёлок",
							"р.п.":		"Рабочий посёлок",
							"рп":		"Рабочий посёлок",
							"го":		"Городской округ",
							"пс":		"Поселковый совет",
							"ао":		"Автономный округ",
							"аок":		"Автономный округ",
							"аокр":		"Автономный округ",
							"н.п.":		"Населенный пункт",
							"нп":		"Населенный пункт",
							"к.п.":		"Курортный посёлок",
							"кп":		"Курортный посёлок",
							"промзона":	"Промышленная зона",
							"с/п":		"Сельское поселение",
							"п/о":		"Почтовое отделение",
							"свх":		"Советское хозяйство",
							"п. ст.":	"Посёлок при станции",
							"п.ст.":	"Посёлок при станции",
							"пст":		"Посёлок при станции",
							"ж/д_пост":	"Железнодорожный пост",
							"клх":		"Коллективное хозяйство",
							"д.п.":		"Дачный поселковый совет",
							"ж/д. ст.":	"Железнодорожная станция",
							"ж/д ст.":	"Железнодорожная станция",
							"ж/дст":	"Железнодорожная станция",
							"п.г.т.":	"Посёлок городского типа",
							"пгт":		"Посёлок городского типа",
							"ж/д_рзд":	"Железнодорожный разъезд",
							"п/ст":		"Поселок и(при) станция(и)",
							"с/мо":		"Сельское муницип.образование",
							"снт":		"Садовое неком-е товарищество",
							"ж/д_оп":	"ж/д останов. (обгонный) пункт"
						};
						// Создаем объект с адресом
						const addObject = {address};
						/**
						 * fixAddress Функция исправления адреса
						 */
						const fixAddress = () => {
							// Исправляем адрес
							addObject.address = addObject.address
							.replace(/\./ig, ". ")
							.replace(/\s*\,/ig, ", ").anyks_trim();
						};
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
							if($.isset(zip)){
								// Заменяем название адреса
								addObject.address = addObject.address.replace(zip, "{zip}");
								// Исправляем название адреса
								fixAddress();
							}
							// Выводим результат
							return zip;
						};
						/**
						 * getCountry Функция извлечения страны
						 * @return {String}           название страны
						 */
						const getCountry = () => {
							/**
							 * findCountry Функция поиска страны
							 * @return {String} название страны
							 */
							const findCountry = () => {
								// Определяем страну
								const result = (new RegExp("^([А-ЯЁё\\-\\s]+),?\\s*\\{(?:river|zip|region|"
								+ "district|city|community|street|house|apartment)\\}", "i"))
								// Выполняем поиск страны в адресе
								.exec(addObject.address);
								// Создаем название страны
								let country = false;
								// Если это массив
								if($.isset(result) && (result.length === 2))
									// Выводим название страны
									country = result[1].anyks_trim().anyks_ucwords();
								// Заменяем в основном адресе параметры
								if($.isset(country)){
									// Запоминаем название страны
									addObject.address = addObject.address.replace(country, "{country}");
									// Исправляем название адреса
									fixAddress();
								}
								// Выводим результат
								return country;
							};
							// Получаем данные страны
							const country = getAddress(regCountry, "country");
							// Если страна найден тогда выводим ее данные
							if($.isset(country)) return country;
							// Генерируем другую страну
							else {
								// Получаем название страны
								const name = findCountry();
								// Возвращаем результат
								return ($.isset(name) ? {
									name:	name,
									type:	"Страна",
									src:	"Страна " + name
								} : false);
							}
						};
						/**
						 * getHouse Функция поиска номера дома
						 * @return {String}           номер дома
						 */
						const getHouse = () => {
							/**
							 * findHouse Функция поиска дома
							 * @return {String} название и номер дома
							 */
							const findHouse = () => {
								// Разбиваем на массив
								const arr = addObject.address.split(",").reverse();
								// Дома
								const regH1 = /(?:дом|строение|корпус|д\.|стр\.|с\.|корп\.|к\.)/i;
								// Дома второй вариант
								const regH2 = new RegExp("(?:(?:№\\s*)?\\d+[А-ЯЁ]*\\s*(?:\\/|-)\\s*\\d+[А-ЯЁ]*)|"
								+ "(?:(?:№\\s*)?(?:\\d+)[А-ЯЁ]*\\s*(?:к|с)?\\s*(?:\\d+)?\\s*(?:к|с)?\\s*(?:\\d+)?)$", "i");
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
								if(house){
									// Заменяем название дома
									addObject.address = addObject.address.replace(house, "{house}");
									// Исправляем название адреса
									fixAddress();
								}
								// Выводим номер дома
								return house;
							};
							// Получаем данные дома
							const house = getAddress(regHouse, "house");
							// Если дом найден тогда выводим его данные
							if($.isset(house)) return house;
							// Генерируем другой номер дома
							else {
								// Получаем название дома
								const name = findHouse();
								// Возвращаем результат
								return ($.isset(name) ? {
									name:	name,
									type:	"Дом",
									src:	"Дом " + name
								} : false);
							}
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
									// Получаем массив типов
									const types = val.match(reg);
									// Переходим по массиву
									types.forEach((val, i) => {
										// Если это не нулевой элемент
										if($.isset(i) && $.isset(val)){
											// Запоминаем тип адреса
											data.type = (name === "house" ? "Дом" : ($.isset(mapSubjects[val]) ? mapSubjects[val] : val));
											// Останавливаем поиск
											types.length = 0;
										}
									});
									// Извлекаем название
									data.name = val.replace(data.type, "");
									// Исправляем название и тип
									data.name = data.name.anyks_trim().anyks_ucwords();
									data.type = data.type.anyks_trim().anyks_ucwords();
									// Запоминаем значение
									data.src = val;
									// Удаляем из массива наш объект
									arr.splice(i, 1);
									// Выходим из функции
									arr.length = 0;
								}
							});
							// Заменяем в основном адресе параметры
							if(data){
								// Изменяем адрес
								addObject.address = addObject.address.replace(data.src, "{" + name + "}");
								// Исправляем название адреса
								fixAddress();
								// Запоминаем значение
								data.src = data.src.replace(/\.\s+/ig, ".");
							}
							// Выводим результат
							return data;
						};
						// Исправляем название адреса
						fixAddress();
						// Формируем блок результата
						result = {
							"region":		getAddress(regRegion, "region"),
							"district":		getAddress(regDistrict, "district"),
							"city":			getAddress(regCity, "city"),
							"street":		getAddress(regStreet, "street"),
							"apartment":	getAddress(regApartment, "apartment"),
							"river":		getAddress(regRiver, "river"),
							"community":	getAddress(regCommunity, "community"),
							"house":		getHouse(),
							"zip":			getZip(),
							"country":		getCountry(),
							"address":		addObject.address.replace(/\./g, "").anyks_trim()
						};
						// Формируем массив найденных данных
						const arrParamAddress = [], addrLightParam = [], addrFullParam = [];
						// Добавляем в массив найденные данные
						if($.isset(result.country))		arrParamAddress.push(result.country);
						if($.isset(result.region))		arrParamAddress.push(result.region);
						if($.isset(result.city))		arrParamAddress.push(result.city);
						if($.isset(result.street))		arrParamAddress.push(result.street);
						if($.isset(result.house))		arrParamAddress.push(result.house);
						if($.isset(result.apartment))	arrParamAddress.push(result.apartment);
						// Создаем адреса в строковом виде
						arrParamAddress.forEach(val => {
							// Создаем адреса в простом виде
							addrLightParam.push(val.name);
							// Создаем адреса в полном виде
							addrFullParam.push(val.name + " " + val.type.toLowerCase());
						});
						// Добавляем в массив результаты строковых адресов
						result.lightAddress	= addrLightParam.join(", ");
						result.fullAddress	= addrFullParam.join(", ");
						// Выводим результат
						resolve(result);
					}));
				};
				// Если запятые найдены
				if(/\,/i.test(address)){
					// Выводим результат
					parseNativeAddress(address).then(result => {
						// Выводим в консоль результат
						idObj.log("строка адреса интерпретирована", result).info();
						// Выводим результат
						resolve(result);
					// Если возникает ошибка то просто выходим
					}).catch(e => {
						// Выводим в консоль возникшую ошибку
						idObj.log("парсинг адреса нативным методом", e, address).error();
						// Выходим
						resolve(false);
					});
				// Если запятые в адресе не найдены тогда выполняем интерпретацию с помощью базы
				} else {
					// Выводим результат
					parseDBAddress(address).then(result => {
						// Выводим в консоль результат
						idObj.log("строка адреса интерпретирована", result).info();
						// Выводим результат
						resolve(result);
					// Если возникает ошибка то просто выходим
					}).catch(e => {
						// Выводим в консоль возникшую ошибку
						idObj.log("парсинг адреса нативным методом", e, address).error();
						// Выходим
						resolve(false);
					});
				}
			}));
		}
		/**
		 * findCountry Метод поиска страны
		 * @param  {String}  options.str      строка запроса
		 * @param  {Number}  options.limit    количество результатов к выдаче
		 * @param  {Boolean} options.noCache  отключить кеш
		 * @return {Promise}                  промис результата
		 */
		findCountry({str, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'country';
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, null, null, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Формируем данные страны
						const res = [{
							"id":			"7",
							"name":			"Россия",
							"type":			"Страна",
							"typeShort":	"ст-а",
							"contentType":	"country",
							"nameFull":		"Российская Федерация",
							"nameShort":	"РФ"
						}];
						// Выполняем обработку данных
						processResultKladr.call(idObj, "Countries", err, res, resolve);
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findCountry", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findRegion Метод поиска региона
		 * @param  {String}  options.str      строка запроса
		 * @param  {Number}  options.limit    количество результатов к выдаче
		 * @param  {Boolean} options.noCache  отключить кеш
		 * @return {Promise}                  промис результата
		 */
		findRegion({str, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'region';
				const WithParent	= 0;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, null, null, Limit).then(result => {
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
							processResultKladr.call(idObj, "Regions", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findRegion", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findDistrict Метод поиска района
		 * @param  {String}  options.str        строка запроса
		 * @param  {String}  options.regionId   идентификатор региона
		 * @param  {Number}  options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache    отключить кеш
		 * @return {Promise}                    промис результата
		 */
		findDistrict({str, regionId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'district';
				const ParentType	= ($.isset(regionId) ? 'region' : undefined);
				const ParentId		= ($.isset(regionId) ? regionId : undefined);
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
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
							processResultKladr.call(idObj, "Districts", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findDistrict", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findCity Метод поиска города
		 * @param  {String}  options.str        строка запроса
		 * @param  {String}  options.regionId   идентификатор региона
		 * @param  {String}  options.districtId идентификатор района
		 * @param  {Number}  options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache    отключить кеш
		 * @return {Promise}                    промис результата
		 */
		findCity({str, regionId, districtId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
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
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
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
							processResultKladr.call(idObj, "Cities", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findCity", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findStreet Метод поиска улицы
		 * @param  {String} options.str        строка запроса
		 * @param  {String} options.cityId     идентификатор города
		 * @param  {Number} options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache   отключить кеш
		 * @return {Promise}                   промис результата
		 */
		findStreet({str, cityId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'street';
				const ParentType	= 'city';
				const ParentId		= cityId;
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
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
							processResultKladr.call(idObj, "Streets", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findStreet", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findHouse Метод поиска дома
		 * @param  {String} options.str        строка запроса
		 * @param  {String} options.streetId   идентификатор улицы
		 * @param  {Number} options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache   отключить кеш
		 * @return {Promise}                   промис результата
		 */
		findHouse({str, streetId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'building';
				const ParentType	= 'street';
				const ParentId		= streetId;
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
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
							processResultKladr.call(idObj, "Houses", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findHouse", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findMetro Метод поиска станции метро
		 * @param  {String} options.str       строка запроса
		 * @param  {String} options.cityId    идентификатор города
		 * @param  {String} options.lineId    идентификатор линии метро
		 * @param  {String} options.lineName  название линии метро
		 * @param  {String} options.lineColor цвет линии метро
		 * @param  {Number} options.limit     количество результатов к выдаче
		 * @return {Promise}                  промис результата
		 */
		findMetro({str, cityId, lineId, lineName, lineColor, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключа кеша метро
				const key = createMetroKey({
					name:	str,
					key:	"metro",
					cityId:	($.isset(cityId) ? cityId : "*"),
					lineId:	($.isset(lineId) ? lineId : "*")
				});
				// Ищем станции в кеше
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные есть в кеше
					if($.isArray(result) && result.length){
						// Если полученные данные превышают размер лимита тогда уменьшаем размед данных
						if(result.length > limit) result.length = limit;
						// Выводим результат
						resolve(result);
					// Если данные в кеше не найдены
					} else {
						/**
						 * getStations Функция поиска станций метро в базе
						 * @param  {String} str    чать названия станции метро
						 * @param  {String} cityId идентификатор города
						 * @param  {String} lineId идентификатор линии
						 * @return {Promise}       промис содержащий результаты найденных станций метро
						 */
						const getStations = (str, cityId, lineId) => {
							// Создаем промис для обработки
							return (new Promise(resolve => {
								// Параметры запроса
								const query = {"name": new RegExp("^" + str, "i")};
								// Если идентификатор города передан
								if($.isset(cityId)) query.cityId = cityId;
								// Если идентификатор линии передан
								if($.isset(lineId)) query.lineId = lineId;
								// Запрашиваем все данные из базы
								idObj.schemes.Metro_stations.find(query)
								.populate('cityId')
								.populate('lineId')
								.limit(limit)
								.exec((err, data) => {
									// Выводим результат поиска по базе
									idObj.log("поиск станций метро в базе", data).info();
									// Если ошибки нет, выводим результат
									if(!$.isset(err) && $.isArray(data)) resolve(data);
									// Если данные не найдены выводим как есть
									else resolve(false);
								});
							}));
						};
						/**
						 * getStation Функция поиска линий метро в базе
						 * @param  {String} lineId    идентификатор линии
						 * @param  {String} cityId    идентификатор города
						 * @param  {String} lineName  название линии метро
						 * @param  {String} lineColor цвет линии метро
						 * @return {Promise}          промис содержащий результаты найденных линий метро
						 */
						const getLine = (lineId, cityId, lineName, lineColor) => {
							// Создаем промис для обработки
							return (new Promise(resolve => {
								// Параметры запроса
								const query = {};
								// Если идентификатор города передан
								if($.isset(cityId)) query.cityId = cityId;
								// Если идентификатор линии передан
								if($.isset(lineId)) query._id = lineId;
								// Если название линии передано
								if($.isset(lineName)) query.name = new RegExp("^" + lineName, "i");
								// Если цвет линии передан
								if($.isset(lineColor)) query.color = lineColor;
								// Запрашиваем все данные из базы
								idObj.schemes.Metro_lines.find(query).exec((err, data) => {
									// Выводим результат поиска по базе
									idObj.log("поиск линий метро в базе", data).info();
									// Если ошибки нет, выводим результат
									if(!$.isset(err) && $.isArray(data)) resolve(data);
									// Если данные не найдены выводим как есть
									else resolve(false);
								});
							}));
						};
						/**
						 * *getData Генератор для получения данных метро
						 */
						const getData = function * (){
							/**
							 * parseDataMetro Функция обработки данных метро
							 * @param  {Array} metro массив станций метро
							 */
							const parseDataMetro = metro => {
								// Массив метро
								const metro_stations = [];
								// Переходим по всем полученным станциям метро
								metro.forEach(val => {
									// Формируем объект со станцией метро
									const station = {
										id:		val._id,
										name:	val.name,
										lat:	val.lat,
										lng:	val.lng,
										order:	val.order,
										line:	val.lineId.name,
										color:	val.lineId.color,
										city:	val.cityId.name
									};
									// Формируем массив станций метро
									metro_stations.push(station);
									// Ключа кеша метро
									const key = createMetroKey({
										id:		val._id,
										key:	"metro",
										name:	val.name,
										cityId:	val.cityId._id,
										lineId:	val.lineId._id
									});
									// Записываем данные в кеш
									Agl.setRedis.call(idObj, "set", key, station).then();
								});
								// Выводим полученный массив метро
								resolve(metro_stations);
							};
							// Если идентификатор города или идентификатор линии найден
							if($.isset(cityId) || $.isset(lineId)){
								// Запрашиваем данные станции метро
								const metro = yield getStations(str, cityId, lineId);
								// Формируем массив метро
								if($.isArray(metro)) parseDataMetro(metro);
								// Сообщаем что станции метро не найдены
								else resolve(false);
							// Если же передано название линии или цвет линии
							} else if($.isset(lineName) || $.isset(lineColor)) {
								// Запрашиваем данные станции
								const lines = yield getLine(lineId, cityId, lineName, lineColor);
								// Если линии найдены
								if($.isArray(lines)){
									// Массив метро
									const metro = [];
									// Рекурсивная функция получения станций метро
									const getMetro = (i = 0) => {
										// Если не все данные загружены тогда продолжаем загрузку
										if(i < lines.length){
											// Загружаем станции метро
											getStations(lines[i].name, lines[i].cityId, lines[i].lineId)
											.then(data => {
												// Если данные существуют
												if($.isArray(data)) metro.push(data[0]);
												// Продолжаем дальше
												getMetro(i + 1);
											}).catch(() => getMetro(i + 1));
										// Обрабатываем полученные данные
										} else parseDataMetro(metro);
									};
									// Выполняем загрузку станций метро
									getMetro();
								// Сообщаем что станции метро не найдены
								} else resolve(false);
							}
						};
						// Запускаем коннект
						exec(getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in findMetro", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findNearStationsMetroByIds Метод поиска ближайших станций метро к каждому из метро
		 * @param  {Array} options.ids массив идентификаторов станций метро
		 * @return {Promise}           промис результата
		 */
		findNearStationsMetroByIds({ids}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Массив с данными метро
					const metro_stations = [];
					// Перебираем все станции метро
					for(let i = 0; i < ids.length; i++){
						// Запрашиваем данные метро
						const metro = yield idObj.findMetroById({id: ids[i]});
						// Получаем ближайшие станции метро
						const stations = yield idObj.getMetroByGPS({lat: metro.lat, lng: metro.lng});
						// Добавляем в массив данные метро
						metro_stations.push({
							metro,
							near: stations
						});
					}
					// Выводим результат
					resolve(metro_stations);
				};
				// Запускаем коннект
				exec(getData());
			}));
		}
		/**
		 * findMetroById Метод поиска станции метро по Id
		 * @param  {String} options.id  идентификатор станции метро
		 * @return {Promise}            промис результата
		 */
		findMetroById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключа кеша метро
				const key = createMetroKey({
					id,
					key:	"metro",
					cityId:	"*",
					lineId:	"*"
				});
				// Ищем станции в кеше
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные есть в кеше
					if($.isArray(result) && result.length) resolve(result[0]);
					// Если в кеше данные метро не найдены
					else {
						// Запрашиваем все данные из базы
						idObj.schemes.Metro_stations.findOne({_id: id})
						.populate('cityId')
						.populate('lineId')
						.exec((err, data) => {
							// Выводим результат поиска по базе
							idObj.log("поиск станций метро в базе", data).info();
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isset(data)){
								// Формируем объект со станцией метро
								const station = {
									id:		data._id,
									name:	data.name,
									lat:	data.lat,
									lng:	data.lng,
									order:	data.order,
									line:	data.lineId.name,
									color:	data.lineId.color,
									city:	data.cityId.name
								};
								// Ключа кеша метро
								const key = createMetroKey({
									id:		data._id,
									key:	"metro",
									name:	data.name,
									cityId:	data.cityId._id,
									lineId:	data.lineId._id
								});
								// Записываем данные в кеш
								Agl.setRedis.call(idObj, "set", key, station).then();
								// Выводим результат
								resolve(station);
							// Если данные не найдены выводим как есть
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in findMetroById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findMetroByStreetId Метод поиска станций метро по Id улицы
		 * @param  {String} options.id  идентификатор улицы
		 * @return {Promise}            промис результата
		 */
		findMetroByStreetId({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Получаем данные улицы
					const street = yield idObj.getStreetById({id});
					// Если улицы найдена и в ней есть станции метро
					if($.isset(street) && $.isArray(street.metro) && street.metro.length){
						// Массив с данными метро
						const metro_stations = [];
						// Перебираем все станции метро
						for(let i = 0; i < street.metro.length; i++){
							// Запрашиваем данные метро
							const metro = yield idObj.findMetroById({id: street.metro[i]});
							// Если метро найдено то добавляем его в массив
							if($.isset(metro)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что такие данные не найдены
					} else resolve(false);
				};
				// Запускаем коннект
				exec(getData());
			}));
		}
		/**
		 * findMetroByHouseId Метод поиска станций метро по Id дома
		 * @param  {String} options.id  идентификатор дома
		 * @return {Promise}            промис результата
		 */
		findMetroByHouseId({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Получаем данные улицы
					const house = yield idObj.getHouseById({id});
					// Если дом найден и рядом есть станции метро
					if($.isset(house) && $.isArray(house.metro) && street.metro.length){
						// Массив с данными метро
						const metro_stations = [];
						// Перебираем все станции метро
						for(let i = 0; i < house.metro.length; i++){
							// Запрашиваем данные метро
							const metro = yield idObj.findMetroById({id: house.metro[i]});
							// Если метро найдено то добавляем его в массив
							if($.isset(metro)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что такие данные не найдены
					} else resolve(false);
				};
				// Запускаем коннект
				exec(getData());
			}));
		}
		/**
		 * findAddress Метод поиска данных по строковым данным адреса
		 * @param  {String} options.address адрес для поиска
		 * @return {Promise}                промис содержащий результат поиска
		 */
		findAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша адреса
				const key = "address:" + idObj.generateKey(address);
				// Ищем данные в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные в кеше сть тогда выводим их
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						// Выполняем интерпретацию данных
						idObj.parseAddress({address}).then(address => {
							// Если адрес интерпретирован удачно
							if($.isset(address)){
								/**
								 * getDataInMongoDB Функция запроса данных из базы
								 * @param  {Object} scheme объект схемы базы данных
								 * @param  {Object} query  объект с параметрами запроса
								 * @return {Promise}       промис с результатами данных из базы
								 */
								const getDataInMongoDB = (scheme, query) => {
									// Создаем промис для обработки
									return (new Promise(resolve => {
										// Преобразуем схему базы
										scheme = idObj.schemes[scheme];
										// Запрашиваем все данные из базы
										scheme.findOne(query).exec((err, data) => {
											// Выводим результат поиска по базе
											idObj.log("поиск данных в базе", data).info();
											// Если ошибки нет, выводим результат
											if(!$.isset(err) && $.isset(data)) resolve(data);
											// Если данные не найдены выводим как есть
											else resolve(false);
										});
									}));
								};
								/**
								 * *getData Генератор для получения данных адреса
								 */
								const getData = function * (){
									// Формируем параметры запроса
									let query = ($.isset(address.country) ? {name: address.country.name} : {});
									// Запрашиваем данные страны
									const country = ($.isset(address.country) ? yield getDataInMongoDB("Countries", query) : undefined);
									// Формируем параметры запроса
									if($.isset(address.region)) query.name = address.region.name;
									// Если страна найдена тогда ее тоже добавляем в запрос
									if($.isset(country)) query.code = country.code;
									// Запрашиваем данные региона
									const region = ($.isset(address.region) ? yield getDataInMongoDB("Regions", query) : undefined);
									// Формируем параметры запроса
									if($.isset(address.district)) query.name = address.district.name;
									// Если регион найден тогда его тоже добавляем в запрос
									if($.isset(region)) query.regionId = region._id;
									// Запрашиваем данные района
									const district = ($.isset(address.district) ? yield getDataInMongoDB("Districts", query) : undefined);
									// Формируем параметры запроса
									if($.isset(address.city)) query.name = address.city.name;
									// Если район найден тогда его тоже добавляем в запрос
									if($.isset(district)) query.districtId = district._id;
									// Запрашиваем данные города
									const city = ($.isset(address.city) ? yield getDataInMongoDB("Cities", query) : undefined);
									// Формируем параметры запроса
									if($.isset(address.street)) query.name = address.street.name;
									// Если город найден тогда его тоже добавляем в запрос
									if($.isset(city)) query.cityId = city._id;
									// Запрашиваем данные улицы
									const street = ($.isset(address.street) ? yield getDataInMongoDB("Streets", query) : undefined);
									// Формируем параметры запроса
									if($.isset(address.house)) query.name = address.house.name;
									// Если улица найдена тогда её тоже добавляем в запрос
									if($.isset(street)) query.streetId = street._id;
									// Запрашиваем данные дома
									const house = ($.isset(address.house) ? yield getDataInMongoDB("Houses", query) : undefined);
									// Формируем объект с результатами поиска
									const result = {country, region, district, city, street, house};
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, result, 3600).then();
									// Формируем объект для генерации ключа
									const obj = ($.isset(house) ? house : ($.isset(street) ? street :
									($.isset(city) ? city : ($.isset(district) ? district :
									($.isset(region) ? region : ($.isset(country) ? country : false))))));
									// Если объект существует тогда генерируем ключ
									if($.isset(obj)){
										// Генерируем ключ
										const key = getKeyRedisForSubject(obj);
										// Записываем данные в кеш
										Agl.setRedis.call(idObj, "set", key, obj).then();
									}
									// Выводим результат
									resolve(result);
								};
								// Запускаем коннект
								exec(getData());
							// Сообщаем что ничего не найдено
							} else resolve(false);
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log("parseAddress in findAddress", err).error();
							// Выходим
							resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in findAddress", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintCountries Метод вывода подсказок для стран
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintCountries({str}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "country", "*", "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintCountries", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintRegions Метод вывода подсказок для регионов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintRegions({str}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "region", "*", "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintRegions", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintDistricts Метод вывода подсказок для районов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintDistricts({str, regionId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "district", regionId, "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintDistricts", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintCities Метод вывода подсказок для городов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintCities({str, regionId, districtId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Определяем идентификатор
				const id = ($.isset(regionId) ? regionId : ($.isset(districtId) ? districtId : undefined));
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "city", id , "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintCities", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintStreets Метод вывода подсказок для улиц
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintStreets({str, cityId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "street", cityId , "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintStreets", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintHouses Метод вывода подсказок для домов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintHouses({str, streetId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "house", streetId , "*", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintHouses", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintMetro Метод вывода подсказок для метро
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintMetro({str, streetId, houseId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных адресов
				 */
				const getData = function * (){
					// Запрашиваем данные улицы
					const street = ($.isset(streetId) ? yield idObj.getStreetById({id: streetId}) : false);
					// Запрашиваем данные дома
					const house = ($.isset(houseId) ? yield idObj.getHouseById({id: houseId}) : false);
					// Определяем субъект
					const subject = ($.isset(street) ? street : ($.isset(house) ? house : false));
					// Получаем станции метро
					if($.isArray(subject.metro) && subject.metro.length){
						// Массив метро
						let metro_stations = [];
						// Переходим по всем станциям метро
						for(let i = 0; i < subject.metro.length; i++){
							// Загружаем станцию метро
							let metro = yield idObj.getMetroStationById({id: subject.metro[i]});
							// Создаем регулярное выражение для поиска
							let reg = new RegExp("^" + str, "i");
							// Добавляем станцию в список
							if(reg.test(metro.name)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что ничего не найдено
					} else resolve([]);
				};
				// Запускаем коннект
				exec(getData());
			}));
		}
		/**
		 * getAddressByGPS Метод получения данных адреса по GPS координатам
		 * @param  {Float}   options.lat    широта
		 * @param  {Float}   options.lng    долгота
		 * @return {Promise}                промис содержащий объект с адресом
		 */
		getAddressByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша адреса
				const key = "address:gps:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
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
								parseAnswerGeoCoder.call(idObj, obj).then(result => {
									// Выводим сообщение об удачном приведении типов
									idObj.log("приведение типов выполнено", result).info();
									// Сохраняем результат в базу данных
									if(result) (new idObj.schemes.Address(result)).save();
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, result, 3600).then();
									// Выводим результат
									resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log("parseAnswerGeoCoder in getAddressByGPS", err).error();
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log("выполняем запрос с геокодера,", "lat =", lat + ",", "lng =", lng).info();
								// Выполняем запрос с геокодера Yandex
								const yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с yandex api', err).error()
								);
								// Выполняем запрос с геокодера Google
								const google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с google api', err).error()
								) : false);
								// Выполняем запрос с геокодера OpenStreet Maps
								const osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm api', err).error()
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} : false))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log(
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm ? "Ok" : "Not")
								).info();
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
					idObj.log("getRedis in getAddressByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getAddressFromString Метод получения данных адреса по строке
		 * @param  {String}   options.address строка запроса
		 * @return {Promise}                  промис содержащий объект с адресом
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
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * getDataFromGeocoder Функция запроса данных с геокодера
						 */
						const getDataFromGeocoder = (address, osmAddress) => {
							// Подключаем модуль закачки данных
							const fetch = require('node-fetch');
							// Массив с геокодерами
							const urlsGeo = [
								'http://geocode-maps.yandex.ru/1.x/?format=json&geocode=$address',
								'http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false&language=ru',
								'http://nominatim.openstreetmap.org/search?q=$address&format=json&addressdetails=1&limit=1'
							].map(val => val.replace("$address", encodeURI(address)));
							// Заменяем адрес OSM если он существует
							if($.isset(osmAddress)) urlsGeo[2].replace(encodeURI(address), encodeURI(osmAddress));
							// Получаем объект запроса с геокодера
							const init = obj => {
								// Выполняем обработку результата геокодера
								parseAnswerGeoCoder.call(idObj, obj).then(result => {
									// Выводим сообщение об удачном приведении типов
									idObj.log("приведение типов выполнено", result).info();
									// Сохраняем результат в базу данных
									if(result) (new idObj.schemes.Address(result)).save();
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, result, 3600).then();
									// Выводим результат
									resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log("parseAnswerGeoCoder in getAddressFromString", err).error();
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log("выполняем запрос с геокодера,", "address =", address).info();
								// Выполняем запрос с геокодера Yandex
								const yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с yandex api', err).error()
								);
								// Выполняем запрос с геокодера Google
								const google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с google api', err).error()
								) : false);
								// Выполняем запрос с геокодера OpenStreet Maps
								const osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm api', err).error()
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} : false))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log(
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm ? "Ok" : "Not")
								).info();
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
								// Флаг проверки искать ли данные или нет
								let flag = true;
								// Проверяем какие пришли данные
								if(($.isset(result.region) || $.isset(result.district))
								&& ($.isset(result.street) || $.isset(result.house) || $.isset(result.apartment))
								&& (!$.isset(result.city) || !$.isset(result.street) || /[А-ЯЁ]/i.test(result.address))) flag = false;
								// Если флаг активирован
								if(flag){
									// Параметры запроса
									const query = {};
									// Создаем параметры запроса
									if($.isset(result.district))	query["address.district"]	= (new RegExp(result.district.name, "i"));
									if($.isset(result.city))		query["address.city"]		= (new RegExp(result.city.name, "i"));
									if($.isset(result.region))		query["address.region"]		= (new RegExp(result.region.name, "i"));
									if($.isset(result.street))		query["address.street"]		= (new RegExp(result.street.name, "i"));
									// Запрашиваем все данные из базы
									idObj.schemes.Address.findOne(query).exec((err, data) => {
										// Выводим результат поиска по базе
										idObj.log("поиск адреса в базе", data).info();
										// Если ошибки нет, выводим результат
										if(!$.isset(err) && $.isset(data)
										&& $.isObject(data)) resolve(data);
										// Продолжаем дальше если данные не найдены
										else getDataFromGeocoder(address, result.lightAddress);
									});
								// Продолжаем дальше если данные не найдены
								} else getDataFromGeocoder(address, result.lightAddress);
							// Продолжаем дальше
							} else getDataFromGeocoder(address);
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log("parseAddress in getAddressFromString", err).error();
							// Выходим
							getDataFromGeocoder(address);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getAddressFromString", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountries Метод получения списка стран
		 * @param  {Number}  options.page  номер страницы для запроса
		 * @param  {Number}  options.limit количество результатов к выдаче
		 * @return {Promise}               промис результата
		 */
		getCountries({page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({key: "subjects", type: "country"});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные пришли, выводим результат
					if($.isArray(result) && result.length){
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						resolve({
							page,
							limit,
							count:	result.length,
							data:	result.splice(page * limit, limit)
						});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Запрашиваем все данные из базы
						idObj.schemes.Countries.find({})
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Countries.count({}, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else resolve({data, page, limit, count});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getCountries", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegions Метод получения списка регионов
		 * @param  {String}  options.type  тип региона (область, край, республика, автономный округ)
		 * @param  {Number}  options.page  номер страницы для запроса
		 * @param  {Number}  options.limit количество результатов к выдаче
		 * @return {Promise}               промис результата
		 */
		getRegions({type, page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({key: "subjects", type: "region"});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(data => {
					// Если данные пришли, выводим результат
					if($.isArray(data) && data.length){
						// Результат поиска данных
						let result = [];
						// Если тип данных указан
						if($.isset(type)){
							// Переходим по всему массиву и ищем в нем тип искомого региона
							data.forEach(val => {
								// Если тип найден то добавляем его в массив
								if(val.type === type.anyks_ucwords()) result.push(val);
							});
						// Иначе просто приравниваем массив
						} else result = data;
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						resolve({
							page,
							limit,
							count:	result.length,
							data:	result.splice(page * limit, limit)
						});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Формируем параметры запроса
						const query = {};
						// Если тип передан
						if($.isset(type)) query.type = type.anyks_ucwords();
						// Запрашиваем все данные из базы
						idObj.schemes.Regions.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Regions.count(query, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else resolve({data, page, limit, count});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getRegions", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistricts Метод получения списка районов
		 * @param  {String}  options.regionId  идентификатор региона
		 * @param  {String}  options.type      тип района (район, округ)
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getDistricts({regionId, type, page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({
					key:		"subjects",
					type:		"district",
					parentId:	regionId,
					parentType:	($.isset(regionId) ? "region" : null)
				});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(data => {
					// Если данные пришли, выводим результат
					if($.isArray(data) && data.length){
						// Результат поиска данных
						let result = [];
						// Если тип данных указан
						if($.isset(type)){
							// Переходим по всему массиву и ищем в нем тип искомого региона
							data.forEach(val => {
								// Если тип найден то добавляем его в массив
								if(val.type === type.anyks_ucwords()) result.push(val);
							});
						// Иначе просто приравниваем массив
						} else result = data;
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						resolve({
							page,
							limit,
							count:	result.length,
							data:	result.splice(page * limit, limit)
						});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Формируем параметры запроса
						const query = {};
						// Если регион или тип переданы
						if($.isset(type))		query.type		= type.anyks_ucwords();
						if($.isset(regionId))	query.regionId	= regionId;
						// Запрашиваем все данные из базы
						idObj.schemes.Districts.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Districts.count(query, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else resolve({data, page, limit, count});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getDistricts", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCities Метод получения списка городов
		 * @param  {String}  options.regionId    идентификатор региона
		 * @param  {String}  options.districtId  идентификатор района
		 * @param  {String}  options.type        тип города (деревня, село, город)
		 * @param  {Number}  options.page        номер страницы для запроса
		 * @param  {Number}  options.limit       количество результатов к выдаче
		 * @return {Promise}                     промис результата
		 */
		getCities({regionId, districtId, type, page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:cities:" + idObj.generateKey(
					regionId + ":" +
					districtId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если регион или район передан
						if($.isset(type))		query.type			= type.anyks_ucwords();
						if($.isset(regionId))	query.regionId		= regionId;
						if($.isset(districtId))	query.districtId	= districtId;
						// Запрашиваем все данные из базы
						idObj.schemes.Cities.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Cities.count(query, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else {
										// Формируем объект
										const obj = {data, page, limit, count};
										// Отправляем в Redis на час
										Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
										// Выводим результат
										resolve(obj);
									}
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getCities", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreets Метод получения списка улиц
		 * @param  {String}  options.cityId    идентификатор города
		 * @param  {String}  options.type      тип улицы (улица, площадь, проспект)
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getStreets({cityId, type, page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:streets:" + idObj.generateKey(
					cityId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если город передан
						if($.isset(type))	query.type		= type.anyks_ucwords();
						if($.isset(cityId))	query.cityId	= cityId;
						// Запрашиваем все данные из базы
						idObj.schemes.Streets.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Streets.count(query, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else {
										// Формируем объект
										const obj = {data, page, limit, count};
										// Отправляем в Redis на час
										Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
										// Выводим результат
										resolve(obj);
									}
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getStreets", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHouses Метод получения списка домов
		 * @param  {String}  options.streetId  идентификатор улицы
		 * @param  {String}  options.type      тип постройки
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getHouses({streetId, type, page = 0, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:houses:" + idObj.generateKey(
					streetId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если улица передана
						if($.isset(type))		query.type		= type.anyks_ucwords();
						if($.isset(streetId))	query.streetId	= streetId;
						// Запрашиваем все данные из базы
						idObj.schemes.Houses.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Houses.count(query, (err, count) => {
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)){
										// Выводим сообщение
										idObj.log("чтение из базы данных", err).error();
										// Сообщаем что ничего не найдено
										resolve(false);
									// Выводим результат
									} else {
										// Формируем объект
										const obj = {data, page, limit, count};
										// Отправляем в Redis на час
										Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
										// Выводим результат
										resolve(obj);
									}
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getHouses", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountryById Метод поиска страны по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getCountryById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({key: "subjects", type: "country", id});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Countries", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getCountryById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegionById Метод поиска региона по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getRegionById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({key: "subjects", type: "region", id});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Regions", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getRegionById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistrictById Метод поиска района по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getDistrictById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					type:		"district",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Districts", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getDistrictById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCityById Метод поиска города по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getCityById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					type:		"city",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Cities", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getCityById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreetById Метод поиска улицы по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getStreetById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					type:		"street",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Streets", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getStreetById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHouseById Метод поиска дома по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getHouseById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					type:		"house",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Houses", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getHouseById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroStationById Метод поиска станции метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroStationById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = createMetroKey({
					id,
					key:	"metro",
					cityId:	"*",
					lineId:	"*"
				});
				// Ищем станцию метро в базе
				getDataMetroById.call(idObj, "ModelMetro_stations", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroStationById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroLineById Метод поиска линии метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroLineById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = createMetroKey({key: "metro", cityId: "*", lineId: id});
				// Ищем линию метро в базе
				getDataMetroById.call(idObj, "ModelMetro_lines", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroLineById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroCityById Метод поиска города метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroCityById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = createMetroKey({key: "metro", cityId: id, lineId: "*"});
				// Ищем город в котором есть метро в базе
				getDataMetroById.call(idObj, "ModelMetro_cities", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroCityById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getTimezoneByGPS Метод получения данных временной зоны по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий данные временной зоны
		 */
		getTimezoneByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "timezone:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
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
								Agl.setRedis.call(idObj, "set", key, json, 3600).then();
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
							err => idObj.log("get timezone", err).error()
						// Обрабатываем полученные данные
						).then(getData, err => idObj.log("parse timezone", err).error())
						// Если происходит ошибка тогда выходим
						.catch(err => {
							// Ошибка метода getTimezoneByGPS
							idObj.log("getTimezoneByGPS", err).error();
							// Сообщаем что дальше некуда
							resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getTimezoneByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountriesByGPS Метод поиска стран по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные регионы
		 */
		getCountriesByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша стран
				const key = "address:countries:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем страны
				getByGPS.call(idObj, "Countries", key, lat, lng, distance)
				// Выполняем поиск стран
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getCountriesByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegionsByGPS Метод поиска регионов по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные регионы
		 */
		getRegionsByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша регионов
				const key = "address:regions:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем регионы
				getByGPS.call(idObj, "Regions", key, lat, lng, distance)
				// Выполняем поиск регионов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getRegionsByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistrictsByGPS Метод поиска районов по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные районы
		 */
		getDistrictsByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша районов
				const key = "address:districts:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем районы
				getByGPS.call(idObj, "Districts", key, lat, lng, distance)
				// Выполняем поиск районов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getDistrictsByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCitiesByGPS Метод поиска городов по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные города
		 */
		getCitiesByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша городов
				const key = "address:cities:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем города
				getByGPS.call(idObj, "Cities", key, lat, lng, distance)
				// Выполняем поиск городов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getCitiesByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreetsByGPS Метод поиска улиц по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные улицы
		 */
		getStreetsByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша улиц
				const key = "address:streets:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем улицы
				getByGPS.call(idObj, "Streets", key, lat, lng, distance)
				// Выполняем поиск улиц
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getStreetsByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHousesByGPS Метод поиска домов по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные дома
		 */
		getHousesByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша домов
				const key = "address:houses:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем дома
				getByGPS.call(idObj, "Houses", key, lat, lng, distance)
				// Выполняем поиск домов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getHousesByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroByGPS Метод поиска метро по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные станции метро
		 */
		getMetroByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "metro:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем станции в кеше
				getByGPS.call(idObj, "Metro_stations", key, lat, lng, distance)
				// Выполняем поиск домов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getMetroByGPS", err).error();
					// Выходим
					resolve(false);
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
				const updateDB = (scheme, obj, callback) => {
					/**
					 * Функция сохранения данных в кеше saveCache
					 */
					const saveCache = () => {
						// Ключ запроса
						const key = getKeyRedisForSubject(obj);
						// Сохраняем данные в кеше
						Agl.setRedis.call(idObj, "set", key, obj).then(callback).catch(callback);
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
										idObj.getTimezoneByGPS({lat: data[i].lat, lng: data[i].lng}).then(timezone => {
											// Если временная зона пришла
											if(timezone){
												// Сохраняем временную зону
												data[i].timezone = timezone;
												// Сохраняем временную зону
												updateDB(scheme, data[i], () => getData(i + 1));
											// Просто продолжаем дальше
											} else getData(i + 1);
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log("getTimezoneByGPS in updateTimeZones", err).error();
											// Выходим
											getData(i + 1);
										});
									// Если все загружено тогда сообщаем об этом
									} else {
										// Выводим в консоль сообщение
										idObj.log("все временные зоны установлены!").info();
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
					idObj.log("все временные зоны обновлены удачно!").info();
					// Сообщаем что все выполнено
					resolve(true);
				};
				// Запускаем коннект
				exec(getData());
			}));
		}
		/**
		 * updateCountries Метод обновления данных базы стран
		 */
		updateCountries(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Массив букв для названий стран
				const countriesChar = [
					"А", "Б", "В", "Г", "Д", "E", "Ж",
					"З", "И", "К", "Л", "М", "Н", "О",
					"П", "Р", "С", "Т", "У", "Ф", "Х",
					"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
				];
				// Подключаемся к коллекции стран
				const countries = idObj.clients.mongo.connection.db.collection("countries");
				// Удаляем колекцию стран
				countries.drop();
				// Удаляем данные из кеша
				Agl.rmRedis.call(idObj, "address:subjects:*:*:country:*");
				/**
				 * getCountry Рекурсивная функция загрузки страны
				 * @param  {Number} i текущий индекс массива
				 */
				const getCountry = (i = 0) => {
					// Если данные не все загружены то загружаем дальше
					if(i < countriesChar.length){
						// Формируем параметры запроса
						const query = {
							str:		countriesChar[i],
							limit:		100,
							noCache:	true
						};
						// Выполняем загрузку данных
						idObj.findCountry(query).then(result => {
							// Если это массив
							if($.isArray(result) && result.length){
								// Переходим по всему массиву
								const str = (result.length > 1 ? result.reduce((sum, val) => {
									// Формируем строку отчета
									return ($.isString(sum) ? sum : sum.name + " " + sum.type)
									+ ", " + val.name + " " + val.type;
								}) : result[0].name + " " + result[0].type);
								// Выводим данные в консоль
								idObj.log("страны(ы) загружен(ы) [", countriesChar[i], "]:", str).info();
							}
							// Продолжаем загрузку дальше
							getCountry(i + 1);
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log("findCountry in updateCountries", err).error();
							// Выходим
							getCountry(i + 1);
						});
					// Если все данные загружены тогда создаем индексы
					} else {
						// Создаем индексы стран
						countries.createIndex({name: 1}, {name: "country"});
						countries.createIndex({type: 1}, {name: "type"});
						countries.createIndex({typeShort: 1}, {name: "typeShort"});
						countries.createIndex({lat: 1, lng: 1}, {name: "gps"});
						countries.createIndex({nameShort: 1}, {name: "nameShort"});
						countries.createIndex({nameFull: 1}, {name: "nameFull"});
						countries.createIndex({gps: "2dsphere"}, {name: "locations"});
						// Выводим в консоль сообщение
						idObj.log("все страны установлены!").info();
						// Сообщаем что все удачно выполнено
						resolve(true);
					}
				};
				// Выполняем загрузку стран
				getCountry();
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
				Agl.rmRedis.call(idObj, "address:subjects:*:*:region:*");
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
						idObj.findRegion(query).then(result => {
							// Если это массив
							if($.isArray(result) && result.length){
								// Переходим по всему массиву
								const str = (result.length > 1 ? result.reduce((sum, val) => {
									// Формируем строку отчета
									return ($.isString(sum) ? sum : sum.name + " " + sum.type)
									+ ", " + val.name + " " + val.type;
								}) : result[0].name + " " + result[0].type);
								// Выводим данные в консоль
								idObj.log("регион(ы) загружен(ы) [", regionsChar[i], "]:", str).info();
							}
							// Продолжаем загрузку дальше
							getRegion(i + 1);
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log("findRegion in updateRegions", err).error();
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
						idObj.log("все регионы установлены!").info();
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
				const districtsChar = [
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
				Agl.rmRedis.call(idObj, "address:subjects:*:*:district:*");
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
									if(j < districtsChar.length){
										// Параметры запроса
										const query = {
											str:		districtsChar[j],
											limit:		100,
											noCache:	true,
											regionId:	data[i]._id
										};
										// Выполняем поиск района
										idObj.findDistrict(query).then(result => {
											// Если это массив
											if($.isArray(result) && result.length){
												// Переходим по всему массиву
												const str = (result.length > 1 ? result.reduce((sum, val) => {
													// Формируем строку отчета
													return ($.isString(sum) ? sum : sum.name + " " + sum.type)
													+ ", " + val.name + " " + val.type;
												}) : result[0].name + " " + result[0].type);
												// Выводим данные в консоль
												idObj.log(
													"район(ы) загружен(ы) [", districtsChar[j], "]:", str,
													"номер района =", (i + 1),
													"из", data.length
												).info();
											}
											// Продолжаем загрузку дальше
											getDistrict(j + 1);
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log("findDistrict in updateDistricts", err).error();
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
								idObj.log("все районы установлены!").info();
								// Сообщаем что все удачно выполнено
								resolve(true);
							}
						};
						// Извлекаем данные регионов
						getRegion();
					// Выводим сообщение в консоль
					} else {
						// Выводим сообщение в консоль
						idObj.log("ошибка загрузки данных регионов", err).error();
						// Сообщаем что такие данные не найдены
						resolve(false);
					}
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
				Agl.rmRedis.call(idObj, "address:subjects:*:*:city:*");
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
										idObj.findCity(query).then(result => {
											// Если это массив
											if($.isArray(result) && result.length){
												// Переходим по всему массиву
												const str = (result.length > 1 ? result.reduce((sum, val) => {
													// Формируем строку отчета
													return ($.isString(sum) ? sum : sum.name + " " + sum.type)
													+ ", " + val.name + " " + val.type;
												}) : result[0].name + " " + result[0].type);
												// Выводим данные в консоль
												idObj.log(
													"город(а) загружен(ы) [", citiesChar[j], "]:", str,
													"номер региона =", (i + 1),
													"из", data.length
												).info();
											}
											// Продолжаем загрузку дальше
											getCity(j + 1);
										// Если происходит ошибка тогда выходим
										}).catch(err => {
											// Выводим ошибку метода
											idObj.log("findCity in updateCities", err).error();
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
								idObj.log("все города установлены!").info();
								// Сообщаем что все удачно выполнено
								resolve(true);
							}
						};
						// Извлекаем данные регионов
						getRegions();
					// Выводим сообщение в консоль
					} else {
						// Выводим сообщение в консоль
						idObj.log("ошибка загрузки данных регионов", err).error();
						// Сообщаем что такие данные не найдены
						resolve(false);
					}
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
						const key = getKeyRedisForSubject(obj);
						// Сохраняем данные в кеше
						Agl.setRedis.call(idObj, "set", key, obj).then(callback).catch(callback);
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
								idObj.getMetroByGPS(query).then(metro => {
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
									idObj.log("getMetroByGPS in updateMetroCity", err).error();
									// Выходим
									getData(i + 1);
								});
							// Если все загружено тогда сообщаем об этом
							} else {
								// Выводим в консоль сообщение
								idObj.log("все станции метро в городах установлены!").info();
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
									cache[arr[i]._id] = {};
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
											// Формируем объект для сохранения в кеше
											const obj = {
												id:		station._id,
												name:	station.name,
												lat:	station.lat,
												lng:	station.lng,
												order:	station.order,
												line:	line.name,
												color:	line.color,
												city:	arr[i].name
											};
											// Ключа кеша метро
											const key = createMetroKey({
												id:		station._id,
												key:	"metro",
												name:	station.name,
												lineId:	line._id,
												cityId:	arr[i]._id
											});
											// Записываем данные в кеш
											Agl.setRedis.call(idObj, "set", key, obj).then();
											// Сохраняем станцию метро
											(new idObj.schemes.Metro_stations(station)).save();
										});
										// Сохраняем линию метро
										(new idObj.schemes.Metro_lines(line)).save();
									});
									// Сохраняем город метро
									(new idObj.schemes.Metro_cities(arr[i])).save();
								// Выводим сообщение в консоль
								} else idObj.log("ошибка загрузки данных городов", err).error();
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
							// Выводим в консоль сообщение
							idObj.log("все метро установлены!").info();
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
					err => idObj.log("get metro", err).error()
				// Обрабатываем полученные данные
				).then(getData, err => idObj.log("parse metro", err).error())
				// Если происходит ошибка тогда выходим
				.catch(err => {
					// Ошибка метода updateMetro
					idObj.log("updateMetro", err).error();
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
					// Выполняем обновление базы данных стран
					const countries = yield idObj.updateCountries();
					// Выполняем обновление базы данных регионов
					const regions = (countries ? yield idObj.updateRegions() : false);
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
						idObj.log("все работы выполнены!").info();
						// Сообщаем что работа завершена
						resolve(true);
					} else {
						// Выводим сообщение в консоль
						idObj.log(
							"база данных создана не полностью:",
							"регионы =", regions,
							"районы =", districts,
							"города =", cities,
							"метро =", metro
						).error();
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
					Agl.createModels.call(idObj);
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
					idObj.log('MongoDB', err).error();
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
					idObj.log('redis', err).error();
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
		 * @param {Variant} messages сообщение
		 */
		log(...message){
			// Выводим результат
			return {
				// Если это информационные сообщения
				info: () => {
					// Если вывод информационных сообщений разрешен
					if(this.debug.message){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим информационное сообщение
						console.info(
							'\x1B[32m\x1B[1mInfo\x1B[0m\x1B[32m'
							.anyks_clearColor(this.debug.console),
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m'
							.anyks_clearColor(this.debug.console),
							message.anyks_toObjString().join(" ")
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				},
				// Если это вывод ошибок
				error: () => {
					// Если вывод ошибок разрешен
					if(this.debug.errors){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим сообщение об ошибке
						console.error(
							'\x1B[31m\x1B[1mError\x1B[0m\x1B[31m'
							.anyks_clearColor(this.debug.console),
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m'
							.anyks_clearColor(this.debug.console),
							message.anyks_toObjString().join(" ")
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				}
			};
		}
	};
	// Создаем модуль для Node.js
	module.exports = Agl;
})(anyks);