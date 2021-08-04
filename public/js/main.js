/*
    LiveChan is a live imageboard web application.
    Copyright (C) 2014 LiveChan Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var auto_post = false;
var last_post = "";
var cool_down_timer = true ;
var cool_down_interval = 1000;
var admin_mode = false;
var admin_pass = ""; // pass to auth with server for admin commands, set by /admin command
var highlight_regex = /.^/; // matches nothing
var hidden = {tripcodes:false,users:[]};

var socket = null;

var sel = '';

var html5 = false;
try {
    html5 = (window.localStorage !== undefined && window.localStorage !== null);
} catch (e) {
    html5 = false;
}
var submit_beta = false;

var default_theme = "/style.css";

var submit_file = null;
var submit_filename = "";
var audio_recorder = null;

navigator.getMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
);

function on_delete(data) {
    var chat_id = parseInt(data['count']);
    delete chat[chat_id];
    $('#chat_'+chat_id).remove();
}

/* stuff to do on load */
$(document).ready(function () {
    "use strict";

    /* set up socket */
        socket = {emit: function(){}}

        socket = io.connect('/', {secure: (location.protocol === "https:")});
        if(localStorage.sse == 'sse') {
            var evtSource = new EventSource('/messages');
            evtSource.addEventListener('event', function(evt) {
                var data = JSON.parse(evt.data);
                on_chat(data);
                console.log(data);
            },false);
        } else {
            socket.on('chat', function (data) {
                on_chat(data);
            });
        }
        socket.on('delete', function (chat_id) {
            on_delete(chat_id);
        });
        socket.on('alert', div_alert);
        socket.on('silent', silent_poster);
        socket.on('unsilent', unsilent_poster);
        socket.on('refresh', function () {
            setTimeout(function () {
                location.reload();
            }, 5000);
        });

        socket.on('disconnect', function () {
            create_server_post('You have been disconnected from the server, attempting to reconnect...');
        });
        socket.on('reconnect', function () {
            var old_id = chat_id;
            chat_id = "home";
            set_channel(old_id);
            setTimeout(function () {
                create_server_post('Reconnected!')
            }, 2 * 1000);
        });
        socket.on('user_count', function (data) {
            var s = data == 1 ? "" : "s";
            $("#user_count").text(data + " user" + s);
        });
    /* key bindings for actions */
    $("#name").keydown(function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            return false;
        }
    });

    $("#convo").keydown(function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            return false;
        }
    });

    $("#body").keydown(function (e) {
        if (!e.shiftKey && e.keyCode === 13) {
            var msg = $("#body").val();
            if ($("#autosubmit").prop('checked') && cool_down_timer <= 0 && !($("#submit_button").prop("disabled"))
                || msg.indexOf('//') !== 0 && msg.indexOf('/') === 0) { /* no delay if command */
                submit_chat();
            } else {
                auto_post = true;
                $("#submit_button").prop("value", "Submit (Auto)");
            }
            return false;
        }
    });

    $(document).on('mouseup', function(e){
        if(e.target.className == 'chat_number') return false;
        sel = window.getSelection().toString();
    });

    /* hacky processing request responses */
    $('iframe#miframe').load(function () {
        var resp;
        try {
            resp = JSON.parse($($("#miframe").contents()[0].body).text());
        } catch (e) {
            resp =  {failure:$($("#miframe").contents()[0].body).text()};
        }
        handle_post_response(resp);
    });

	// ensure files are no greater than 5mb
    $("#image").bind('change', function() {
		if (this.files[0].size > 40000000){
			div_alert("File too large. 40MB is the maximum file size.");
			clear_file_field();
		}
	});

    $(document).bind('click', function(e){
        $('.settings_nav:first').hide('slow');
    });

    $('#unignore_button').bind('click', function(e){
        e.stopPropagation();
        localStorage.ignored_ids = JSON.stringify([]);
        ignored_ids = [];
        $('#unignore_button').html('Unignore 0 users');
    });

    $('#settings_button').bind('click', function(e){
        e.stopPropagation();
        $('.settings_nav:first').toggle('slow');
        $('.settings_nav').bind('click', function(e2){
             e2.stopPropagation();
        });

    });

    $('#convo, #convo_filter').change(function () {
        apply_filter();
    });

    $('#theme_select').change(function () {
        get_css($(this).val());
        if (html5) localStorage.theme = $(this).val().replace("null", default_theme);
        setTimeout(scroll, 300);
    });

    $('#disableautism').change(function () {
        var a = [
            'https://www.autism-society.org/about-the-autism-society/contact-us/',
            'https://iacc.hhs.gov/meetings/autism-events/2017/crisis_supports_autism_community.pdf',
            'https://www.scottishautism.org/services-support/support-individuals/crisis-support',
            'https://suicidology.org/wp-content/uploads/2019/07/Autism-Crisis-Supports.pdf'
        ];
        location=a[Math.floor(Math.random() * a.length)];
    });

    $('#spoilers').change(function () {
        if (html5) localStorage.spoilers = $(this).prop("checked");
        $('.spoiler').toggleClass('spoiled', !$(this).prop("checked"));
    });

    $('#sounds_onyou').change(function () {
        if (html5) localStorage.sounds_onyou = $(this).prop("checked");
    });

    $('#selquote').change(function () {
        if (html5) localStorage.selquote = $(this).prop("checked");
    });

    $('#bbcode').change(function () {
        if (html5) localStorage.bbcode = $(this).prop("checked");
        if($(this).prop("checked")) $('#bbcode_buttons').show();
        else $('#bbcode_buttons').hide();
    });

    $('#volume').change(function () {
        if (html5) localStorage.volume = $(this).val();
    });

    $('#image_paste_quality').change(function () {
        if (html5) localStorage.image_paste_quality = $(this).val();
    });

    $('#image_paste_format').change(function () {
        if (html5) localStorage.image_paste_format = $(this).val();
    });

    $('#board_select').change(function () {
        var board = $(this).val();
        if (board=="")
            return;
        set_channel(board);
    });

    var prev_thumbnail_mode = $("#thumbnail_mode").val();
    $("#thumbnail_mode").change(function () {
        if (html5) localStorage.thumbnail_mode = $(this).val();
        var new_value = $(this).val();
        if (prev_thumbnail_mode === "links-only") {
            $('.chat_img_cont').show('slow', function(){
                scroll();
            });
            if (new_value === "static") $('.thumb_static').show('slow');
            if (new_value === "animated") $('.thumb_anim').show('slow');
        } else if (new_value === "links-only") {
            $('.chat_img_cont').hide('slow');
            if (prev_thumbnail_mode === "static") $('.thumb_static').hide('slow');
            if (prev_thumbnail_mode === "animated") $('.thumb_anim').hide('slow');
        } else {
            $('.thumb_static').css("display", (new_value === "static") ? "inline" : "none");
            $('.thumb_anim').css("display", (new_value === "animated") ? "inline" : "none");
        }
        prev_thumbnail_mode = new_value;
    });

    set_up_html();

    $('#clearconvo').change(function() {
        if (html5) {
            if($(this).prop("checked"))
                localStorage.clearConvo = "true";
            else
                localStorage.clearConvo = "false";
        }
    });

    $('#sidebar_hider').click(toggle_sidebar);

    clear_file_field();

	$('#camera_button').click(function(){
		var cam = $('<div id="my_camera" style="width:320px; height:240px;"></div>');
		cam.css({
			zIndex:1000,
			position:'absolute',
			top:0,
			left:0
		});
		cam.click(function(){
			var data_uri = Webcam.snap();
			var raw_image_data = data_uri.replace(/^data\:image\/\w+\;base64\,/, '');
			submit_file = data_URI_to_Blob(data_uri, 'image/jpeg');
			submit_filename = "webcam.jpeg";
			var recording = $('<img id="recording" controls class="input_button"/>');
            recording.attr("src", data_uri);
            recording.css({height:"25px"});
            recording.insertAfter($("#image"));
			  Webcam.reset();
			cam.remove();
		});
		$('body').append(cam);
		Webcam.attach('#my_camera');
		cam.prepend($("<span>Click the image to take a picture</span>")
			.css({background:"white",textAlign:"center",position:"absolute",top:0,width:"100%"}));
	});

    $('#record_button').click(function() {
        $('#stop_button').show();
        $('#record_button').hide();
        navigator.getMedia(
            {audio: true},
            function(stream) {
                audio_recorder = new MediaRecorder(stream);
                var data = [];
                audio_recorder.ondataavailable = function(e) {
                    data.push(e.data);
                };
                audio_recorder.onstop = function(e) {
                    $("#image").val('').hide();
                    $('#stop_button').hide();
                    submit_file = new Blob(data, {type: 'audio/ogg'});
                    submit_filename = "recording.ogg";
                    var recording = $('<audio id="recording" controls class="input_button"/>');
                    recording.attr("src", URL.createObjectURL(submit_file));
                    recording.insertAfter($("#image"));
                    audio_recorder = null;
                };
                audio_recorder.start();
            },
            function(e) {}
        );
    });

    $('#stop_button').click(function() {
        if (audio_recorder) audio_recorder.stop();
        $("#submit_button").prop("disabled", false);
        if(!$("#body").val()) $("#body").val(" ");
    });

    $('#clear_button').click(clear_file_field);
    $('#submit_button').click(submit_chat);
});

