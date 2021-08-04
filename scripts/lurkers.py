#!/usr/bin/python2
# coding: utf-8
import os
import pygeoip
import json
import sys

geoip = pygeoip.GeoIP('GeoLiteCity.dat')
regions = json.load(open('public/json/regioncodes.json'))
#db = pymongo.MongoClient().livechan_db
country_names = {"BE": "Belgium", "FR": "France", "BG": "Bulgaria", "HR": "Croatia", "DE": "Germany", "JP": "Japan", "HU": "Hungary", "BR":     "Brazil", "FI": "Finland", "BY": "Belarus", "GR": "Greece", "RU": "Russian Federation", "NL": "Netherlands", "NO": "Norway", "TR": "Turkey",        "LU": "Luxembourg", "PL": "Poland", "CN": "China", "CL": "Chile", "CA": "Canada", "IT": "Italy", "CZ": "Czech Republic", "AR": "Argentina",         "AU": "Australia", "AT": "Austria", "IE": "Ireland", "ES": "Spain", "MD": "Moldova, Republic of", "OM": "Oman", "UA": "Ukraine", "MN":              "Mongolia", "US": "United States", "KR": "Korea, Republic of", "MY": "Malaysia", "MX": "Mexico", "SE": "Sweden", "GB": "United Kingdom", "RS":      "Serbia", "DK": "Denmark"}
#fuck this shit t. ncat 2018-07-17
exceptions = json.loads(open('config.js').read().split('ip_exceptions:')[1].split('}')[0].rstrip(',\n ')+'}')

def ips():
    return set(x.split()[4].split(':')[0] for x in os.popen('netstat -n |egrep ":(443|8888)"').read().splitlines())


for ip in ips():
    if ip == '31.148.96.156' or ip.startswith('104.28.') or ip.startswith('104.16.') or ip == '127.0.0.1' or ip == '79.170.112.3' or ip == '185.10.68.170':
        continue
    for k, v in exceptions.items():
        if ip.startswith(k):
            print country_names[v.split('-')[0]], regions[v]
            if '-v' in sys.argv:
                print ip
                print
            break
    else:
        try:
            location = geoip.record_by_addr(ip)
            #name = db.chat_dbs.find_one({'ip': ip}, sort=[('date',-1)])
            #if name:
            #    name = name['name']
            #else:
            #    name = ''
            if location:
                region = regions.get('%s-%s' % (location['country_code'], location['region_code']), '')
                if region in ('Sevastopol', 'Crimea'):
                    location['country_name'] = 'Russian Federation'
                print location['country_name'], region#, name.encode('utf-8')
            if '-v' in sys.argv:
                print ip
                print
        except Exception as e:
        # due to: socket.error: illegal IP address string passed to inet_pton
            pass
