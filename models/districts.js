// Устанавливаем строгий режим
"use strict";

// Экранируем код
(function(){
	// Подключаем модуль Mongoose
	const mongo = require('mongoose');
	/**
	 * Класс модели
	 */
	class Model {
		/**
		 * constructor Конструктор класса
		 * @param  {Array} collections массив содержащий колекцию
		 */
		constructor(collection){
			// Основная коллекция
			this.collection = collection;
		}
		// Создаем новую схему для метро
		getData(){
			// Индексы
			// db.regions.createIndex({id: 1}, {name: "id", unique: true, dropDups: true});
			// db.regions.createIndex({lat: 1, lng: 1}, {name: "gps"});
			// db.regions.createIndex({name: 1}, {name: "name"});
			// db.regions.createIndex({type: 1}, {name: "type"});
			// db.regions.createIndex({typeShort: 1}, {name: "typeShort"});
			// db.regions.createIndex({zip: 1}, {name: "zip"});
			// db.regions.createIndex({okato: 1}, {name: "okato"});
			// db.regions.createIndex({contentType: 1}, {name: "contentType"});
			// db.regions.createIndex({gps: "2dsphere"}, {name: "locations"});
			// Выводим коллекцию Cian
			return new mongo.Schema({
				id:				String,
				name:			String,
				lat:			String,
				lng:			String,
				gps:			[Number],
				type:			String,
				okato:			String,
				typeShort:		String,
				contentType:	String,
				zip: {
						type:		Number,
						optional:	true
				},
				regionId: {
					/*
					type:	String,
					ref:	'Regions'
					*/
					type:		DBRef.Schema,
					optional:	false
				}
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();