function create_server_post(status)
{
    var data = {};
    data.count = 0;
    data.convo = "";
    data.body = status;
    data.name = "";
    data.date = (new Date()).toString();
    data.trip = admins[0];
    console.log(data);
    update_chat(data, true);
    scroll();
}

/* convert uri to blob */
function data_URI_to_Blob(dataURI, dataTYPE) {
    var binary = atob(dataURI.split(',')[1]), array = [];
    for(var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
    return new Blob([new Uint8Array(array)], {type: dataTYPE});
}

/* load up css into the page */
function get_css(file) {
    "use strict";
    if ($('#css_new')) {
        $('#css_new').remove();
    }
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.id = 'css_new';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/css'+file;
    link.media = 'all';
    $('head').append(link);
    if ($('#css_highlight_new')) {
        $('#css_highlight_new').remove();
    }
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.id = 'css_highlight_new';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/plugins/code_highlight/css'+file;
    link.media = 'all';
    $('head').append(link);
}

function set_up_html(){
    if (html5) {
        /* set up only html5 local storage stuff */
        my_ids = localStorage.my_ids;
        if (my_ids) {
            my_ids = JSON.parse(my_ids);
        } else {
            my_ids = [];
        }

        ///localStorage.ignored_ids = JSON.stringify([]);
        ignored_ids = localStorage.ignored_ids;
        if (ignored_ids) {
            ignored_ids = JSON.parse(ignored_ids);
        } else {
            ignored_ids = [];
        }
        $('#unignore_button').html('Unignore ' + ignored_ids.length + ' memes');

        contribs = localStorage.contribs;
        if (contribs) {
            contribs = JSON.parse(contribs);
        } else {
            contribs = default_contribs;
        }
        
        /*if (!localStorage.theme || localStorage.theme === "null") {
            localStorage.theme = "/style.css";
        }*/


        if (localStorage.name !== undefined) $("#name").val(localStorage.name);
        if (localStorage.spoilers !== undefined) $("#spoilers").prop("checked", localStorage.spoilers === "true");

	if (localStorage.image_paste_quality !== undefined) {
	    $("#image_paste_quality").val(localStorage.image_paste_quality);
	} else {
	    localStorage.image_paste_quality = 1.0;
	    $("#image_paste_quality").val(localStorage.image_paste_quality);
	}

	if (localStorage.image_paste_format !== undefined) {
	    $("#image_paste_format").val(localStorage.image_paste_format);
	} else {
	    localStorage.image_paste_format = "jpeg";
	    $("#image_paste_format").val(localStorage.image_paste_format);
	}

	//$("#volume").val(1);
	//$("#sounds").prop("checked", true);
        //$("#sounds_onyou").prop("checked", true);
/*
*---------------------------------------------------
*	Why does this keep gettin commented out?
*---------------------------------------------------
*/

        $('#disableautism').prop("checked", false);
        if (localStorage.disableAnimation !== undefined) $("#disableanimation").prop("checked", localStorage.disableAnimation === "true");
            else $("#disableanimation").prop("checked", false);

        if (localStorage.sounds !== undefined) $("#sounds").prop("checked", localStorage.sounds === "true");
            else $("#sounds").prop("checked", false);
        if (localStorage.sounds_onyou !== undefined) $("#sounds_onyou").prop("checked", localStorage.sounds_onyou === "true");
        else $("#sounds_onyou").prop("checked", false);
	if (localStorage.volume !== undefined) $("#volume").val(localStorage.volume);
        if (localStorage.selquote !== undefined) $("#selquote").prop("checked", localStorage.selquote === "true");
        else $("#selquote").prop("checked", false);
        if (localStorage.bbcode !== undefined) $("#bbcode").prop("checked", localStorage.bbcode === "true");
        else $("#bbcode").prop("checked", false);
        if($('#bbcode').prop("checked")) $('#bbcode_buttons').show();
        else $('#bbcode_buttons').hide();
        if (localStorage.theme !== undefined) $("#theme_select").val(localStorage.theme);
        if (localStorage.clearConvo !== undefined) $("#clearconvo").prop("checked", localStorage.clearConvo === "true");
        
	if (localStorage.hidden !== undefined) hidden = localStorage.hidden;
	if (localStorage.highlight_regex !== undefined) highlight_regex = localStorage.highlight_regex;
        if (localStorage.max_chats !== undefined) max_chats = localStorage.max_chats;

        cool_down_timer = localStorage.cool_down_timer ? parseInt(localStorage.cool_down_timer) : 0;
    }

    if (cool_down_timer>0)
        init_cool_down();
    if (!$("#theme_select").val() || $("#theme_select").val() === "null" || !$("#theme_select").val().replace(/^\s+|\s+$/gm, '')) {
        $("#theme_select").val(default_theme);
    }
    get_css($("#theme_select").val());

    if (localStorage.thumbnail_mode) $("#thumbnail_mode").prop("value",localStorage.thumbnail_mode)

	// $(".sidebar_banner").html(
	// 		$("<img>").attr("src",
	// 			"/images/banners/"+
	// 			banners[(new Date).getTime() % banners.length])
	// 		.css({width:"100%",height:"100%",marginBottom:"-3px"})
	// 	)
	// 	.click(function(){
	// 		$(this).find("img")
	// 		.attr("src", "/images/banners/"+banners[(new Date).getTime() % banners.length])	
	// 	});

    var board = window.location.pathname.match(/[^\/]*$/)[0];
    var matched_link = window.location.hash.match(/^#(\d+)$/);
    set_channel(board, matched_link ? matched_link[1] : "");
}

/* give me captcha TODO: clean this up and make it work better */
function captcha_div() {
    "use strict";
    return '<span>Please enter the captcha</span><br><img src="/captcha.jpg#' + new Date().getTime() + '" alt="Lynx is best browser" /><form id="loginform" action="/login" method="post" target="miframe" style="padding:0;"><input type="text" name="digits" style="display:inline;" /><input style="display:inline;" type="submit"/></form>';
}

/* gets cookie, use this function instead of document.cookie */
function get_cookie(cname) {
    "use strict";
    var name = cname + "=";
    var ca = document.cookie.split(';');
    var i = 0;
    var c = null;
    for (i = 0; i < ca.length; i++) {
        c = ca[i].replace(/^\s+|\s+$/gm, '');
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function silent_poster(param) {
    var chat_count = parseInt(param);
    if (chat_count == 0) {
        localStorage.ignored_ids = JSON.stringify([]);
        ignored_ids = [];
        return;
    }
    if (chat_count !== NaN && my_ids.indexOf(chat_count) == -1) {
        console.log(chat_count, chat[chat_count]);
        ignored_ids.push(chat[chat_count].identifier);
        localStorage.ignored_ids = JSON.stringify(ignored_ids);
    }
    $('#unignore_button').html('Unignore ' + ignored_ids.length + ' memes');
}

function unsilent_poster(param) {
    console.log('Param: ', param);
    var id = param;//chat[chat_count].identifier;
    var ind = ignored_ids.indexOf(id);
    if (ind != -1) {
        // console.log(chat_count, chat[chat_count]);
        console.log('unsilent: ', id);
        ignored_ids.splice(ind, 1);
        localStorage.ignored_ids = JSON.stringify(ignored_ids);
    }
}


/* alert whatever error was given to you by the server */
function div_alert(message, add_button, div_id) {
    "use strict";
    if (add_button === undefined) {
        add_button = true;
    }
    if (div_id === undefined) {
        div_id = "";
    }
    var alert_div = $("<aside class='alert_div'/>");
    alert_div.toggleClass("shown", chat_id !== 'home' && chat_id !== 'all');
    alert_div.attr('id', 'alert_div_' + div_id);
    var button = $("<button class='alert_button'>X</button>");
    button.click(function() {
        alert_div.remove();
        $("#submit_button").prop("disabled", false);
    });
    /*if (!add_button) {
        button = [];
    }*/
    var alert_message = $("<article class='alert_message'/>");
    alert_message.html(message.replace(/\r?\n/g, '<br />'));
    alert_div.append(button, alert_message);
    alert_div.css({
        position: 'fixed',
        width: 'auto',
        bottom: '160px',
        left: document.width / 2 - 150,
        zIndex: 1000
    });
    $('.chats:first').append(alert_div);
}


/* clear input fields */
function clear_fields() {
    "use strict";
    clear_file_field();
    $("#body").val('');
    $("#sum").val('');
    if($("#clearconvo").prop("checked")
       && $('#convo_filter').val() !== 'filter') {
        $("#convo").val('');
    }
}

/* clear file field */
function clear_file_field() {
    if (audio_recorder) {
        audio_recorder.onstop = function(e) {};
        audio_recorder.stop();
        audio_recorder = null;
    }
    submit_file = null;
    submit_filename = "";
    $("#image").val('').show();
    $("#recording").remove();
    $('#record_button').toggle(navigator.getMedia != undefined && window.MediaRecorder != undefined);
    $('#stop_button').hide();
}

/* the cool down function (DO NOT CALL THIS DIRECTLY) */
function cool_down() {
    "use strict";
    if (html5) {
        localStorage.cool_down_timer = cool_down_timer;
    }
    if (cool_down_timer <= 0) {
        clearInterval(cool_down_interval);
        $("#cool_down").text("");
        $("#submit_button").prop("disabled", false);
        if (auto_post) {
            submit_chat();
        }
    } else {
        $("#cool_down").text(cool_down_timer);
        $("#submit_button").prop("disabled", true);
        cool_down_timer--;
    }
}

/* start a cool down, resets the interval, so no worries about calling ti twice */
function init_cool_down(){
    $("#submit_button").prop("disabled", true);
    clearInterval(cool_down_interval);
    cool_down();
    cool_down_interval = setInterval(cool_down, 1000);
}

/* simply ask for the captcha TODO: this is buggy, needs to be fixed */
function submit_captcha(){
    //$.post('/login', function(data, status){
    //});
    //return;
    div_alert(captcha_div(), false, "captcha");
    $("#alert_div_captcha .alert_message form input")[0].focus();
    $("#submit_button").prop("disabled", true);
    cool_down_timer = 0;
    setTimeout(function(){ $('#loginform').submit(); }, 200);
}

/* prompt for admin password */
function prompt_password(callback) {
    var pw_div = $("<div style='position: absolute; z-index: 1000; text-align: center; background: white;'>Admin password:<br><input type='password'></div>");
    pw_div.css({
        top: ($(window).height()-pw_div.height())/2 + "px",
        left: ($(window).width()-pw_div.width())/2 + "px"
    });
    var pw_field = pw_div.find('input');
    pw_div.keypress(function(e) {
        if (e.keyCode === 13) { // enter
            pw_div.remove();
            callback(pw_field.val());
        }
    });
    pw_div.keyup(function(e) {
        if (e.keyCode === 27) { // escape
            pw_div.remove();
            callback(null);
        }
    });
    pw_field.blur(function(e) {
        pw_div.remove();
        callback(null);
    });
    $("body").append(pw_div);
    pw_field.focus();
}

function enable_admin_mode(password)
{
    if(!password || password.length <= 0)
        return;
    $( "<style>.chat_mod_tools {display: inline}</style>" ).appendTo( "head" )
    admin_pass = password;
}

function mod_delete_post(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_delete_post: invalid param");
        return;
    }
        
    $.ajax({
        type: "POST",
        url: '/delete',
        data: {password: password, id: id}
    }).done(function (data_delete) {
        if(data_delete.success)
            div_alert("success");
        else
            div_alert("failure");
    });
}

function mod_wipe_post(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_wipe_post: invalid param");
        return;
    }
        
    $.ajax({
        type: "POST",
        url: '/wipe',
        data: {password: password, id: id}
    }).done(function (data_delete) {
        if(data_delete.success)
            div_alert("success");
        else
            div_alert("failure");
    });
}

function mod_warn_poster(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_warn_poster: invalid param");
        return;
    }
    
    var reason = window.prompt("Warning reason","");
    // reason = "<div style='background:red;padding:30px;margin:0;'><b>Warning from admin:</b><br><br>"+reason+"<br></div>"
    $.ajax({
        type: "POST",
        url: '/warn',
        data: {password: password, id: id, reason: reason}
    }).done(function (data_warn) {
        console.log(data_warn);
        if(data_warn.success)
            div_alert("success");
        else if (data_warn.failure)
            div_alert("failure:", data_warn.failure);
        else
            div_alert("failure");
    });
}

function mod_silent_poster(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_silent_poster: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/silent',
        data: {password: password, id: id}
    }).done(function (data_warn) {
        console.log(data_warn);
        if(data_warn.success)
            div_alert("success");
        else if (data_warn.failure)
            div_alert("failure:", data_warn.failure);
        else
            div_alert("failure");
    });
}

