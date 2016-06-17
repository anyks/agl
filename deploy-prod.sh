#!/bin/sh

cd ./ || exit;

echo "Введите описание комита"

read var

if [ -z "$var" ]; then
	# var="Загрузка данных на сервер (коммит не указан)"
	# var="Исправляем баги на сайте"
	var="Создаем систему AGL"
fi

git commit -a -m "$var"

git push origin master

echo "Активируем данные на сервере"

ansible-playbook -i ./deploy/infra/hosts ./deploy/server-prod.yml

echo "Все!!!"

exit;