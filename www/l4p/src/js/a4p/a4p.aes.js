'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * AES implementation in JavaScript (c) Chris Veness 2005-2012
 * see http://csrc.nist.gov/publications/PubsFIPS.html#197
 */
a4p.Aes = (function () {

    var Aes = {};

    // Public API

    /**
     * Encrypt a text using AES encryption in Counter mode of operation
     *
     * Unicode multi-byte character safe
     *
     * @param {String} plaintext Source text to be encrypted
     * @param {String} stringkey The key (128, 192, or 256 bits long)
     * @returns {string}         Encrypted text
     */
    Aes.encrypt = function (plaintext, stringkey) {
        var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
        if (!(stringkey.length == 16 || stringkey.length == 24 || stringkey.length == 32)) return '';  // standard allows 128/192/256 bit keys
        var key = new Array(stringkey.length);
        for (var i = 0; i < stringkey.length; i++) key[i] = stringkey.charCodeAt(i) & 0xff;
        var counterBlock = new Array(blockSize);
        var keySchedule = keyExpansion(key);
        var blockCount = Math.ceil(plaintext.length / blockSize);
        var ciphertxt = new Array(blockCount);

        for (var i = 0; i < blockSize; i++) counterBlock[i] = 0;
        for (var b = 0; b < blockCount; b++) {
            for (var i = 0; i < blockSize; i++) {
                counterBlock[i] ^= plaintext.charCodeAt(b * blockSize + i) & 0xff;
            }

            var cipherCntr = cipher(counterBlock, keySchedule);

            // block size is reduced on final block : TODO : do not reduce but write length
            var blockLength = b < blockCount - 1 ? blockSize : (plaintext.length - 1) % blockSize + 1;
            var cipherChar = new Array(blockLength);
            for (var i = 0; i < blockLength; i++) {
                cipherChar[i] = String.fromCharCode(cipherCntr[i]);
            }
            ciphertxt[b] = cipherChar.join('');

            //for (var i = 0; i < blockSize; i++) counterBlock[i] = cipherCntr[i];
            for (var i = 0; i < blockSize; i++) counterBlock[i] = 0;
        }

        // Array.join is more efficient than repeated string concatenation in IE
        return ciphertxt.join('');
    };

    /**
     * Decrypt a text encrypted by AES in counter mode of operation
     *
     * @param {String} ciphertext Source text to be decrypted
     * @param {String} stringkey  The key (128, 192, or 256 bits long)
     * @returns {String}          Decrypted text
     */
    Aes.decrypt = function (ciphertext, stringkey) {
        var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
        if (!(stringkey.length == 16 || stringkey.length == 24 || stringkey.length == 32)) return '';  // standard allows 128/192/256 bit keys
        var key = new Array(stringkey.length);
        for (var i = 0; i < stringkey.length; i++) key[i] = stringkey.charCodeAt(i) & 0xff;
        var counterBlock = new Array(blockSize);
        var keySchedule = keyExpansion(key);
        var blockCount = Math.ceil(ciphertext.length / blockSize);
        var plaintxt = new Array(blockCount);

        for (var i = 0; i < blockSize; i++) counterBlock[i] = 0;
        for (var b = 0; b < blockCount; b++) {
            for (var i = 0; i < blockSize; i++) {
                counterBlock[i] ^= ciphertext.charCodeAt(b * blockSize + i) & 0xff;
            }

            var cipherCntr = decipher(counterBlock, keySchedule);

            // block size is reduced on final block : TODO : do not reduce but read length
            var blockLength = b < blockCount - 1 ? blockSize : (ciphertext.length - 1) % blockSize + 1;
            var cipherChar = new Array(blockLength);
            for (var i = 0; i < blockLength; i++) {
                cipherChar[i] = String.fromCharCode(cipherCntr[i]);
            }
            plaintxt[b] = cipherChar.join('');

            //for (var i = 0; i < blockSize; i++) counterBlock[i] = cipherCntr[i];
            for (var i = 0; i < blockSize; i++) counterBlock[i] = 0;
        }

        // join array of blocks into single plaintext string
        return plaintxt.join('');
    };

    /**
     * Encrypt a text using AES encryption in Counter mode of operation
     *
     * Unicode multi-byte character safe
     *
     * @param {String} plaintext Source text to be encrypted
     * @param {String} stringkey The key (128, 192, or 256 bits long)
     * @returns {string}         Encrypted text
     */
    Aes.ctrEncrypt = function (plaintext, stringkey) {
        var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
        if (!(stringkey.length == 16 || stringkey.length == 24 || stringkey.length == 32)) return '';  // standard allows 128/192/256 bit keys
        plaintext = a4p.Utf8.encode(plaintext);
        //var t = new Date();  // timer
        var key = new Array(stringkey.length);
        for (var i = 0; i < stringkey.length; i++) key[i] = stringkey[i] & 0xff;

        // initialise 1st 8 bytes of counter block with nonce (NIST SP800-38A §B.2): [0-1] = millisec,
        // [2-3] = random, [4-7] = seconds, together giving full sub-millisec uniqueness up to Feb 2106
        var counterBlock = new Array(blockSize);

        var nonce = (new Date()).getTime();  // timestamp: milliseconds since 1-Jan-1970
        var nonceMs = nonce % 1000;
        var nonceSec = Math.floor(nonce / 1000);
        var nonceRnd = Math.floor(Math.random() * 0xffff);

        for (var i = 0; i < 2; i++) counterBlock[i] = (nonceMs >>> i * 8) & 0xff;
        for (var i = 0; i < 2; i++) counterBlock[i + 2] = (nonceRnd >>> i * 8) & 0xff;
        for (var i = 0; i < 4; i++) counterBlock[i + 4] = (nonceSec >>> i * 8) & 0xff;

        // and convert it to a string to go on the front of the ciphertext
        var ctrTxt = '';
        for (var i = 0; i < 8; i++) ctrTxt += String.fromCharCode(counterBlock[i]);

        // generate key schedule - an expansion of the key into distinct Key Rounds for each round
        var keySchedule = keyExpansion(key);

        var blockCount = Math.ceil(plaintext.length / blockSize);
        var ciphertxt = new Array(blockCount);  // ciphertext as array of strings

        for (var b = 0; b < blockCount; b++) {
            // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
            // done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
            for (var c = 0; c < 4; c++) counterBlock[15 - c] = (b >>> c * 8) & 0xff;
            for (var c = 0; c < 4; c++) counterBlock[15 - c - 4] = (b / 0x100000000 >>> c * 8)

            var cipherCntr = cipher(counterBlock, keySchedule);  // -- encrypt counter block --

            // block size is reduced on final block
            var blockLength = b < blockCount - 1 ? blockSize : (plaintext.length - 1) % blockSize + 1;
            var cipherChar = new Array(blockLength);

            for (var i = 0; i < blockLength; i++) {  // -- xor plaintext with ciphered counter char-by-char --
                cipherChar[i] = cipherCntr[i] ^ plaintext.charCodeAt(b * blockSize + i);
                cipherChar[i] = String.fromCharCode(cipherChar[i]);
            }
            ciphertxt[b] = cipherChar.join('');
        }

        // Array.join is more efficient than repeated string concatenation in IE
        var ciphertext = ctrTxt + ciphertxt.join('');
        //ciphertext = a4p.Base64.encode(ciphertext);

        //alert((new Date()) - t);
        return ciphertext;
    };

    /**
     * Decrypt a text encrypted by AES in counter mode of operation
     *
     * @param {String} ciphertext Source text to be decrypted
     * @param {String} stringkey  The key (128, 192, or 256 bits long)
     * @returns {String}          Decrypted text
     */
    Aes.ctrDecrypt = function (ciphertext, stringkey) {
        var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
        if (!(stringkey.length == 16 || stringkey.length == 24 || stringkey.length == 32)) return '';  // standard allows 128/192/256 bit keys
        //ciphertext = a4p.Base64.decode(ciphertext);
        //var t = new Date();  // timer
        var key = new Array(stringkey.length);
        for (var i = 0; i < stringkey.length; i++) key[i] = stringkey[i] & 0xff;

        // recover nonce from 1st 8 bytes of ciphertext
        var counterBlock = new Array(8);
        var ctrTxt = ciphertext.slice(0, 8);
        for (var i = 0; i < 8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);

        // generate key schedule
        var keySchedule = keyExpansion(key);

        // separate ciphertext into blocks (skipping past initial 8 bytes)
        var nBlocks = Math.ceil((ciphertext.length - 8) / blockSize);
        var ct = new Array(nBlocks);
        for (var b = 0; b < nBlocks; b++) ct[b] = ciphertext.slice(8 + b * blockSize, 8 + b * blockSize + blockSize);
        ciphertext = ct;  // ciphertext is now array of block-length strings

        // plaintext will get generated block-by-block into array of block-length strings
        var plaintxt = new Array(ciphertext.length);

        for (var b = 0; b < nBlocks; b++) {
            // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
            for (var c = 0; c < 4; c++) counterBlock[15 - c] = ((b) >>> c * 8) & 0xff;
            for (var c = 0; c < 4; c++) counterBlock[15 - c - 4] = (((b + 1) / 0x100000000 - 1) >>> c * 8) & 0xff;

            var cipherCntr = cipher(counterBlock, keySchedule);  // encrypt counter block

            var plaintxtByte = new Array(ciphertext[b].length);
            for (var i = 0; i < ciphertext[b].length; i++) {
                // -- xor plaintxt with ciphered counter byte-by-byte --
                plaintxtByte[i] = cipherCntr[i] ^ ciphertext[b].charCodeAt(i);
                plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
            }
            plaintxt[b] = plaintxtByte.join('');
        }

        // join array of blocks into single plaintext string
        var plaintext = plaintxt.join('');
        plaintext = a4p.Utf8.decode(plaintext);  // decode from UTF8 back to Unicode multi-byte chars

        //alert((new Date()) - t);
        return plaintext;
    };

    /**
     * AES Cipher function: encrypt 'input' state with Rijndael algorithm
     *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
     *
     * @param {Number[]} input 16-byte (128-bit) input state array
     * @param {Number[][]} w   Key schedule as 2D byte-array (Nr+1 x Nb bytes)
     * @returns {Number[]}     Encrypted output state array
     */
    function cipher(input, w) {
        var Nb = 4; // Number of columns (32-bit words) comprising the State. For this standard, Nb = 4.
        var Nr = w.length / Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys
        var round = 0;
        var trace;
        var state = [
            [],
            [],
            [],
            []
        ];  // initialise 4xNb byte-array 'state' with input [§3.4]
        for (var i = 0; i < 4 * Nb; i++) state[i % 4][Math.floor(i / 4)] = input[i];

        //trace = new Array(4 * Nb);
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(input[i]);
        //console.log('round['+round+'] input='+a4p.Hex.encode(trace.join('')));

        //trace = new Array(4 * Nb);
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(w[round * 4 + Math.floor(i / 4)][i % 4]);
        //console.log('round['+round+'] k_sch='+a4p.Hex.encode(trace.join('')));

        state = addRoundKey(state, w, round, Nb);

        for (round++; round < Nr; round++) {
            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] start='+a4p.Hex.encode(trace.join('')));

            state = subBytes(state, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] s_box='+a4p.Hex.encode(trace.join('')));

            state = shiftRows(state, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] s_row='+a4p.Hex.encode(trace.join('')));

            state = mixColumns(state, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] m_col='+a4p.Hex.encode(trace.join('')));

            //trace = new Array(4 * Nb);
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(w[round * 4 + Math.floor(i / 4)][i % 4]);
            //console.log('round['+round+'] k_sch='+a4p.Hex.encode(trace.join('')));

            state = addRoundKey(state, w, round, Nb);
        }

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] start='+a4p.Hex.encode(trace.join('')));

        state = subBytes(state, Nb);

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] s_box='+a4p.Hex.encode(trace.join('')));

        state = shiftRows(state, Nb);

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] s_row='+a4p.Hex.encode(trace.join('')));

        state = addRoundKey(state, w, round, Nb);

        var output = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        for (var i = 0; i < (4 * Nb); i++) output[i] = state[i % 4][Math.floor(i / 4)];

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(output[i]);
        //console.log('round['+round+'] output='+a4p.Hex.encode(trace.join('')));

        return output;
    }

    /**
     * AES Cipher function: decrypt 'input' state with Rijndael algorithm
     *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
     *
     * @param {Number[]} input 16-byte (128-bit) input state array
     * @param {Number[][]} w   Key schedule as 2D byte-array (Nr+1 x Nb bytes)
     * @returns {Number[]}     Encrypted output state array
     */
    function decipher(input, w) {
        var Nb = 4; // Number of columns (32-bit words) comprising the State. For this standard, Nb = 4.
        var Nr = w.length / Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys
        var round = Nr;
        var trace;
        var state = [
            [],
            [],
            [],
            []
        ];  // initialise 4xNb byte-array 'state' with input [§3.4]
        for (var i = 0; i < 4 * Nb; i++) state[i % 4][Math.floor(i / 4)] = input[i];

        //trace = new Array(4 * Nb);
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(input[i]);
        //console.log('round['+round+'] input='+a4p.Hex.encode(trace.join('')));

        //trace = new Array(4 * Nb);
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(w[round * 4 + Math.floor(i / 4)][i % 4]);
        //console.log('round['+round+'] k_sch='+a4p.Hex.encode(trace.join('')));

        state = addRoundKey(state, w, round, Nb);

        for (round--; round > 0; round--) {
            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] start='+a4p.Hex.encode(trace.join('')));

            state = invShiftRows(state, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] s_row='+a4p.Hex.encode(trace.join('')));

            state = invSubBytes(state, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] s_box='+a4p.Hex.encode(trace.join('')));

            //trace = new Array(4 * Nb);
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(w[round * 4 + Math.floor(i / 4)][i % 4]);
            //console.log('round['+round+'] k_sch='+a4p.Hex.encode(trace.join('')));

            state = addRoundKey(state, w, round, Nb);

            // trace
            //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
            //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
            //console.log('round['+round+'] k_add='+a4p.Hex.encode(trace.join('')));

            state = invMixColumns(state, Nb);
        }

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] start='+a4p.Hex.encode(trace.join('')));

        state = invShiftRows(state, Nb);

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] s_row='+a4p.Hex.encode(trace.join('')));

        state = invSubBytes(state, Nb);

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(state[i % 4][Math.floor(i / 4)]);
        //console.log('round['+round+'] s_box='+a4p.Hex.encode(trace.join('')));

        //trace = new Array(4 * Nb);
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(w[round * 4 + Math.floor(i / 4)][i % 4]);
        //console.log('round['+round+'] k_sch='+a4p.Hex.encode(trace.join('')));

        state = addRoundKey(state, w, round, Nb);

        var output = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        for (var i = 0; i < (4 * Nb); i++) output[i] = state[i % 4][Math.floor(i / 4)];

        // trace
        //trace = new Array(4 * Nb);  // convert state to 1-d array before returning [§3.4]
        //for (var i = 0; i < (4 * Nb); i++) trace[i] = String.fromCharCode(output[i]);
        //console.log('round['+round+'] output='+a4p.Hex.encode(trace.join('')));

        return output;
    }

    /**
     * Perform Key Expansion to generate a Key Schedule
     *
     * @param {Number[]} key Key as 16/24/32-byte array
     * @returns {Number[][]} Expanded key schedule as 2D byte-array (Nr+1 x Nb bytes)
     */
    function keyExpansion(key) {  // generate Key Schedule (byte-array Nr+1 x Nb) from Key [§5.2]
        var Nb = 4; // Number of columns (32-bit words) comprising the State. For this standard, Nb = 4.
        var Nk = key.length / 4;  // Number of 32-bit words comprising the Cipher Key. Nk = 4/6/8 for 128/192/256-bit keys
        var Nr = Nk + 6;       // Number of rounds. Nr = 10/12/14 for 128/192/256-bit keys
        var trace;

        var w = new Array(Nb * (Nr + 1));
        var temp = new Array(4);

        for (var i = 0; i < Nk; i++) {
            var r = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
            w[i] = r;
            /*
            trace = new Array(4);
            for (var t = 0; t < 4; t++) trace[t] = String.fromCharCode(w[i][t]);
            console.log('w['+i+']='+a4p.Hex.encode(trace.join('')));
            */
        }

        for (var i = Nk; i < (Nb * (Nr + 1)); i++) {
            w[i] = new Array(4);
            for (var t = 0; t < 4; t++) temp[t] = w[i - 1][t];
            if (i % Nk == 0) {
                temp = subWord(rotWord(temp));
                for (var t = 0; t < 4; t++) temp[t] ^= rCon[i / Nk][t];
            } else if (Nk > 6 && i % Nk == 4) {
                temp = subWord(temp);
            }
            for (var t = 0; t < 4; t++) w[i][t] = w[i - Nk][t] ^ temp[t];
            /*
            trace = new Array(4);
            for (var t = 0; t < 4; t++) trace[t] = String.fromCharCode(w[i][t]);
            console.log('w['+i+']='+a4p.Hex.encode(trace.join('')));
            */
        }

        return w;
    }

    function subBytes(s, Nb) {    // apply SBox to state S [§5.1.1]
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < Nb; c++) s[r][c] = sBox[s[r][c]];
        }
        return s;
    }

    function invSubBytes(s, Nb) {    // apply SBox to state S [§5.1.1]
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < Nb; c++) s[r][c] = invsBox[s[r][c]];
        }
        return s;
    }

    function shiftRows(s, Nb) {    // shift row r of state S left by r bytes [§5.1.2]
        var t = new Array(4);
        for (var r = 1; r < 4; r++) {
            for (var c = 0; c < 4; c++) t[c] = s[r][(c + r) % Nb];  // shift into temp copy
            for (var c = 0; c < 4; c++) s[r][c] = t[c];         // and copy back
        }          // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
        return s;  // see asmaes.sourceforge.net/rijndael/rijndaelImplementation.pdf
    }

    function invShiftRows(s, Nb) {    // shift row r of state S left by r bytes [§5.1.2]
        var t = new Array(4);
        for (var r = 1; r < 4; r++) {
            for (var c = 0; c < 4; c++) t[c] = s[r][c];  // shift into temp copy
            for (var c = 0; c < 4; c++) s[r][(c + r) % Nb] = t[c];         // and copy back
        }          // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
        return s;  // see asmaes.sourceforge.net/rijndael/rijndaelImplementation.pdf
    }

    function mixColumns(s, Nb) {   // combine bytes of each col of state S [§5.1.3]
        for (var c = 0; c < 4; c++) {
            var a = new Array(4);  // 'a' is a copy of the current column from 's'
            var a2 = new Array(4);  // 'b' is a•{02} in GF(2^8)
            for (var i = 0; i < 4; i++) {
                a[i] = s[i][c];
                a2[i] = a[i] & 0x80 ? a[i] << 1 ^ 0x011b : a[i] << 1;
            }
            // a[n] ^ b[n] is a•{03} in GF(2^8)
            s[0][c] = a2[0] ^ a[1] ^ a2[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
            s[1][c] = a2[1] ^ a[2] ^ a2[2] ^ a[3] ^ a[0]; // a0 * 2*a1 + 3*a2 + a3
            s[2][c] = a2[2] ^ a[3] ^ a2[3] ^ a[0] ^ a[1]; // a0 + a1 + 2*a2 + 3*a3
            s[3][c] = a2[3] ^ a[0] ^ a2[0] ^ a[1] ^ a[2]; // 3*a0 + a1 + a2 + 2*a3
        }
        return s;
    }

    function invMixColumns(s, Nb) {   // combine bytes of each col of state S [§5.1.3]
        for (var c = 0; c < 4; c++) {
            var a = new Array(4);  // 'a' is a copy of the current column from 's'
            var a2 = new Array(4);  // 'b' is a•{02} in GF(2^8)
            var a4 = new Array(4);  // 'c' is b•{02} = a•{04} in GF(2^8)
            var a8 = new Array(4);  // 'd' is c•{02} = a•{08} in GF(2^8)
            for (var i = 0; i < 4; i++) {
                a[i] = s[i][c];
                a2[i] = a[i] & 0x80 ? a[i] << 1 ^ 0x011b : a[i] << 1;
                a4[i] = a2[i] & 0x80 ? a2[i] << 1 ^ 0x011b : a2[i] << 1;
                a8[i] = a4[i] & 0x80 ? a4[i] << 1 ^ 0x011b : a4[i] << 1;
            }
            // a[n] ^ b[n] is a•{03} in GF(2^8)
            s[0][c] = a8[0] ^ a4[0] ^ a2[0] ^ a8[1] ^ a2[1] ^ a[1] ^ a8[2] ^ a4[2] ^ a[2] ^ a8[3] ^ a[3]; // e*a0 + b*a1 + d*a2 + 9*a3
            s[1][c] = a8[1] ^ a4[1] ^ a2[1] ^ a8[2] ^ a2[2] ^ a[2] ^ a8[3] ^ a4[3] ^ a[3] ^ a8[0] ^ a[0]; // 9*a0 * e*a1 + b*a2 + d*a3
            s[2][c] = a8[2] ^ a4[2] ^ a2[2] ^ a8[3] ^ a2[3] ^ a[3] ^ a8[0] ^ a4[0] ^ a[0] ^ a8[1] ^ a[1]; // d*a0 + 9*a1 + e*a2 + b*a3
            s[3][c] = a8[3] ^ a4[3] ^ a2[3] ^ a8[0] ^ a2[0] ^ a[0] ^ a8[1] ^ a4[1] ^ a[1] ^ a8[2] ^ a[2]; // b*a0 + d*a1 + 9*a2 + e*a3
        }
        return s;
    }

    function addRoundKey(state, w, rnd, Nb) {  // xor Round Key into state S [§5.1.4]
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < Nb; c++) state[r][c] ^= w[rnd * 4 + c][r];
        }
        return state;
    }

    function subWord(w) {    // apply SBox to 4-byte word w
        for (var i = 0; i < 4; i++) w[i] = sBox[w[i]];
        return w;
    }

    function rotWord(w) {    // rotate 4-byte word w left by one byte
        var tmp = w[0];
        for (var i = 0; i < 3; i++) w[i] = w[i + 1];
        w[3] = tmp;
        return w;
    }

    // sBox is pre-computed multiplicative inverse in GF(2^8) used in subBytes
    var sBox = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
        0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
        0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
        0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
        0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
        0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
        0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
        0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
        0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
        0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
        0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
        0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
        0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
        0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
        0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
        0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];

    // sBox is pre-computed multiplicative inverse in GF(2^8) used in invsubBytes
    var invsBox = [0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
        0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
        0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
        0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
        0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
        0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
        0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
        0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
        0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
        0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
        0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
        0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
        0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
        0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
        0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
        0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d];

    // rCon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [§5.2]
    var rCon = [
        [0x00, 0x00, 0x00, 0x00],
        [0x01, 0x00, 0x00, 0x00],
        [0x02, 0x00, 0x00, 0x00],
        [0x04, 0x00, 0x00, 0x00],
        [0x08, 0x00, 0x00, 0x00],
        [0x10, 0x00, 0x00, 0x00],
        [0x20, 0x00, 0x00, 0x00],
        [0x40, 0x00, 0x00, 0x00],
        [0x80, 0x00, 0x00, 0x00],
        [0x1b, 0x00, 0x00, 0x00],
        [0x36, 0x00, 0x00, 0x00]
    ];

    // Private API
    // helper functions and variables hidden within this function scope

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Aes;
})(); // Invoke the function immediately to create this class.
