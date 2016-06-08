#!/bin/sh

# PROVIDE: AglWs
# REQUIRE: NETWORKING SERVERS DAEMON
# BEFORE:  LOGIN
# KEYWORD: shutdown

# forever list - проверка процессов

. /etc/rc.subr

name="AglWs"
forever="/bin/node --stack-size=2097151 /bin/forever"
workdir="/var/www/agl"
iddir="agents"
script="ws.js"

rcvar=`set_rcvar`

start_cmd="start"
stop_cmd="stop"
restart_cmd="restart"

load_rc_config $name
eval "${rcvar}=\${${rcvar}:-'NO'}"

start(){
	USER=root
	PATH=/sbin:/bin:/usr/sbin:/usr/bin:/usr/local/sbin:/usr/local/bin:/root/bin
	PWD=/root
	HOME=/root
	NODE_ENV=production
	${forever} start --minUptime 3000ms --spinSleepTime 2000ms -a -l /var/log/forever.agl.${iddir}.log -o /dev/null -e /var/www/logs/agl.${iddir}.fork.log --sourceDir ${workdir} ${iddir}/${script} -r 127.0.0.1:6379 -s 127.0.0.1:1212
}

stop(){
	${forever} stop ${workdir}/${iddir}/${script}
}

restart(){
	${forever} restart ${workdir}/${iddir}/${script}
}

run_rc_command "$1"