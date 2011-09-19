(function() {
  var $, d, parsePGN, pieceDict, symDict, toCart, toFAN, toFile, toIFile, toPiece, validSquare_;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  $ = jQuery;
  pieceDict = {
    P: 'pawn',
    K: 'king',
    N: 'knight',
    B: 'bishop',
    R: 'rook',
    Q: 'queen'
  };
  symDict = {
    pawn: 'P',
    knight: 'N',
    bishop: 'B',
    rook: 'R',
    queen: 'Q',
    king: 'K'
  };
  validSquare_ = function(x, y) {
    return (0 < x && x < 9) && (0 < y && y < 9);
  };
  toIFile = function(c) {
    return 'abcdefgh'.indexOf(c) + 1;
  };
  toFile = function(i) {
    return 'abcdefgh'[i - 1];
  };
  toFAN = function(x, y) {
    return "" + (toFile(x)) + y;
  };
  toCart = function(fan) {
    return [toIFile(fan[0]), parseInt(fan[1])];
  };
  d = function(message) {
    return console.debug(message);
  };
  toPiece = function(c, col) {
    if (col == null) {
      col = false;
    }
    if (col) {
      return "" + (c.toUpperCase() === c ? 'white' : 'black') + " " + (pieceDict[c.toUpperCase()] || 'pawn');
    } else {
      return pieceDict[c] || 'pawn';
    }
  };
  parsePGN = function(text) {
    var i, line, lines, m, moveCount, moveLines, moves, returnable, _i, _len, _ref;
    returnable = [];
    lines = text.split("\n");
    moveLines = [];
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      if ($.trim(line)[0] === '[') {
        continue;
      }
      if ($.trim(line).length === 0) {
        continue;
      }
      moveLines.push($.trim(line));
    }
    moves = moveLines.join(' ');
    moveCount = parseInt(moves.match(/\d+\./g).pop());
    for (i = 1, _ref = moveCount - 1; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
      m = moves.match(new RegExp("" + i + "\\..*" + (i + 1) + "\\.", 'g'))[0].replace("" + i + ".", '').replace("" + (i + 1) + ".", '').split(/\s+/);
      returnable.push(m[0]);
      returnable.push(m[1]);
    }
    return returnable;
  };
  $.fn.chessboard = function() {
    var activatePieces, allyAt_, b, board, candidateMoves, castle, coord, displayPGN, enPassant, enemyAt_, handler, i, movePiece, pgn, pgnIndex, pieceAt, pieceMoves, placePiece, promotePawn, sidebar, size, startTurn, threatens_, turn;
    castle = {
      black: {
        long: true,
        short: true
      },
      white: {
        long: true,
        short: true
      }
    };
    enPassant = null;
    sidebar = null;
    board = $("div").addClass("jquery-chess-board");
    size = 50;
    turn = 'white';
    pgn = [];
    pgnIndex = 0;
    window.enPassant = function() {
      return enPassant;
    };
    b = function(selector) {
      return board.find(selector);
    };
    startTurn = function() {
      b('.piece').draggable('option', 'disabled', true);
      return b(".piece." + turn).draggable('option', 'disabled', false);
    };
    placePiece = function(type, coords) {
      b("." + coords).data('contents', type);
      return $('<div>').addClass("piece " + type).width(size).height(size).data('pos', coords).data('type', type).offset({
        left: (toIFile(coords[0]) - 1) * size,
        top: (8 - parseInt(coords[1])) * size
      }).appendTo(board);
    };
    displayPGN = function() {
      var i, _ref;
      board.width("" + (12 * size) + "px");
      sidebar = $('<div>');
      sidebar.addClass('sidebar').css({
        left: "" + (8 * size) + "px"
      }).height(size * 8).width(size * 4).appendTo(board);
      $('<table>').height(size * 7).appendTo(sidebar);
      for (i = 0, _ref = pgn.length; i <= _ref; i += 2) {
        sidebar.find('table').append("<tr><td>" + pgn[i] + "</td><td>" + pgn[i + 1] + "</td></tr>");
      }
      $("<div class='navigation'><span class='back'>Back</span><span class='next'>Next</span></div>").height(size).css({
        left: "" + (8 * size) + "px",
        top: "" + (7 * size) + "px"
      }).appendTo(sidebar);
      return sidebar.find('span.next').click(function() {
        return handler.next();
      });
    };
    promotePawn = function(fan) {
      var col, dialog, i, piece, _i, _len, _ref;
      col = fan[1] === '1' ? 'black' : 'white';
      dialog = $('<div>');
      dialog.addClass('promotion').height(size * 3).width(size * 5).offset({
        left: size * 1.5,
        top: size * 2.5
      }).appendTo(board);
      $('<p><strong>Promote to</strong></p>').css({
        'line-height': "" + size + "px"
      }).appendTo(dialog);
      i = 0;
      _ref = ['queen', 'rook', 'bishop', 'knight'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        piece = _ref[_i];
        $('<div>').addClass("promote piece " + piece + " " + col).data('square', fan).data('type', "" + col + " " + piece).width(size).height(size).offset({
          left: (i + 0.5) * size
        }).appendTo(dialog);
        i++;
      }
      return b('.promote').click(function() {
        var square, type;
        square = $(this).data('square');
        type = $(this).data('type');
        pieceAt(square).remove();
        placePiece(type, square);
        dialog.remove();
        activatePieces();
        turn = turn === "white" ? "black" : "white";
        return startTurn();
      });
    };
    pieceAt = function(coords, ignore, add) {
      var elem, type, _i, _len, _ref;
      if (coords === ignore) {
        return null;
      }
      if (coords === add) {
        return true;
      }
      type = b("." + coords).data('contents');
      if (!(type != null)) {
        return null;
      }
      _ref = b("." + (type.replace(' ', '.')));
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if ($(elem).data('pos') === coords) {
          return $(elem);
        }
      }
    };
    movePiece = function(from, to) {
      var capture, square;
      capture = pieceAt(to);
      square = b("." + to);
      return pieceAt(from).css({
        'z-index': 5
      }).animate({
        top: square.position().top,
        left: square.position().left
      }, function() {
        b("." + from).data('contents', null);
        b("." + to).data('contents', $(this).data('type'));
        if (capture != null) {
          capture.remove();
        }
        return $(this).css({
          'z-index': 1
        }).data('oldPos', from).data('pos', to);
      });
    };
    enemyAt_ = function(coords, col, ignore, add) {
      var piece;
      if (coords === add) {
        return true;
      }
      if (coords === ignore) {
        return null;
      }
      piece = pieceAt(coords);
      if (!(piece != null)) {
        return false;
      }
      return piece.data('type').split(' ')[0] !== col;
    };
    allyAt_ = function(coords, col, ignore, add) {
      var piece;
      if (coords === add) {
        return true;
      }
      if (coords === ignore) {
        return null;
      }
      piece = pieceAt(coords);
      if (!(piece != null)) {
        return false;
      }
      return piece.data('type').split(' ')[0] === col;
    };
    activatePieces = function() {
      return b(".piece").draggable({
        disabled: true,
        revert: 'invalid',
        start: function(ev, ui) {
          var candidate, candidates, _i, _len;
          candidates = candidateMoves($(this).data('type'), $(this).data('pos'));
          b("." + ($(this).data('pos'))).toggleClass('active');
          for (_i = 0, _len = candidates.length; _i < _len; _i++) {
            candidate = candidates[_i];
            b("." + candidate).toggleClass('candidate').droppable('option', 'disabled', false);
          }
          return $(this).data('oldPos', $(this).data('pos')).data('candidates', candidates).css({
            'z-index': 5
          });
        },
        stop: function(ev, ui) {
          var candidate, _i, _len, _ref;
          b("." + ($(this).data('oldPos'))).toggleClass('active').data('contents', null);
          b("." + ($(this).data('pos'))).data('contents', $(this).data('type'));
          _ref = $(this).data('candidates');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            candidate = _ref[_i];
            b("." + candidate).toggleClass('candidate').droppable('option', 'disabled', true);
          }
          return $(this).css({
            'z-index': 1
          });
        }
      });
    };
    pieceMoves = {
      bishop: function(x, y, col, threatCheck, ignore, add) {
        var i, returnable;
        returnable = [];
        i = 1;
        while (validSquare_(x + i, y + i) && !(pieceAt(toFAN(x + i, y + i), ignore, add) != null)) {
          returnable.push(toFAN(x + i, y + i));
          i++;
        }
        if (validSquare_(x + i, y + i) && enemyAt_(toFAN(x + i, y + i), col, ignore, add)) {
          returnable.push(toFAN(x + i, y + i));
        }
        i = 1;
        while (validSquare_(x + i, y - i) && !(pieceAt(toFAN(x + i, y - i), ignore, add) != null)) {
          returnable.push(toFAN(x + i, y - i));
          i++;
        }
        if (validSquare_(x + i, y - i) && enemyAt_(toFAN(x + i, y - i), col, ignore, add)) {
          returnable.push(toFAN(x + i, y - i));
        }
        i = 1;
        while (validSquare_(x - i, y - i) && !(pieceAt(toFAN(x - i, y - i), ignore, add) != null)) {
          returnable.push(toFAN(x - i, y - i));
          i++;
        }
        if (validSquare_(x - i, y - i) && enemyAt_(toFAN(x - i, y - i), col, ignore, add)) {
          returnable.push(toFAN(x - i, y - i));
        }
        i = 1;
        while (validSquare_(x - i, y + i) && !(pieceAt(toFAN(x - i, y + i), ignore, add) != null)) {
          returnable.push(toFAN(x - i, y + i));
          i++;
        }
        if (validSquare_(x - i, y + i) && enemyAt_(toFAN(x - i, y + i), col, ignore, add)) {
          returnable.push(toFAN(x - i, y + i));
        }
        return returnable;
      },
      knight: function(x, y, col, threatCheck, ignore, add) {
        var returnable;
        returnable = [];
        if (validSquare_(x + 1, y + 2) && !allyAt_(toFAN(x + 1, y + 2), col, ignore, add)) {
          returnable.push(toFAN(x + 1, y + 2));
        }
        if (validSquare_(x + 2, y + 1) && !allyAt_(toFAN(x + 2, y + 1), col, ignore, add)) {
          returnable.push(toFAN(x + 2, y + 1));
        }
        if (validSquare_(x + 2, y - 1) && !allyAt_(toFAN(x + 2, y - 1), col, ignore, add)) {
          returnable.push(toFAN(x + 2, y - 1));
        }
        if (validSquare_(x + 1, y - 2) && !allyAt_(toFAN(x + 1, y - 2), col, ignore, add)) {
          returnable.push(toFAN(x + 1, y - 2));
        }
        if (validSquare_(x - 1, y - 2) && !allyAt_(toFAN(x - 1, y - 2), col, ignore, add)) {
          returnable.push(toFAN(x - 1, y - 2));
        }
        if (validSquare_(x - 2, y - 1) && !allyAt_(toFAN(x - 2, y - 1), col, ignore, add)) {
          returnable.push(toFAN(x - 2, y - 1));
        }
        if (validSquare_(x - 2, y + 1) && !allyAt_(toFAN(x - 2, y + 1), col, ignore, add)) {
          returnable.push(toFAN(x - 2, y + 1));
        }
        if (validSquare_(x - 1, y + 2) && !allyAt_(toFAN(x - 1, y + 2), col, ignore, add)) {
          returnable.push(toFAN(x - 1, y + 2));
        }
        return returnable;
      },
      queen: function(x, y, col, threatCheck, ignore, add) {
        return this.bishop(x, y, col, threatCheck, ignore, add).concat(this.rook(x, y, col, threatCheck, ignore, add));
      },
      king: function(x, y, col, threatCheck, ignore, add) {
        var opCol, returnable;
        returnable = [];
        if (validSquare_(x, y + 1) && !allyAt_(toFAN(x, y + 1), col, ignore, add)) {
          returnable.push(toFAN(x, y + 1));
        }
        if (validSquare_(x + 1, y + 1) && !allyAt_(toFAN(x + 1, y + 1), col, ignore, add)) {
          returnable.push(toFAN(x + 1, y + 1));
        }
        if (validSquare_(x + 1, y) && !allyAt_(toFAN(x + 1, y), col, ignore, add)) {
          returnable.push(toFAN(x + 1, y));
        }
        if (validSquare_(x + 1, y - 1) && !allyAt_(toFAN(x + 1, y - 1), col, ignore, add)) {
          returnable.push(toFAN(x + 1, y - 1));
        }
        if (validSquare_(x, y - 1) && !allyAt_(toFAN(x, y - 1), col, ignore, add)) {
          returnable.push(toFAN(x, y - 1));
        }
        if (validSquare_(x - 1, y - 1) && !allyAt_(toFAN(x - 1, y - 1), col, ignore, add)) {
          returnable.push(toFAN(x - 1, y - 1));
        }
        if (validSquare_(x - 1, y) && !allyAt_(toFAN(x - 1, y), col, ignore, add)) {
          returnable.push(toFAN(x - 1, y));
        }
        if (validSquare_(x - 1, y + 1) && !allyAt_(toFAN(x - 1, y + 1), col, ignore, add)) {
          returnable.push(toFAN(x - 1, y + 1));
        }
        if (!threatCheck) {
          opCol = col === 'white' ? 'black' : 'white';
          if (castle[col]['short'] && (!(pieceAt(toFAN(x + 1, y)) != null)) && (!(pieceAt(toFAN(x + 2, y)) != null)) && (!threatens_(toFAN(x, y), opCol)) && (!threatens_(toFAN(x + 1, y), opCol)) && (!threatens_(toFAN(x + 2, y), opCol))) {
            returnable.push(toFAN(x + 2, y));
          }
          if (castle[col]['long'] && (!(pieceAt(toFAN(x - 1, y)) != null)) && (!(pieceAt(toFAN(x - 2, y)) != null)) && (!pieceAt(toFAN(x - 3, y))) && (!threatens_(toFAN(x, y), opCol)) && (!threatens_(toFAN(x - 1, y), opCol)) && (!threatens_(toFAN(x - 2, y), opCol))) {
            returnable.push(toFAN(x - 2, y));
          }
        }
        return returnable;
      },
      pawn: function(x, y, col, threatCheck, ignore, add) {
        var returnable, yMod;
        returnable = [];
        yMod = col === "white" ? 1 : -1;
        if (!threatCheck) {
          if (pieceAt(toFAN(x, y + yMod)) == null) {
            returnable.push(toFAN(x, y + yMod));
            if (y === (col === "white" ? 2 : 7) && !pieceAt(toFAN(x + yMod * 2), ignore, add)) {
              returnable.push(toFAN(x, y + yMod * 2));
            }
          }
        }
        if (x < 8 && (enemyAt_(toFAN(x + 1, y + yMod), col, ignore, add) || threatCheck) || (enPassant === toFAN(x + 1, y + yMod))) {
          returnable.push(toFAN(x + 1, y + yMod));
        }
        if (x > 1 && (enemyAt_(toFAN(x - 1, y + yMod), col, ignore, add) || threatCheck) || (enPassant === toFAN(x - 1, y + yMod))) {
          returnable.push(toFAN(x - 1, y + yMod));
        }
        return returnable;
      },
      rook: function(x, y, col, ignore, add) {
        var i, returnable;
        returnable = [];
        i = 1;
        while (validSquare_(x, y + i) && !(pieceAt(toFAN(x, y + i), ignore, add) != null)) {
          returnable.push(toFAN(x, y + i));
          i++;
        }
        if (validSquare_(x, y + i) && enemyAt_(toFAN(x, y + i), col, ignore, add)) {
          returnable.push(toFAN(x, y + i));
        }
        i = 1;
        while (validSquare_(x + i, y) && !(pieceAt(toFAN(x + i, y), ignore, add) != null)) {
          returnable.push(toFAN(x + i, y));
          i++;
        }
        if (validSquare_(x + i, y) && enemyAt_(toFAN(x + i, y), col, ignore, add)) {
          returnable.push(toFAN(x + i, y));
        }
        i = 1;
        while (validSquare_(x, y - i) && !(pieceAt(toFAN(x, y - i), ignore, add) != null)) {
          returnable.push(toFAN(x, y - i));
          i++;
        }
        if (validSquare_(x, y - i) && enemyAt_(toFAN(x, y - i), col, ignore, add)) {
          returnable.push(toFAN(x, y - i));
        }
        i = 1;
        while (validSquare_(x - i, y) && !(pieceAt(toFAN(x - i, y), ignore, add) != null)) {
          returnable.push(toFAN(x - i, y));
          i++;
        }
        if (validSquare_(x - i, y) && enemyAt_(toFAN(x - i, y), col, ignore, add)) {
          returnable.push(toFAN(x - i, y));
        }
        return returnable;
      }
    };
    candidateMoves = function(type, fan, threatCheck, ignore, add) {
      var candidates, move, opCol, typeArray, verified, x, y, _i, _j, _len, _len2, _ref;
      verified = [];
      _ref = toCart(fan), x = _ref[0], y = _ref[1];
      typeArray = type.split(' ');
      candidates = pieceMoves[typeArray[1]](x, y, typeArray[0], threatCheck, ignore, add);
      if (threatCheck) {
        return candidates;
      }
      opCol = typeArray[0] === 'white' ? 'black' : 'white';
      if (typeArray[1] === 'king') {
        for (_i = 0, _len = candidates.length; _i < _len; _i++) {
          move = candidates[_i];
          if (!threatens_(move, opCol)) {
            verified.push(move);
          }
        }
        return verified;
      }
      for (_j = 0, _len2 = candidates.length; _j < _len2; _j++) {
        move = candidates[_j];
        if (!threatens_(b(".king." + typeArray[0]).data('pos'), opCol, fan, move)) {
          verified.push(move);
        }
      }
      return verified;
    };
    threatens_ = function(square, color, ignore, add) {
      var piece, _i, _len, _ref;
      _ref = b(".piece." + color);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        piece = _ref[_i];
        if ($(piece).data('pos') !== add) {
          if (__indexOf.call(candidateMoves($(piece).data('type'), $(piece).data('pos'), true, ignore, add), square) >= 0) {
            return true;
          }
        }
      }
      return false;
    };
    handler = {
      reset: function() {
        b('.piece').remove();
        return b('.square').data('contents', null);
      },
      getFEN: function() {
        var counter, file, rank, returnable, typeArray, _i, _len, _ref;
        returnable = '';
        for (rank = 8; rank >= 1; rank--) {
          counter = 0;
          _ref = 'abcdefgh';
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            file = _ref[_i];
            if (b("." + file + rank).data('contents')) {
              typeArray = b("." + file + rank).data('contents').split(' ');
              if (counter > 0) {
                returnable += counter;
              }
              counter = 0;
              if (typeArray[0] === 'white') {
                returnable += symDict[typeArray[1]];
              } else {
                returnable += symDict[typeArray[1]].toLowerCase();
              }
            } else {
              counter++;
            }
          }
          if (counter > 0) {
            returnable += counter;
          }
          if (rank > 1) {
            returnable += '/';
          }
        }
        return returnable;
      },
      setFEN: function(fenString) {
        var c, fen, i, _i, _len, _ref, _results;
        this.reset;
        fen = fenString.split(' ');
        castle['black']['short'] = __indexOf.call(fen[2], 'k') >= 0;
        castle['white']['short'] = __indexOf.call(fen[2], 'K') >= 0;
        castle['black']['long'] = __indexOf.call(fen[2], 'q') >= 0;
        castle['white']['long'] = __indexOf.call(fen[2], 'Q') >= 0;
        enPassant = fen[3] === '-' ? null : fen[3];
        turn = fen[1] === 'w' ? 'white' : 'black';
        i = 0;
        _ref = fen[0].split('');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (c === '/') {
            continue;
          }
          _results.push(parseInt(c) ? i += parseInt(c) : (placePiece(toPiece(c, true), toFile((i % 8) + 1) + (8 - (Math.floor(i / 8)))), i++));
        }
        return _results;
      },
      setPGN: function(text) {
        pgn = parsePGN(text);
        return displayPGN();
      },
      next: function() {
        this.movePGN(pgn[pgnIndex]);
        return pgnIndex++;
      },
      movePGN: function(move) {
        var castleRank, moved, pawn, piece, target, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
        castleRank = turn === 'white' ? 1 : 8;
        target = move.substring(move.length - 2);
        if (move === 'O-O') {
          movePiece("e" + castleRank, "g" + castleRank);
          movePiece("h" + castleRank, "f" + castleRank);
        } else if (move === 'O-O-O') {
          movePiece("e" + castleRank, "c" + castleRank);
          movePiece("a" + castleRank, "d" + castleRank);
        } else if (move.length === 2) {
          moved = false;
          _ref = b(".pawn." + turn);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            pawn = _ref[_i];
            if ($(pawn).data('pos') === move[0] + (parseInt(move[1]) + (turn === 'white' ? -1 : 1))) {
              movePiece($(pawn).data('pos'), move);
              moved = true;
            }
          }
          if (!moved && move[1] === (turn === 'white' ? '4' : '5')) {
            movePiece("" + move[0] + (turn === 'white' ? 2 : 7), move);
          }
        } else if (move.length === 3) {
          _ref2 = b("." + pieceDict[move[0]] + "." + turn);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            piece = _ref2[_j];
            if (__indexOf.call(candidateMoves($(piece).data('type'), $(piece).data('pos')), target) >= 0) {
              movePiece($(piece).data('pos'), target);
            }
          }
        } else if (__indexOf.call(move, 'x') >= 0 && move.length === 4) {
          if (move[0].toUpperCase() === move[0]) {
            _ref3 = b("." + pieceDict[move[0]] + "." + turn);
            for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
              piece = _ref3[_k];
              if (__indexOf.call(candidateMoves($(piece).data('type'), $(piece).data('pos')), target) >= 0) {
                movePiece($(piece).data('pos'), target);
              }
            }
          } else {
            _ref4 = b(".pawn." + turn);
            for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
              pawn = _ref4[_l];
              if ($(pawn).data('pos')[0] === move[0]) {
                movePiece($(pawn).data('pos'), target);
              }
            }
          }
        } else {
          _ref5 = b("." + pieceDict[move[0]] + "." + turn);
          for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
            piece = _ref5[_m];
            if ((_ref6 = move[1], __indexOf.call($(piece).data('pos'), _ref6) >= 0) && __indexOf.call(candidateMoves($(piece).data('type'), $(piece).data('pos')), target) >= 0) {
              movePiece($(piece).data('pos'), target);
            }
          }
        }
        return turn = turn === "white" ? "black" : "white";
      }
    };
    $(this).addClass('jquery-chess-wrapper').css({
      background: 'transparent'
    });
    for (i = 0; i <= 63; i++) {
      coord = toFile((i % 8) + 1) + (8 - (Math.floor(i / 8)));
      $('<div>').addClass("square " + ((i + Math.floor(i / 8)) % 2 === 0 ? 'light' : 'dark') + " " + coord).width(size).height(size).data('pos', coord).offset({
        top: Math.floor(i / 8) * size,
        left: i % 8 * size
      }).appendTo(board);
    }
    b('.square').droppable({
      disabled: true,
      drop: function(ev, ui) {
        var ep, opCol, promote, rank, typeArray, x, y, _ref, _ref2, _ref3, _ref4;
        ui.draggable.offset($(this).offset());
        ui.draggable.data('pos', $(this).data('pos'));
        typeArray = ui.draggable.data('type').split(' ');
        ep = null;
        promote = null;
        if (typeArray[1] === "pawn") {
          if ((_ref = $(this).data('pos')[1]) === '1' || _ref === '8') {
            promote = true;
            promotePawn($(this).data('pos'));
          }
          if ($(this).data('pos') === enPassant) {
            pieceAt("" + enPassant[0] + (enPassant[1] === '6' ? '5' : '4')).remove();
            b("." + enPassant[0] + (enPassant[1] === '6' ? '5' : '4')).data('contents', null);
          }
          if (Math.abs(parseInt(ui.draggable.data('oldPos')[1]) - parseInt($(this).data('pos')[1])) === 2) {
            _ref2 = toCart($(this).data('pos')), x = _ref2[0], y = _ref2[1];
            opCol = typeArray[0] === 'white' ? 'black' : 'white';
            if ((validSquare_(x + 1, y) && ((_ref3 = pieceAt(toFAN(x + 1, y))) != null ? _ref3.data('type') : void 0) === ("" + opCol + " pawn")) || (validSquare_(x - 1, y) && ((_ref4 = pieceAt(toFAN(x - 1, y))) != null ? _ref4.data('type') : void 0) === ("" + opCol + " pawn"))) {
              ep = toFAN(x, y + (typeArray[0] === 'white' ? -1 : 1));
            }
          }
        }
        enPassant = ep;
        if (typeArray[1] === 'king') {
          castle[typeArray[0]]['short'] = false;
          castle[typeArray[0]]['long'] = false;
          if (ui.draggable.data('oldPos')[0] === 'e') {
            rank = $(this).data('pos')[1];
            if ($(this).data('pos')[0] === 'g') {
              movePiece('h' + rank, 'f' + rank);
            }
            if ($(this).data('pos')[0] === 'c') {
              movePiece('a' + rank, 'd' + rank);
            }
          }
        }
        if (typeArray[1] === 'rook') {
          rank = typeArray[0] === 'white' ? 1 : 8;
          if (castle[typeArray[0]]['short'] && ui.draggable.data('oldPos') === ("h" + rank)) {
            castle[typeArray[0]]['short'] = false;
          }
          if (castle[typeArray[0]]['long'] && ui.draggable.data('oldPos') === ("a" + rank)) {
            castle[typeArray[0]]['long'] = false;
          }
        }
        if ($(this).data('contents')) {
          pieceAt($(this).data('pos')).remove();
        }
        if (promote == null) {
          turn = turn === "white" ? "black" : "white";
          return startTurn();
        }
      }
    });
    handler.setFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    activatePieces();
    startTurn();
    return handler;
  };
}).call(this);
