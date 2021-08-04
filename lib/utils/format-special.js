var fs = require("fs");
var geolite2 = require("geolite2");
var maxmind = require("maxmind");
var get_user_ip = require('./get-user-ip');
var config = require('../../config');

const openSync = (path) => {
	return new maxmind.Reader(fs.readFileSync(path));
}

var cityLookup = openSync(geolite2.paths.city);
var countryLookup = openSync(geolite2.paths.country);

var default_country = "UN";

var regional_flags = ["SE-21", "KR-11", "HU-05", "GB-V2", "SE-28", "GB-I2", "GB-H9", "SE-26"];
var full_countries = ["US", "AU", "CA", "DE", "PL", "GR", "RU", "FI", "UA", "BR",
    "NO", "JP", "NL", "RS", "MD", "FR", "IE", "AR", "HR", "AT",
    "BE", "BG", "BY", "CL", "CN", "CZ", "ES", "IT", "LU", "MN",
    "MX", "MY", "OM", "TR"
];
var country_names = {"BE": "Belgium", "FR": "France", "BG": "Bulgaria", "HR": "Croatia", "DE": "Germany", "JP": "Japan", "HU": "Hungary", "BR": "Brazil", "FI": "Finland", "BY": "Belarus", "GR": "Greece", "RU": "Russian Federation", "NL": "Netherlands", "NO": "Norway", "TR": "Turkey", "LU": "Luxembourg", "PL": "Poland", "CN": "China", "CL": "Chile", "CA": "Canada", "IT": "Italy", "CZ": "Czech Republic", "AR": "Argentina", "AU": "Australia", "AT": "Austria", "IE": "Ireland", "ES": "Spain", "MD": "Moldova, Republic of", "OM": "Oman", "UA": "Ukraine", "MN": "Mongolia", "US": "United States", "KR": "Korea, Republic of", "MY": "Malaysia", "MX": "Mexico", "SE": "Sweden", "GB": "United Kingdom", "RS": "Serbia"};


function get_country(req, data, callback) {
    var user_ip = get_user_ip(req);

		c_data = countryLookup.get(user_ip);

		if (c_data) {
				data.country = c_data.country_code;
				data.country_name = c_data.country_name;
				data.latitude = c_data.latitude;
				data.longitude = c_data.longitude;
				if (!data.no_region) {
						/*if ((user_ip in ip_exceptions) || (!c_data.region && (user_ip in ip_exceptions))) {
								c_data.region = ip_exceptions[user_ip];
						}
						for(i in config.ip_exceptions) {
								if(user_ip.indexOf(i) == 0) c_data.region = config.ip_exceptions[i];
						}*/
						if (full_countries.includes(c_data.country_code) && c_data.region) {
								data.country += "-" + c_data.region;
						} else if (c_data.region && regional_flags.includes(data.country + "-" + c_data.region)) {
								data.country += "-" + c_data.region;
						}
						for(i in config.ip_exceptions) {
								if(user_ip.indexOf(i) == 0){
									data.country = config.ip_exceptions[i];
									data.country_name = country_names[config.ip_exceptions[i].split('-')[0]];
								}
						}
				}
		} else {
				data.country = default_country;
		}
		
		return callback();
}

module.exports = function(req, data, callback) {
    if (data.special) {
        switch (data.special) {
            case "country":
                return get_country(req, data, callback);
            default:
                return callback();
        }
    }
    return callback();

};
