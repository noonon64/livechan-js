/* get IP of user, taking into account nginx proxy */
module.exports = function(req) {
    var user_ip = '';
    var ip_addr = req.headers['x-forwarded-for'];
    if (ip_addr) {
        var list = ip_addr.split(',');
        user_ip = list[list.length - 1];
    }
    if (typeof user_ip !== 'string' || user_ip === '' || user_ip == null) {
	    user_ip = '255.255.255.255';
    }

    return user_ip;
};