function mod_unsilent_poster(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_unsilent_poster: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/unsilent',
        data: {password: password, id: id}
    }).done(function (data_warn) {
        console.log(data_warn);
        if(data_warn.success)
            div_alert("success");
        else if (data_warn.failure)
            div_alert("failure:", data_warn.failure);
        else
            div_alert("failure");
    });
}


function mod_pin_post(id, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0)
    {
        console.log("mod_pin_post: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/pin',
        data: {password: password, id: id}
    }).done(function (data_warn) {
        console.log(data_warn);
        if(data_warn.success)
            div_alert("success");
        else if (data_warn.failure)
            div_alert("failure:", data_warn.failure);
        else
            div_alert("failure");
    });
}

function mod_ban_poster(id, board, password)
{
    if(!password || password.length <= 0 || !id || id.length <= 0 || !board || board.length <= 0)
    {
        console.log("mod_ban_poster: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/ban',
        data: {password: password, board: board, id: id}
    }).done(function (data_ban) {
        if(data_ban.success)
            div_alert("success");
        else
            div_alert("failure");
    });
}

function mod_unban_poster(id, password)
{
    if(!password || password.length <= 0)
    {
        console.log("mod_unban_poster: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/unban',
        data: {password: password, id: id}
    }).done(function (data_ban) {
        if(data_ban.success)
            div_alert("success");
        else
            div_alert("failure");
    });
}


