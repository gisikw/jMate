function movePGN(string,color){
  console.debug(color + " moves "+string)
  // Castling
  var target = string.substring(string.length-2)
  if(string.length == 2){
    // Pawn move
    $(".pawn."+color).each(function(i,piece){
      if($(piece).data('pos')==(string[0]+(parseInt(string[1])+(color=="white" ? -1 : 1)))){
        movePiece($(piece).data('pos'),target)
        return
      }
    })
    if(target[1] == (color == "white" ? 4 : 5) && $("."+target[0]+(color=="white" ? 2 : 7)).data('contents')==(color+" pawn")){
      movePiece(target[0]+(color=="white" ? 2 : 7),target)  
      return
    }
  } else if(string.length == 3){
    var pieceName = toPiece(string[0])
    $("."+pieceName+"."+color).each(function(i,piece){
      if($.inArray(target,candidateMoves($(this).data('type'),$(this).data('pos')))>-1){
        movePiece($(this).data('pos'),target)  
        return
      }
    })
  } else if(string[string.length-3]=="x"){
    if(string.length == 4){
      var pieceName = toPiece(string[0])
      $("."+pieceName+"."+color).each(function(i,piece){
        if($.inArray(target,candidateMoves($(piece).data('type'),$(piece).data('pos')))>-1){
          if(pieceName != "pawn" || $(piece).data('pos')[0]==string[0]){
            movePiece($(piece).data('pos'),target)  
            return
          }
        }
      })
    } else {
      console.debug("Not set up to handle non-ambiguous captures")
    }
  } else {
    console.debug("Not set up to handle non-ambiguous moves")
  }
}
