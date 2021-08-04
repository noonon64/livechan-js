"use strict";

//  var elite = document.getElementById("elite"),
//    leet = document.getElementById("leet"),
//    randomcase = document.getElementById("randomcase"),
//    advanced = document.getElementById("advanced"),
//    btn = document.getElementById("btn");

  // http://en.wikipedia.org/wiki/Leet
  // http://www.catb.org/jargon/html/crackers.html

  var _leet_alphabets = { // common
    "a": "4",
    "b": "8",
    "e": "3",
    "f": "ph",
    "g": "6", // or 9
    "i": "1", // or |
    "o": "0",
    "s": "5",
    "t": "7" // or +
  };/*,
    _leet_alphabets2 = { // less common
      "c": "(", // or k or |< or /<
      "d": "<|",
      "h": "|-|",
      "k": "|<", // or /<
      "l": "|", // or 1
      "m": "|\\/|",
      "n": "|\\|",
      "p": "|2",
      "u": "|_|",
      "v": "/", // or \/
      "w": "//", // or \/\/
      "x": "><",
      "y": "'/"
    };

  var _leet_words = l33tKeys({
    "am": "m",
    "are": "r",
    "at": "@",
    "thanks": "thx",
    "your": "ur",

    "cool": "kewl",
    "defeated": "pwned",
    "dude": "d00d",
    "fear": "ph33r", // or ph34r
    "fool": "f00",
    "freak": "phreak",
    "hacker": "h4x0r",
    "lamer": "l4m3r",
    "mad": "m4d",
    "newbie": "n00b",
    "own": "pwn",
    "phone": "fone",
    "porn": "pr0n", // or n0rp
    "rocks": "roxxorz",
    "skill": "sk1llz",
    "sucks": "sux0r",
    "the": "t3h",
    "uber": "ub3r", // or |_|83r
    "yay": "w00t",
    "yo": "j0",
    "you": "j00" // or U
  });

  function l33tKeys(dict) {
    var l33tDict = {};
    for (var word in dict) {
      if (dict.hasOwnProperty(word)) {
        l33tDict[changeLetters(word)] = dict[word];
      }
    }
    return l33tDict;
  }
*/
  function changeLetters(text, letterSubsts) { // letterSubsts may be alphabet or alphabet2
    // letterSubsts = advanced.checked ? alphabets || alphabets2 : alphabets;
    return text.toLowerCase().replace(/[a-z]/g, function(letter) {
      return letterSubsts[letter] || letter;
    })
  };

  function changeWords(text) { // change special words
    return text.replace(
      /\w+/g,
      function(word) {
        return words[word] ? words[word] : word;
      }
    );
  }

  function randomizeCase(text) { // RANdOMiZE CAsE
    var chr = "";
    for (var i = 0; i < text.length; i++) {
      chr = text[i];
      if (Math.random() > 0.5) {
        // text = text.replace(text[i], text[i].toUpperCase());
        text = text.substr(0,i) + chr.toUpperCase() + text.substr(i+1);
      } else {
        text = text.substr(0,i) + chr.toLowerCase() + text.substr(i+1);
      }// else keep lower case
    }
    return text;
  }

  function toL33t(text) {
    var l33tText = text;
    l33tText = changeLetters(l33tText, _leet_alphabets);
    //l33tText = changeWords(l33tText);
    l33tText = randomizeCase(l33tText);
    return l33tText;
  }