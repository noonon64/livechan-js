#!/bin/bash
source ./scripts/config_nginx.sh
# ssl_certificate /etc/letsencrypt/live/'${FQDN?}'/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/'${FQDN}'/privkey.pem;

echo '### UPSTREAM APPS

upstream app_livechan {
	server livechan:8080;
}
upstream app_draw {
	server 127.0.0.1:8000;
}


# server {
# 	listen 443;
# 	ssl_certificate '${CERT}';
# 	ssl_certificate_key '${CERT_KEY}';
# 	server_name '${FQDN}';
# 	return 301 https://'${DOMAIN?}'$request_uri;
# }


server {
	listen 443 ssl;

	ssl_certificate '${CERT}';
	ssl_certificate_key '${CERT_KEY}';
	server_name '${NAME?}';

	access_log off;

	location /tmp {
		alias '${PUBLIC}'/tmp;
	}

	location /css {
		alias '${PUBLIC}'/css;
	}

	location /icons {
		alias '${PUBLIC}'/icons;
	}

	location /images {
		alias '${PUBLIC}'/images;
	}

	location /js {
		alias '${PUBLIC}'/js;
		proxy_no_cache 1;
		proxy_cache_bypass 1;
		add_header Last-Modified $date_gmt;
		add_header Cache-Control '"'"'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'"'"';
		if_modified_since off;
		expires off;
		etag off;
	}
	location /json {
		alias '${PUBLIC}'/json;
	}
	location /plugins {
		alias '${PUBLIC}'/plugins;
	}

	location ^~ /.well-known/acme-challenge/ {
		default_type "text/plain";
		root '${PUBLIC}';
	}

	location / {
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-NginX-Proxy true;

		proxy_pass http://app_livechan/;
		proxy_redirect off;
	}
	# location /messages {
	# 	proxy_http_version 1.1;
	# 	proxy_pass http://'${DOMAIN}':8080/messages/int;
	# }
	# location /lurkers {
	# 	proxy_pass http://app_lurkers;
	# }
}

### DRAW

server {
	listen 5001 ssl;

	ssl_certificate '${CERT}';
	ssl_certificate_key '${CERT_KEY}';

	access_log off;

	location / {
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-NginX-Proxy true;

		proxy_pass http://app_draw/;
		proxy_redirect off;
	}
}

### DEFAULT HTTP

server {
	listen 80;
	server_name _;
	access_log off;
	return 301 https://$host$request_uri;
}' > ./nginx/sites-enabled/livechan
