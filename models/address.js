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
			// db.address.createIndex({id: 1}, {name: "id", unique: true, dropDups: true});
			// db.address.createIndex({lat: 1, lng: 1}, {name: "gps"});
			// db.address.createIndex({"address.zip": 1}, {name: "zip"});
			// db.address.createIndex({"address.district": 1}, {name: "district"});
			// db.address.createIndex({"address.region": 1, "address.country": 1, "address.street": 1, "address.city": 1}, {name: "address"});
			// db.address.createIndex({gps: "2dsphere"}, {name: "locations"});
			// Выводим коллекцию Cian
			return new mongo.Schema({
				id:				String,
				lat:			String,
				lng:			String,
				gps:			[Number],
				boundingbox: {
					type:		[String],
					optional:	true
				},
				description:	String,
				address: {
					zip: {
						type:		Number,
						optional:	true
					},
					city: {
						type:		String,
						optional:	true
					},
					code: {
						type:		String,
						optional:	false
					},
					street: {
						type:		String,
						optional:	true
					},
					region: {
						type:		String,
						optional:	true
					},
					country: {
						type:		String,
						optional:	false
					},
					district: {
						type:		String,
						optional:	true
					},
				}
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();