livechan
====

livechan is a live IRC like image board written in node.js.

Configuration
====
Edit:
	- config.js
	- scripts/config_nginx.sh
	- docker-compose.yml
		-add livechan build args MAXMIND_LICENSE_KEY

Then run:

	./scripts/build_livechan.sh
	./scripts/build_nginx.sh
	./scripts/setup_livechan.sh
	./scripts/set_livechan_password.sh

If using a local certificate:
	./scripts/gen_nginx_cert_local.sh
Otherwise:
	copy your certificates to nginx/certs/ and add the proper filenames to scripts/config_nginx.sh

./scripts/setup_nginx.sh

If using your own nginx, copy nginx/sites-enabled/livechan to your nginx config

Running
===

Built in nginx:
	`docker-compose up -d`

Own nginx:
	`docker-compose up -d livechan`

Logging: 
	`docker-compose log -f livechan`

Todo
===

fix bugs:
	- socketio reconnects but does not fire client event
	- ip detection doesnt work for localhost
	- build_client_js has error messages

add features:
	- catpcha
	- flags
	- banners
	- smiles

add extra services:
	- lurkers
	- map
	- ircd
	- radio

Relevant links
====
    Live instance: https://livebunker.rocks
    Library for writing bots(python2) https://github.com/pawnhearts/livechanapi
    Library for writing bots(python3+asyncio) https://github.com/pawnhearts/aiolivechan
    Gate between telegram and livechan https://github.com/pawnhearts/lctelegate
