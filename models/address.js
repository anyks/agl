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
		// Создаем новую схему
		getData(){
			// Выводим коллекцию
			return new mongo.Schema({
				_id:	String,
				lat:	String,
				lng:	String,
				code:	String,
				key:	String,
				gps:	[Number],
				boundingbox: [{
					type:		String,
					optional:	true
				}],
				description: String,
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
					}
				}
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();