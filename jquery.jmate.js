(function($){
  $.fn.chessboard = function() {
    var board = $("<div class='jquery-chess-board'></div>")
    var size = (Math.floor(Math.min($(this).width(),$(this).height())/8))
    var ep = null

    $(this).addClass("jquery-chess-wrapper").css({'background':'transparent'})
    board.appendTo(this)
    board.height(size*8)
    board.width(size*8)

    function toOffset(string){
      return {left:"abcdefgh".indexOf(string[0])*size,top:(8-parseInt(string[1]))*size}
    }

    function placePiece(type,coords){
      $("<div>").addClass("piece " + type).width(size).height(size).offset(toOffset(coords)).appendTo(board).data('pos',coords).data('type',type)
      $("."+coords).data('contents',type)
    }

    function pieceAt(pos){
      var returnable = null
      var cont = $("."+pos).data("contents")
      if(cont){
        var sels = $("."+pos).data("contents").split(" ")
        $("."+sels[0]+"."+sels[1]).each(function(i,elem){
          if($(elem).data('pos')==pos){
            returnable = $(elem)
          }
        })
        return returnable
      } else{
        return null
      }
    }

    function movePiece(from,to){
      var square = $(".square."+to)
      var piece = pieceAt(from)
      var dest = square.position()
      $(".square."+from).data('contents',null)
      square.data('contents',piece.data('type'))
      piece.data('pos',to).data('oldPos',from).animate({
        top: dest.top,
        left: dest.left
      })
    }

    function setSquares(){
      var col = "light"
      for(var i = 0; i < 64; i++) {
        var coord = 'abcdefgh'[i%8] + (8-(Math.floor(i/8)))
        col = (col == "light") ? "dark" : "light"
        if(i%8 == 0)
          col = (col == "light") ? "dark" : "light"
        $("<div>").addClass("square " + col + " " + coord).width(size).height(size).offset({top:Math.floor(i/8)*size,left:i%8*size}).appendTo(board).data('pos',coord)
      } 
    }

    // The following two conversion methods use 1-indexing for readibility
    function numToFile(i){
      return "abcdefgh"[i-1]
    }

    function fileToNum(c){
      return "abcdefgh".indexOf(c)+1
    }

    function getSquare(s){
      return $("."+s)
    }

    function candidateMoves(type,position,threat,ignore,add){
      var white = (type.split(" ")[0] == "white")
      var iFile = fileToNum(position[0])
      var iRank = parseInt(position[1])
      var moves = []
      var color = type.split(" ")[0]
      var rank  = position[1]
      var file  = position[0]

      function inRange(x,y){
        return (x > 0 && x < 9 && y > 0 && y < 9)
      }

      function contents(s){
        if(ignore == s){
          return null
        } else if (add == s){
          return (white ? "black" : "white") + " pawn"
        } else{
          return getSquare(s).data('contents')
        }
      }

      function allied(s){
        return (contents(s) && contents(s).split(" ")[0] == color)
      }

      function opposed(s){
        return !allied(s)
      }

      function rookMoves(){
        // Up
        var i = 1
        while(inRange(iFile,iRank+i) && !contents(file+(iRank+i)))
        {
          moves.push(file+(iRank+i))
          i++
        }
        if(inRange(iFile,iRank+i) && opposed(file+(iRank+i)))
          moves.push(file+(iRank+i))

        // Right
        var i = 1
        while(inRange(iFile+i,iRank) && !contents(numToFile(iFile+i)+rank))
        {
          moves.push(numToFile(iFile+i)+rank)
          i++
        }
        if(inRange(iFile+i,iRank) && opposed(numToFile(iFile+i)+rank))
          moves.push(numToFile(iFile+i)+rank)

        // Down
        var i = 1
        while(inRange(iFile,iRank-i) && !contents(file+(iRank-i)))
        {
          moves.push(file+(iRank-i))
          i++
        }
        if(inRange(iFile,iRank-i) && opposed(file+(iRank-i)))
          moves.push(file+(iRank-i))

        // Left
        var i = 1
        while(inRange(iFile-i,iRank) && !contents(numToFile(iFile-i)+rank))
        {
          moves.push(numToFile(iFile-i)+rank)
          i++
        }
        if(inRange(iFile-i,iRank) && opposed(numToFile(iFile-i)+rank))
          moves.push(numToFile(iFile-i)+rank)
      }

      function bishopMoves(){
        // Up Right
        var i = 1
        while(inRange(iFile+i,iRank+i) && !contents(numToFile(iFile+i)+(iRank+i)))
        {
          moves.push(numToFile(iFile+i)+(iRank+i))
          i++
        }
        if(inRange(iFile+i,iRank+i) && opposed(numToFile(iFile+i)+(iRank+i)))
          moves.push(numToFile(iFile+i)+(iRank+i))

        // Down Right
        var i = 1
        while(inRange(iFile+i,iRank-i) && !contents(numToFile(iFile+i)+(iRank-i)))
        {
          moves.push(numToFile(iFile+i)+(iRank-i))
          i++
        }
        if(inRange(iFile+i,iRank-i) && opposed(numToFile(iFile+i)+(iRank-i)))
          moves.push(numToFile(iFile+i)+(iRank-i))

        // Down Left
        var i = 1
        while(inRange(iFile-i,iRank-i) && !contents(numToFile(iFile-i)+(iRank-i)))
        {
          moves.push(numToFile(iFile-i)+(iRank-i))
          i++
        }
        if(inRange(iFile-i,iRank-i) && opposed(numToFile(iFile-i)+(iRank-i)))
          moves.push(numToFile(iFile-i)+(iRank-i))

        // Up Left
        var i = 1
        while(inRange(iFile-i,iRank+i) && !contents(numToFile(iFile-i)+(iRank+i)))
        {
          moves.push(numToFile(iFile-i)+(iRank+i))
          i++
        }
        if(inRange(iFile-i,iRank+i) && opposed(numToFile(iFile-i)+(iRank+i)))
          moves.push(numToFile(iFile-i)+(iRank+i))
      }

      switch(type.split(" ")[1]){
        case "pawn":
          var yDir = white ? 1 : -1
          if(!threat){
            // Move forward 1 square
            if(!contents(file+(iRank+yDir))){
              moves.push(file+(iRank+yDir))
              // Move forward 2 squares
              if(iRank == (white ? 2 : 7))
                if(!contents(file+(iRank+yDir+yDir))) 
                  moves.push(file+(iRank+yDir+yDir))
            }

            // En passant
            if(pieceAt(position).data('enPassant')){
              ep = numToFile(iFile+pieceAt(position).data('enPassant'))+(iRank+(white ? 1 : -1))
              moves.push(numToFile(iFile+pieceAt(position).data('enPassant'))+(iRank+(white ? 1 : -1)))
            }
          }
          // Capture to the left
          if(iFile < 8){
            var p = numToFile(iFile+1)+(iRank+yDir)
            if((contents(p) && opposed(p))||threat)
              moves.push(numToFile(iFile+1)+(iRank+yDir))
          }
          // Capture to the right
          if(iFile > 1){
            var p = numToFile(iFile-1)+(iRank+yDir)
            if((contents(p) && opposed(p))||threat)
              moves.push(numToFile(iFile-1)+(iRank+yDir))
          }
          break

        case "knight":
          // Clockwise 
          $([
            [iFile+1,iRank+2],
            [iFile+2,iRank+1],
            [iFile+2,iRank-1],
            [iFile+1,iRank-2],
            [iFile-1,iRank-2],
            [iFile-2,iRank-1],
            [iFile-2,iRank+1],
            [iFile-1,iRank+2]
          ]).each(function(i,cart){
            if(inRange(cart[0],cart[1]) && !allied(numToFile(cart[0])+cart[1])){
              moves.push(numToFile(cart[0])+cart[1])
            }
          })
          break

        case "bishop":
          bishopMoves()
          break

        case "rook":
          rookMoves()
          break

        case "queen":
          bishopMoves()
          rookMoves()
          break

        case "king":
          // Clockwise 
          $([
            [iFile,iRank+1],
            [iFile+1,iRank+1],
            [iFile+1,iRank],
            [iFile+1,iRank-1],
            [iFile,iRank-1],
            [iFile-1,iRank-1],
            [iFile-1,iRank],
            [iFile-1,iRank+1]
          ]).each(function(i,cart){
            if(inRange(cart[0],cart[1]) && !allied(numToFile(cart[0])+cart[1])){
              moves.push(numToFile(cart[0])+cart[1])
            }
          })
          if(!threat){
            // King-side Castle
            if(
              $(".king."+color).data('castleKingside') && 
              !contents('f'+rank) && 
              !contents('g'+rank) &&
              !threatens('e'+rank,'black') &&
              !threatens('f'+rank,'black') &&
              !threatens('g'+rank,'black')
            )
              moves.push('g'+rank)
            // Queen-side Castle
            if(
              $(".king."+color).data('castleQueenside') && 
              $(".king."+color).data('check') == false &&
              !contents('b'+rank) && 
              !contents('c'+rank) && 
              !contents('d'+rank) &&
              !threatens('e'+rank,'black') &&
              !threatens('d'+rank,'black') &&
              !threatens('c'+rank,'black')
            )
              moves.push('c'+rank)
          }
          break
      }
      
      if(threat){
        return moves
      } else if(type.split(" ")[1] == "king"){
        var verifiedMoves = []
        $(moves).each(function(i,square){
          if(!threatens(square,(white ? "black" : "white"))) 
            verifiedMoves.push(square)
        })
        return verifiedMoves
      } else{
        var kingPos = $(".king."+color).data("pos")
        var verifiedMoves = []
        $(moves).each(function(i,square){
          if(!threatens(kingPos,(white ? "black" : "white"),position,square))
            verifiedMoves.push(square)
        })
        return verifiedMoves
      }
    }

    function threatens(square,color,ignore,add){
      var returnable = false
      $(".piece."+color).each(function(i,piece){
        // console.debug("Candidate moves for "+$(piece).data('type')+" at "+$(piece).data('pos')+" are "+candidateMoves($(piece).data('type'),$(piece).data('pos'),true,ignore,add))
        if($(piece).data('pos') != add){
          if($.inArray(square,candidateMoves($(piece).data('type'),$(piece).data('pos'),true,ignore,add))>-1)
            returnable = true
        }
      })
      return returnable
    }

    function resetGame(){
      $(".piece").remove()

      placePiece("black rook",  "a8")
      placePiece("black knight","b8")
      placePiece("black bishop","c8")
      placePiece("black queen", "d8")
      placePiece("black king",  "e8")
      placePiece("black bishop","f8")
      placePiece("black knight","g8")
      placePiece("black rook",  "h8")
      
      placePiece("white rook",  "a1")
      placePiece("white knight","b1")
      placePiece("white bishop","c1")
      placePiece("white queen", "d1")
      placePiece("white king",  "e1")
      placePiece("white bishop","f1")
      placePiece("white knight","g1")
      placePiece("white rook",  "h1")

      for(var i=0; i<8; i++){
        placePiece("black pawn","abcdefgh"[i] + "7")
        placePiece("white pawn","abcdefgh"[i] + "2")
      }

      $(".king").data('castleQueenside',true)
      $(".king").data('castleKingside',true)
      $(".king").data('check',false)

      $(".square").droppable({
        disabled: true,
        drop: function(ev,ui){

          // Placement
          ui.draggable.offset($(this).offset())
          ui.draggable.data('pos',$(this).data('pos'))

          $(".pawn").data("enPassant",false)

          // Capturing en Passant
          if(ep && ep==$(this).data('pos')){
            var pos = $(this).data('pos')
            pieceAt(pos[0]+(pos[1]=="6" ? 5 : 4)).remove()
            $("."+(pos[0]+(pos[1]=="6" ? 5 : 4))).data("contents",null)
            ep = null
          }

          // Flagging en Passant
          if(ui.draggable.data('type').split(" ")[1] == "pawn"){
            var pawn = ui.draggable
            var oldPos = pawn.data('oldPos')
            var pos = pawn.data('pos')
            var color = pawn.data('type').split(" ")[0]
            var white = (color == "white")

            if(oldPos[1] == (white ? 2 : 7) && pos[1] == (white ? 4 : 5)){
              var iFile = fileToNum(pos[0])
              var piece
              if(iFile > 1){
                piece = pieceAt(numToFile(iFile-1)+pos[1]) 
                if(piece && piece.data('type')==((white ? "black" : "white")+" pawn")){
                  piece.data("enPassant",1)
                }
              }
              if(iFile < 8){
                piece = pieceAt(numToFile(iFile+1)+pos[1]) 
                if(piece && piece.data('type')==((white ? "black" : "white")+" pawn")){
                  piece.data("enPassant",-1)
                }
              }
            }
          }

          // Respond to Castling
          if(ui.draggable.data('type').split(" ")[1] == "king"){
            var king = ui.draggable
            var oldPos = king.data('oldPos')
            var pos = king.data('pos')
            var rank = (king.data('type').split(" ")[0] == "white") ? 1 : 8

            if(oldPos == ('e'+rank) && pos == ('g'+rank))
              movePiece('h'+rank,'f'+rank)

            if(oldPos == ('e'+rank) && pos == ('c'+rank))
              movePiece('a'+rank,'d'+rank)
          }

          // Handle Castling Permissions
          if(ui.draggable.data('type').split(" ")[1] == "king"){
            ui.draggable.data("castleKingside",false)
            ui.draggable.data("castleQueenside",false)
          }
          if(ui.draggable.data('type').split(" ")[1] == "rook"){
            var color = ui.draggable.data('type').split(" ")[0]
            var king = $(".king."+color)
            if(king.data('castleKingside') && ui.draggable.data('oldPos')==(color == "white" ? "h1" : "h8"))
              king.data('castleKingside',false)
            if(king.data('castleQueenside') && ui.draggable.data('oldPos')==(color == "white" ? "a1" : "a8"))
              king.data('castleQueenside',false)

          }

          // COLLISION DETECTION
          $(".piece").each(function(i,piece){
            if($(piece).attr('class') === ui.draggable.attr('class'))
              return true
            if($(piece).offset().top === ui.draggable.offset().top && $(piece).offset().left === ui.draggable.offset().left){
              $(piece).remove()
            }
          })
          // END COLLISION DETECTION
        }
      })

      $(".piece").draggable({
        revert: 'invalid',
        start:  function(ev,ui){
          var moves = candidateMoves($(this).data('type'),$(this).data('pos'))
          $(this).data('oldPos',$(this).data('pos'))
          $(this).data('candidates',moves)
          $(this).css({'z-index':5})
          $("."+$(this).data('pos')).toggleClass("active")
          $(moves).each(function(i,coord){
            $("."+coord).toggleClass("candidate")
            $("."+coord).droppable("option","disabled",false)
          })
        },
        stop:   function(ev,ui){
          $(this).css({'z-index':1})
          $("."+$(this).data('oldPos')).toggleClass("active")
          $("."+$(this).data('oldPos')).data('contents',null)
          $("."+$(this).data('pos')).data('contents',$(this).data('type'))
          $($(this).data('candidates')).each(function(i,coord){
            $("."+coord).toggleClass("candidate")
            $("."+coord).droppable("option","disabled",true)
          })
        }
      })

    }

    // Main Code
    setSquares()
    resetGame()
  }
})(jQuery)