function mod_set(id, password, message)
{
    if(!password || password.length <= 0)
    {
        console.log("mod_unban_poster: invalid param");
        return;
    }
    
    $.ajax({
        type: "POST",
        url: '/set',
        data: {password: password, id: id, text: message}
    }).done(function (data_ban) {
        if(data_ban.success)
            div_alert("success");
        else
            div_alert("failure");
    });
}


function submit_chat() {
    "use strict";

    if(!convos.includes($("#convo").val()) && $("#convo").val() !== "")
        cool_down_timer+=14;

    last_post = $("#body").val();
    /*if (get_cookie("password_livechan") === '') {
        submit_captcha();
        $("#submit_button").prop("value", "Submit (Auto)");
        auto_post = true;
        return false;
    }*/

    $("#submit_button").prop("value", "Submit");

    auto_post = false;

    if (html5) {
        localStorage.name = $("#name").val();
        localStorage.theme = $("#theme_select").val();
    }

    if ($("#body").val() === '' && $("#image").val() === '') {
        return;
    }

    var msg = $("#body").val();
    if (msg.indexOf('//') !== 0 && msg.indexOf('/') === 0) {
        var cmdend = msg.indexOf(' ');
        if (cmdend <= 0) {
            cmdend = msg.length;
        }
        var cmd = msg.substring(1, cmdend).replace("\n", '');
        var param = msg.substring(cmdend + 1, msg.length).replace("\n", '');
        $("#body").val('');
        switch (cmd) {
        case "admin":
            if(param) {
                enable_admin_mode(param);
            } else {
                prompt_password(enable_admin_mode);
            }
            break; 
        case "stream":
                var tempName = Math.random().toString(36).substring(2);
                var options = "";
                if (param) {
                    if (param == "webcam") {
                        options = "&type=1";
                    } else if (param == "desktop") {
                        options = "&type=0";
                    }
                }
                window.open('https://' + document.location.host + '/js/stream/cam.html?name=' + tempName + options, tempName, "width=800, height=600");
                var el = $("#body")[0];
                var tempHash = Sha256.hash(tempName);
                    el.value += 'stream: '+'https://' + document.location.host + '/js/stream/cam.html?hash=' + tempHash;
                break;
        case "c":
        case "cache":
            if (param) {
                max_chats = parseInt(param);
                if (!(max_chats > 0)) { max_chats = 100; }
                if (localStorage) {
                    localStorage.max_chats = max_chats;
                }
                pull_chats(chat_id);
            } else {
                div_alert("usage: /highlight [javascript regex]");
            }
            break;
        case "delete":
            prompt_password(function(password) {
                mod_delete_post(param, password);
            });
            break;
        case "wipe":
            prompt_password(function(password) {
                mod_wipe_post(param, password);
            });
            break;
        case "warn":
            prompt_password(function(password) {
                mod_warn_poster(param, password);
            });
            break;
        case "silent":
            prompt_password(function(password) {
                mod_silent_poster(param, password);
            });
            break;
        case "unsilent":
            prompt_password(function(password) {
                mod_unsilent_poster(param, password);
            });
            break;
        case "pin":
            prompt_password(function(password) {
                mod_pin_post(param, password);
            });
            break;
        case "ban":
            prompt_password(function(password) {
                mod_ban_poster(param[0], param[1], password);
            });
            break;
        case "unban":
            prompt_password(function(password) {
                mod_unban_poster(param, password);
            });
            break;
        case "set":
            var id = param.split(' ', 1)[0];
            var msg = param.substr(param.indexOf(" ")+1, param.length).replace(/\n/g, "\r\n");
            prompt_password(function(password) {
                mod_set(id, password, msg);
            });
            /*param = param.split(' ');
            $.ajax({
                type: "POST",
                url: '/set',
                data: {id: param[0], text: param.splice(1).join(' ')}
            }).done(function (data_delete) {
                if(data_delete.success)
                    div_alert("success");
                else
                    div_alert("failure");
            });*/
            break;
        case "p":
        case "priv":
            param = param.split(' ');
            let name = $("#name")[0].value;
            name = name == "" ? "Kot" : name;
            let name_index = name.indexOf("#");
            name = name_index == -1 ? name : name.slice(0,name_index);
            $.ajax({
                type: "POST",
                url: '/priv',
                data: {id: param[0], text: param.splice(1).join(' '), name: name}
            }).done(function (data_delete) {
                if(data_delete.success)
                    div_alert("success");
                else
                    div_alert("failure");
            });
            break;
            
            alert(param);
            break;
        case "ignore":
            var chat_count = parseInt(param);
            if (chat_count !== NaN && ignored_ids.indexOf(chat[chat_count].identifier) === -1) {
                console.log(chat_count, chat[chat_count]);
                ignored_ids.push(chat[chat_count].identifier);
                localStorage.ignored_ids = JSON.stringify(ignored_ids);
            }
            $('#unignore_button').html('Unignore ' + ignored_ids.length + ' memes');
            break;
        case "unignore":
            localStorage.ignored_ids = JSON.stringify([]);
            ignored_ids = [];
            break;
        case "refresh":
            prompt_password(function(password) {
                if (password) {
                    $.ajax({
                        type: "POST",
                        url: '/refresh',
                        data: {password: password}
                    }).done(function (data_delete) {
                        if(data_delete.success)
                            div_alert("success");
                        else
                            div_alert("failure");
                    });
                }
            });
            break;
        case "help":
        default:
            div_alert(
                "/cache [number] - set number of posts shown\n"+
                "/priv [post_number] [text] - send private message to user\n"+
                "/ignore [post_number] - ignore user\n"+
                "/stream - stream from webcam\n"+
                "/help - display this text\n\n"+
                "Put #color after nickname to set nick color. Available colors:\n"+
                "red blue gray purple black brown teal navy maroon olive white\n\n"+
                "Clicking on a flag translates post to your language\n"+
                "Double-clicking on a name creates private message\n\n"+
                "On this site threads are known as \"conversations\"\n" +
                "You can change your active conversation from the default \"General\" in the second text box\n\n"+
                "For list of bot commands type .help"
            );
        }
        return;
    } else if (FormData) {
        if (submit_file != null) {
            $("#image").prop("disabled", true);
        }
        var data = new FormData($("#comment-form")[0]);
        if (submit_file != null) {
            $("#image").prop("disabled", false);
            data.append("image", submit_file, submit_filename);
        }
        $.ajax({
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress",function(event) {
                    if (event.lengthComputable) {
                        var button = document.getElementById("submit_button")
                        var percent = (event.loaded / event.total) * 100;
                        button.value = "Submit ("+Math.floor(percent)+"%)"
                    }
                },false)
                return xhr;
            },
            type: "POST",
            url: $("#comment-form").attr("action"),
            dataType: "json",
            data: data,
            contentType: false,
            processData: false,
            success: function() {
                document.getElementById("submit_button").value = "Submit";
            }
        }).done(handle_post_response);
    } else {
        $("#comment-form").submit();
    }

    if (!admin_mode) {
        cool_down_timer += 3
        $("#submit_button").prop("disabled", true);
    }

    if (html5) {
        localStorage.cool_down_timer = cool_down_timer;
    }

    return false;
}

function handle_post_response(resp) {
    if(typeof(resp)=="string") resp = JSON.parse(resp);
    console.log(resp);
    if (resp.failure && resp.failure === "session_expiry") {
        $("#body").val(last_post);
        submit_captcha();
    } else if (resp.failure && resp.failure === "ban_violation") {
        div_alert("You've been banned.");
        init_cool_down();
    } else if (resp.failure && resp.failure === "proxy") {
        div_alert("You are proxy.");
        init_cool_down();
    } else if (resp.failure) {
        div_alert(resp.failure);
        init_cool_down();
    } else if (resp.id /*&& !my_ids.includes(resp.id)*/) { // why exclude your own ids?

        clear_fields();
        init_cool_down();
        my_ids.push(resp.id);
        if (html5) {
            localStorage.my_ids = JSON.stringify(my_ids);
        }
        if (quote_links_to[resp.id]) {
            quote_links_to[resp.id].forEach(function(link) {
                $(link).text($(link).text() + " (You)");
            });
        }
    } else if (resp.success === "captcha") {
        $("#submit_button").prop("disabled", false);
        $("#alert_div_captcha").remove();
        if (auto_post) {
            setTimeout(function(){submit_chat();}, 200);
        }
    }
}

/* inserts quoted id at the cursor */
function quote(id) {
    "use strict";

    var el = $("#body")[0];
    var text = ">>" + id + "\n";
    var val = el.value,
        endIndex, range;
    if (el.selectionStart !== undefined && el.selectionEnd !== undefined) {
        endIndex = el.selectionEnd;
        el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    } else if (document.selection !== undefined && document.selection.createRange !== undefined) {
        el.focus();
        range = document.selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
    }

    // set conversation
    if (convos.includes(get_convo(), convos)) {
        $("#convo").val(chat[id].convo);
        apply_filter();
    }
}

function wrapText(openTag) {
    var textArea = document.getElementById('body');
    var closeTag = '[/'+openTag+']';
    var openTag = '['+openTag+']';

    if (typeof(textArea.selectionStart) != "undefined") {
        var begin = textArea.value.substr(0, textArea.selectionStart);
        var selection = textArea.value.substr(textArea.selectionStart, textArea.selectionEnd - textArea.selectionStart);
        var end = textArea.value.substr(textArea.selectionEnd);
        var position = begin.length + openTag.length;
        if (position < 0){ position = position * -1;}
        if (selection === "") {
        	textArea.value = begin + openTag + selection + closeTag + end;
          textArea.focus();
          textArea.setSelectionRange(position, position);
        } else {
        	textArea.value = begin + openTag + selection + closeTag + end;
          textArea.focus();
          var position = begin.length + openTag.length + selection.length;
          textArea.setSelectionRange(position, position);
        }
    }
    return false;
}
